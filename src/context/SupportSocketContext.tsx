import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { conversationApi } from '@/api/conversationApi';
import type { ChatMessageDto, MessageStatus } from '@/types/conversation';

/**
 * Same 5-state connection machine as the customer-facing zivdah-web widget (see the plan's
 * "Frontend: zivdah-web" section) — kept identical here so both sides of the chat feature
 * read the same way.
 */
export type SupportSocketStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'FAILED';

type WsFrameType = 'MESSAGE' | 'TYPING' | 'READ_RECEIPT' | 'PRESENCE' | 'SYSTEM' | 'ERROR';

interface WsFrame {
  type: WsFrameType;
  payload: unknown;
}

interface TypingPayload {
  conversationId?: number;
}

interface ReadReceiptPayload {
  conversationId?: number;
  lastReadMessageId?: number;
}

const MAX_RECONNECT_ATTEMPTS = 6;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

// Full jitter backoff: a random delay between 0 and the exponential cap, so many agent tabs
// reconnecting at once don't all retry in lockstep.
function backoffDelay(attempt: number): number {
  const cap = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
  return Math.random() * cap;
}

function buildWsUrl(conversationId: number, token: string): string {
  const httpBase = import.meta.env.VITE_API_BASE_URL as string;
  const wsBase = httpBase.replace(/^http/, 'ws'); // http:// -> ws://, https:// -> wss://
  return `${wsBase}/restful/v1/api/chat/ws/chat/${conversationId}?token=${encodeURIComponent(token)}`;
}

function dedupeAndSort(list: ChatMessageDto[]): ChatMessageDto[] {
  const byId = new Map(list.map((m) => [m.id, m]));
  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

interface SupportSocketContextValue {
  status: SupportSocketStatus;
  activeConversationId: number | null;
  join: (conversationId: number) => void;
  leave: (conversationId: number) => void;
  sendMessage: (conversationId: number, message: string) => void;
  sendTyping: (conversationId: number) => void;
  sendReadReceipt: (conversationId: number, lastReadMessageId: number) => void;
  subscribeTyping: (listener: (conversationId: number) => void) => () => void;
  /** Manual reconnect for the FAILED state's retry button. */
  retry: () => void;
}

const SupportSocketContext = createContext<SupportSocketContextValue | null>(null);

/**
 * One shared WebSocket connection for the whole Support subtree — matches one currently
 * "joined" conversation room at a time (see LiveChatsPage), opened/closed on selection
 * change rather than one socket per open conversation. Mounted by SupportLayout, which
 * wraps every /admin/support/* route, so every Support page can read live status/messages
 * without re-plumbing its own connection.
 */
export function SupportSocketProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SupportSocketStatus>('DISCONNECTED');
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const conversationIdRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualCloseRef = useRef(false);
  const typingListenersRef = useRef<Set<(conversationId: number) => void>>(new Set());

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const mergeIncomingMessage = useCallback(
    (conversationId: number, message: ChatMessageDto) => {
      queryClient.setQueryData<ChatMessageDto[]>(['conversation-messages', conversationId], (prev) =>
        dedupeAndSort([...(prev ?? []), message])
      );
      queryClient.invalidateQueries({ queryKey: ['support-conversations'] });
    },
    [queryClient]
  );

  // No-message-loss on (re)connect: replay anything created after the highest id already
  // cached, via the same REST endpoint the WS reconnect-replay mechanism is designed around
  // (see plan: "uses the existing REST messages?afterId= endpoint, no extra backend surface").
  const backfill = useCallback(
    async (conversationId: number) => {
      const cached = queryClient.getQueryData<ChatMessageDto[]>(['conversation-messages', conversationId]);
      const afterId = (cached ?? []).reduce((max, m) => Math.max(max, m.id), 0);
      try {
        const missed = await conversationApi.getMessages(conversationId, afterId || undefined);
        if (missed.length > 0) {
          queryClient.setQueryData<ChatMessageDto[]>(['conversation-messages', conversationId], (prev) =>
            dedupeAndSort([...(prev ?? []), ...missed])
          );
        }
      } catch {
        // best-effort — the live socket still delivers anything from this point on
      }
    },
    [queryClient]
  );

  const connect = useCallback(
    (conversationId: number) => {
      const token = useAuthStore.getState().token;
      if (!token) {
        setStatus('FAILED');
        return;
      }

      clearReconnectTimer();
      manualCloseRef.current = false;
      setStatus(attemptRef.current > 0 ? 'RECONNECTING' : 'CONNECTING');

      const ws = new WebSocket(buildWsUrl(conversationId, token));
      socketRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        setStatus('CONNECTED');
        void backfill(conversationId);
      };

      ws.onmessage = (event) => {
        let frame: WsFrame;
        try {
          frame = JSON.parse(event.data as string) as WsFrame;
        } catch {
          return;
        }

        switch (frame.type) {
          case 'MESSAGE':
          case 'SYSTEM': {
            const msg = frame.payload as ChatMessageDto;
            if (msg?.conversationId) {
              mergeIncomingMessage(msg.conversationId, msg);
              if (frame.type === 'SYSTEM') {
                // SYSTEM frames usually accompany a status change (accept/close) — refresh
                // the detail query too, not just the message list.
                queryClient.invalidateQueries({ queryKey: ['conversation', msg.conversationId] });
              }
            }
            break;
          }
          case 'PRESENCE': {
            queryClient.invalidateQueries({ queryKey: ['support-conversations'] });
            queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
            break;
          }
          case 'TYPING': {
            const payload = frame.payload as TypingPayload;
            const cid = payload?.conversationId ?? conversationId;
            typingListenersRef.current.forEach((listener) => listener(cid));
            break;
          }
          case 'READ_RECEIPT': {
            const payload = frame.payload as ReadReceiptPayload;
            const cid = payload?.conversationId;
            const lastReadMessageId = payload?.lastReadMessageId;
            if (cid && lastReadMessageId != null) {
              queryClient.setQueryData<ChatMessageDto[]>(['conversation-messages', cid], (prev) =>
                (prev ?? []).map((m) =>
                  m.id <= lastReadMessageId ? { ...m, status: 'READ' as MessageStatus } : m
                )
              );
            }
            break;
          }
          case 'ERROR':
          default:
            break;
        }
      };

      ws.onclose = () => {
        socketRef.current = null;
        if (manualCloseRef.current) {
          setStatus('DISCONNECTED');
          return;
        }
        if (attemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setStatus('FAILED');
          return;
        }
        setStatus('RECONNECTING');
        const delay = backoffDelay(attemptRef.current);
        attemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => {
          if (conversationIdRef.current === conversationId && !manualCloseRef.current) {
            connect(conversationId);
          }
        }, delay);
      };

      // onerror carries no useful detail in browsers; onclose fires immediately after and
      // owns all reconnect scheduling.
      ws.onerror = () => {};
    },
    [backfill, mergeIncomingMessage, queryClient]
  );

  const join = useCallback(
    (conversationId: number) => {
      if (conversationIdRef.current === conversationId && socketRef.current) return;
      // v1 scope: one connection at a time — switching rooms closes whatever was open first.
      manualCloseRef.current = true;
      socketRef.current?.close();
      clearReconnectTimer();
      attemptRef.current = 0;
      conversationIdRef.current = conversationId;
      setActiveConversationId(conversationId);
      connect(conversationId);
    },
    [connect]
  );

  const leave = useCallback((conversationId: number) => {
    if (conversationIdRef.current !== conversationId) return;
    manualCloseRef.current = true;
    clearReconnectTimer();
    socketRef.current?.close();
    socketRef.current = null;
    conversationIdRef.current = null;
    attemptRef.current = 0;
    setActiveConversationId(null);
    setStatus('DISCONNECTED');
  }, []);

  const retry = useCallback(() => {
    if (conversationIdRef.current == null) return;
    attemptRef.current = 0;
    connect(conversationIdRef.current);
  }, [connect]);

  const send = useCallback((frame: WsFrame) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(frame));
    }
  }, []);

  const sendMessage = useCallback(
    (conversationId: number, message: string) => {
      send({
        type: 'MESSAGE',
        payload: {
          conversationId,
          message,
          messageType: 'TEXT',
          clientMessageId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
      });
    },
    [send]
  );

  const sendTyping = useCallback(
    (conversationId: number) => {
      send({ type: 'TYPING', payload: { conversationId } });
    },
    [send]
  );

  const sendReadReceipt = useCallback(
    (conversationId: number, lastReadMessageId: number) => {
      send({ type: 'READ_RECEIPT', payload: { conversationId, lastReadMessageId } });
    },
    [send]
  );

  const subscribeTyping = useCallback((listener: (conversationId: number) => void) => {
    typingListenersRef.current.add(listener);
    return () => {
      typingListenersRef.current.delete(listener);
    };
  }, []);

  // Tear down on unmount (e.g. navigating away from the whole Support subtree).
  useEffect(() => {
    return () => {
      manualCloseRef.current = true;
      clearReconnectTimer();
      socketRef.current?.close();
    };
  }, []);

  const value = useMemo<SupportSocketContextValue>(
    () => ({
      status,
      activeConversationId,
      join,
      leave,
      sendMessage,
      sendTyping,
      sendReadReceipt,
      subscribeTyping,
      retry,
    }),
    [status, activeConversationId, join, leave, sendMessage, sendTyping, sendReadReceipt, subscribeTyping, retry]
  );

  return <SupportSocketContext.Provider value={value}>{children}</SupportSocketContext.Provider>;
}

export function useSupportSocket(): SupportSocketContextValue {
  const ctx = useContext(SupportSocketContext);
  if (!ctx) throw new Error('useSupportSocket must be used within a SupportSocketProvider');
  return ctx;
}
