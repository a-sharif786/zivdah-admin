import { useEffect, useMemo, useState } from 'react';
import { Box, Paper, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ConversationThread } from '@/components/support/ConversationThread';
import { OrderContextPanel } from '@/components/support/OrderContextPanel';
import { conversationApi } from '@/api/conversationApi';
import { useSupportSocket } from '@/context/SupportSocketContext';
import { formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { ApiError } from '@/types/common';

/**
 * The 3-pane live agent view: conversation list | thread (with composer) | order context.
 * Only one WebSocket room is ever open at a time — join()/leave() below track the current
 * selection, per the v1 "one connection per currently-selected conversation" scope.
 */
export function LiveChatsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preselected = searchParams.get('conversationId');
  const [selectedId, setSelectedId] = useState<number | null>(preselected ? Number(preselected) : null);
  const { join, leave } = useSupportSocket();
  const queryClient = useQueryClient();

  const closeMutation = useMutation({
    mutationFn: (id: number) => conversationApi.close(id),
    onSuccess: (_data, id) => {
      notify.success('Conversation closed');
      queryClient.invalidateQueries({ queryKey: ['support-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      if (selectedId === id) {
        leave(id);
        setSelectedId(null);
      }
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const { data: allMine, isLoading: listLoading } = useQuery({
    queryKey: ['support-conversations', 'live'],
    queryFn: () => conversationApi.getMine(0, 50),
    refetchInterval: 30000,
  });

  const activeConversations = useMemo(
    () => (allMine ?? []).filter((c) => c.status === 'ACTIVE').sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1)),
    [allMine]
  );

  // Keeps the URL in sync so a reload/share preserves the selection.
  useEffect(() => {
    if (selectedId == null) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('conversationId', String(selectedId));
        return next;
      },
      { replace: true }
    );
  }, [selectedId, setSearchParams]);

  useEffect(() => {
    if (selectedId == null) return undefined;
    join(selectedId);
    return () => leave(selectedId);
    // join/leave are stable (useCallback in SupportSocketProvider) — only re-run on selection change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const { data: conversation } = useQuery({
    queryKey: ['conversation', selectedId ?? -1],
    queryFn: () => conversationApi.getById(selectedId as number),
    enabled: selectedId != null,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation-messages', selectedId ?? -1],
    queryFn: () => conversationApi.getMessages(selectedId as number),
    enabled: selectedId != null,
  });

  return (
    <div>
      <PageHeader title="Live Chats" subtitle="Your currently active conversations" />
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 140px)' }}>
        <Paper sx={{ width: 280, flexShrink: 0, overflowY: 'auto' }}>
          <List disablePadding>
            {!listLoading && activeConversations.length === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No active conversations. Accept one from the Waiting Queue to start.
                </Typography>
              </Box>
            )}
            {activeConversations.map((c) => (
              <ListItemButton
                key={c.id}
                selected={c.id === selectedId}
                onClick={() => setSelectedId(c.id)}
                sx={{ borderBottom: '1px solid', borderColor: 'divider', alignItems: 'flex-start', py: 1.25 }}
              >
                <ListItemText
                  primary={c.customerName ?? `Customer #${c.customerId}`}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ display: 'block' }}
                      >
                        {c.lastMessage ?? 'No messages yet'}
                      </Typography>
                      <Typography component="span" variant="caption" color="text.secondary">
                        {formatDateTime(c.lastMessageAt ?? c.updatedAt)}
                      </Typography>
                    </>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {selectedId != null ? (
            <ConversationThread
              conversationId={selectedId}
              messages={messages ?? []}
              loading={messagesLoading}
              composerEnabled
              onEndChat={() => closeMutation.mutate(selectedId)}
              endingChat={closeMutation.isPending}
            />
          ) : (
            <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">Select a conversation to start chatting</Typography>
            </Paper>
          )}
        </Box>

        <Box sx={{ width: 320, flexShrink: 0 }}>
          <OrderContextPanel orderContext={conversation?.orderContext} />
        </Box>
      </Box>
    </div>
  );
}
