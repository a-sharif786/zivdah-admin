import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Grid, Typography, Button, Rating } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { ConversationThread } from '@/components/support/ConversationThread';
import { OrderContextPanel } from '@/components/support/OrderContextPanel';
import { conversationApi } from '@/api/conversationApi';
import { formatDateTime } from '@/utils/format';

function DescriptionItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div">
        {value}
      </Typography>
    </Grid>
  );
}

/**
 * Read-only detail view for any non-live conversation row (closed / waiting / search
 * results, etc.) — shares ConversationThread with LiveChatsPage but with the composer
 * omitted, so there is no way to send a message from here.
 */
export function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const conversationId = Number(id);

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationApi.getById(conversationId),
    enabled: Number.isFinite(conversationId),
  });

  // Messages are a separate fetch — GET /conversations/{id} never embeds them (see
  // ConversationDetailDto's note); this mirrors LiveChatsPage's own message query.
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => conversationApi.getMessages(conversationId),
    enabled: Number.isFinite(conversationId),
  });

  if (isLoading || !conversation) return <PageHeader title="Loading conversation…" />;

  return (
    <div>
      <PageHeader
        title={`Conversation #${conversation.id}`}
        extra={
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2.5}>
          <DescriptionItem label="Customer" value={conversation.customerName ?? `#${conversation.customerId}`} />
          <DescriptionItem label="Type" value={conversation.type} />
          <DescriptionItem label="Status" value={<StatusTag value={conversation.status} />} />
          <DescriptionItem label="Topic" value={conversation.topic ?? '-'} />
          <DescriptionItem
            label="Agent"
            value={conversation.assignedAgentName ?? (conversation.assignedAgentId ? `#${conversation.assignedAgentId}` : '-')}
          />
          <DescriptionItem label="Order" value={conversation.orderId ? `#${conversation.orderId}` : '-'} />
          <DescriptionItem label="Created" value={formatDateTime(conversation.createdAt)} />
          <DescriptionItem label="Closed" value={conversation.closedAt ? formatDateTime(conversation.closedAt) : '-'} />
          {conversation.rating != null && (
            <DescriptionItem label="Customer Rating" value={<Rating readOnly size="small" value={conversation.rating} />} />
          )}
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, height: 520 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ConversationThread
            conversationId={conversation.id}
            messages={messages ?? []}
            loading={messagesLoading}
            composerEnabled={false}
          />
        </Box>
        {conversation.orderContext && (
          <Box sx={{ width: 320, flexShrink: 0 }}>
            <OrderContextPanel orderContext={conversation.orderContext} />
          </Box>
        )}
      </Box>
    </div>
  );
}
