import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography, TextField, IconButton, Chip, Button, alpha, useTheme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { formatDateTime } from '@/utils/format';
import { useSupportSocket } from '@/context/SupportSocketContext';
import type { SupportSocketStatus } from '@/context/SupportSocketContext';
import type { ChatMessageDto, MessageSenderType } from '@/types/conversation';

const SENDER_META: Record<MessageSenderType, { label: string; icon: ReactNode; align: 'flex-start' | 'flex-end' }> = {
  CUSTOMER: { label: 'Customer', icon: <PersonOutlineIcon fontSize="small" />, align: 'flex-start' },
  BOT: { label: 'Assistant', icon: <SmartToyOutlinedIcon fontSize="small" />, align: 'flex-start' },
  AGENT: { label: 'You (Agent)', icon: <SupportAgentOutlinedIcon fontSize="small" />, align: 'flex-end' },
  SYSTEM: { label: 'System', icon: <InfoOutlinedIcon fontSize="small" />, align: 'flex-start' },
};

const STATUS_CHIP_META: Record<SupportSocketStatus, { label: string; color: string }> = {
  CONNECTING: { label: 'Connecting…', color: '#3b82f6' },
  CONNECTED: { label: 'Connected', color: '#22c55e' },
  DISCONNECTED: { label: 'Disconnected', color: '#94a3b8' },
  RECONNECTING: { label: 'Reconnecting…', color: '#f59e0b' },
  FAILED: { label: 'Connection failed', color: '#ef4444' },
};

function MessageBubble({ message }: { message: ChatMessageDto }) {
  const theme = useTheme();
  const meta = SENDER_META[message.senderType];
  const isSystem = message.senderType === 'SYSTEM';
  const isAgent = message.senderType === 'AGENT';

  if (isSystem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
        <Chip
          size="small"
          icon={<InfoOutlinedIcon fontSize="small" />}
          label={message.message}
          sx={{ backgroundColor: alpha(theme.palette.text.secondary, 0.08), color: 'text.secondary' }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: meta.align, mb: 1.25 }}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mb: 0.25, px: 0.5 }}>
        {meta.icon}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {meta.label}
        </Typography>
      </Stack>
      <Paper
        elevation={0}
        sx={{
          maxWidth: '75%',
          px: 1.5,
          py: 1,
          borderRadius: 2,
          backgroundColor: isAgent ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.06),
          color: isAgent ? theme.palette.primary.contrastText : 'text.primary',
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.message}
        </Typography>
        {message.attachmentUrl && (
          <Box
            component="img"
            src={message.attachmentUrl}
            alt="attachment"
            sx={{ mt: 1, maxWidth: '100%', borderRadius: 1, display: 'block' }}
          />
        )}
      </Paper>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.25, px: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {formatDateTime(message.createdAt)}
        </Typography>
        {isAgent &&
          (message.status === 'READ' ? (
            <DoneAllIcon sx={{ fontSize: 14, color: 'primary.main' }} />
          ) : (
            <DoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          ))}
      </Stack>
    </Box>
  );
}

export interface ConversationThreadProps {
  conversationId: number;
  messages: ChatMessageDto[];
  loading?: boolean;
  /** Renders the composer + wires typing/read-receipts — omitted for read-only detail views. */
  composerEnabled?: boolean;
  /** "End Chat" button next to the status chip — omitted (like the composer) for read-only views. */
  onEndChat?: () => void;
  endingChat?: boolean;
}

/**
 * Shared message list used both live (LiveChatsPage, composer enabled) and read-only
 * (ConversationDetailPage, composer omitted via `composerEnabled=false`).
 */
export function ConversationThread({
  conversationId,
  messages,
  loading,
  composerEnabled = false,
  onEndChat,
  endingChat,
}: ConversationThreadProps) {
  const { status, sendMessage, sendTyping, sendReadReceipt, subscribeTyping, retry } = useSupportSocket();
  const [draft, setDraft] = useState('');
  const [typingActive, setTypingActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReadSentRef = useRef(0);

  const sorted = useMemo(() => (messages ?? []).slice().sort((a, b) => a.id - b.id), [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [sorted.length]);

  // Typing indicator: the envelope only carries `conversationId`, not who typed, so this
  // simply flashes "Typing…" for a few seconds after any TYPING frame on this room.
  useEffect(() => {
    if (!composerEnabled) return;
    const unsubscribe = subscribeTyping((cid) => {
      if (cid !== conversationId) return;
      setTypingActive(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingActive(false), 3000);
    });
    return () => {
      unsubscribe();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [composerEnabled, conversationId, subscribeTyping]);

  // Auto read-receipt: mark everything the agent can see (from the other party) as read
  // once it renders, mirroring the customer-side widget's read-state precedent.
  useEffect(() => {
    if (!composerEnabled) return;
    const othersMaxId = sorted.filter((m) => m.senderType !== 'AGENT').reduce((max, m) => Math.max(max, m.id), 0);
    if (othersMaxId > lastReadSentRef.current) {
      lastReadSentRef.current = othersMaxId;
      sendReadReceipt(conversationId, othersMaxId);
    }
  }, [composerEnabled, sorted, conversationId, sendReadReceipt]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage(conversationId, text);
    setDraft('');
  };

  const chipMeta = STATUS_CHIP_META[status];

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 700 }}>Conversation #{conversationId}</Typography>
        {composerEnabled && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              size="small"
              label={chipMeta.label}
              sx={{ color: chipMeta.color, backgroundColor: `${chipMeta.color}1f`, border: `1px solid ${chipMeta.color}40` }}
            />
            {status === 'FAILED' && (
              <Button size="small" variant="outlined" onClick={retry}>
                Retry
              </Button>
            )}
            {onEndChat && (
              <Button size="small" variant="outlined" color="error" loading={endingChat} onClick={onEndChat}>
                End Chat
              </Button>
            )}
          </Stack>
        )}
      </Box>

      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {loading && (
          <Typography variant="body2" color="text.secondary">
            Loading messages…
          </Typography>
        )}
        {!loading && sorted.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No messages yet.
          </Typography>
        )}
        {sorted.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </Box>

      {typingActive && composerEnabled && (
        <Box sx={{ px: 2, pb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Typing…
          </Typography>
        </Box>
      )}

      {composerEnabled && (
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                sendTyping(conversationId);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <IconButton color="primary" onClick={handleSend} disabled={!draft.trim()}>
              <SendIcon />
            </IconButton>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
