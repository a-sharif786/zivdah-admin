import type { OrderResponseDto } from '@/types/order';

export type ConversationType = 'BOT' | 'HUMAN';

export type ConversationStatus = 'OPEN' | 'WAITING' | 'ACTIVE' | 'CLOSED';

// Set by chat-service's intent classifier once a topic is detected on the conversation —
// feeds the analytics breakdown, otherwise purely informational for list/detail views.
export type ConversationTopic = 'ORDER_STATUS' | 'REFUND' | 'PRODUCT' | 'DELIVERY' | 'ACCOUNT' | 'GENERAL';

export type MessageSenderType = 'CUSTOMER' | 'BOT' | 'AGENT' | 'SYSTEM';

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface ChatMessageDto {
  id: number;
  conversationId: number;
  senderId: number | null;
  senderType: MessageSenderType;
  messageType: MessageType;
  message: string;
  attachmentUrl?: string | null;
  status: MessageStatus;
  createdAt: string;
}

export interface ConversationSummaryDto {
  id: number;
  customerId: number;
  customerName?: string | null;
  type: ConversationType;
  status: ConversationStatus;
  assignedAgentId: number | null;
  assignedAgentName?: string | null;
  orderId: number | null;
  topic: ConversationTopic | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  // Populated once a CLOSED conversation has been rated — list pages don't need a
  // second per-row fetch to show it (see conversation_ratings / order-context response).
  rating?: number | null;
  handedOffAt?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}

// Aggregated order+payment+delivery+vendor+deliveryBoy panel shown alongside a HUMAN
// conversation. `order` reuses the existing order-service DTO verbatim (see types/order.ts)
// rather than inventing a parallel order shape for chat.
export interface OrderContextDto {
  order: OrderResponseDto | null;
  customerName?: string | null;
  paymentStatus?: string | null;
  deliveryStatus?: string | null;
  vendorName?: string | null;
  deliveryBoyName?: string | null;
  // Same rating/feedback pair as ConversationSummaryDto.rating — repeated here so the
  // order-context panel needs no second fetch once a CLOSED conversation has been rated.
  rating?: number | null;
  feedback?: string | null;
}

export interface ConversationDetailDto extends ConversationSummaryDto {
  // Messages are never embedded here by the backend (GET /conversations/{id} returns only the
  // conversation's own fields) — always fetch them separately via conversationApi.getMessages.
  orderContext?: OrderContextDto | null;
}

export interface SupportAnalyticsSeriesEntryDto {
  date: string; // ISO date (yyyy-MM-dd)
  botCount: number;
  humanCount: number;
  // Only present once enough closed/handed-off conversations exist for that day — chart
  // rendering must degrade gracefully (StatTile numbers only) when these are missing.
  avgResponseTimeSeconds?: number | null;
  avgResolutionTimeSeconds?: number | null;
}

export interface SupportAnalyticsSummaryDto {
  openCount: number;
  waitingCount: number;
  activeCount: number;
  closedCount: number;
  avgRating: number | null;
  avgFirstResponseTimeSeconds: number | null;
  avgResolutionTimeSeconds: number | null;
  series: SupportAnalyticsSeriesEntryDto[];
}

export interface SupportAgentPerformanceDto {
  agentId: number;
  displayName: string;
  conversationsHandled: number;
  avgRating: number | null;
  avgResponseTimeSeconds: number | null;
  avgResolutionTimeSeconds: number | null;
}

export interface SupportAgentDto {
  userId: number;
  displayName: string;
  email?: string | null;
  active: boolean;
  maxConcurrentChats: number;
  currentActiveChats: number;
  totalHandled: number;
  avgRating: number | null;
}

export interface CreateSupportAgentRequest {
  userId: number;
  displayName: string;
  maxConcurrentChats?: number;
}

export interface ConversationSearchParams {
  q?: string;
  customerId?: number;
  orderId?: number;
  status?: ConversationStatus;
  agentId?: number;
  from?: string;
  to?: string;
}
