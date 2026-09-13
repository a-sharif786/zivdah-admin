import { apiClient } from '@/api/client';
import type {
  ChatMessageDto,
  ConversationDetailDto,
  ConversationSearchParams,
  ConversationStatus,
  ConversationSummaryDto,
  CreateSupportAgentRequest,
  OrderContextDto,
  SupportAgentDto,
  SupportAgentPerformanceDto,
  SupportAnalyticsSummaryDto,
} from '@/types/conversation';

const BASE = '/restful/v1/api/chat';

export const conversationApi = {
  // Generic listing with explicit filters — the `/mine`, `/waiting`, `/all` shortcuts below
  // are what the dedicated roster/oversight pages actually use day-to-day.
  getConversations: (params: { status?: ConversationStatus; assignedToMe?: boolean; page: number; size: number }) =>
    apiClient.get<ConversationSummaryDto[]>(`${BASE}/conversations`, { params }).then((r) => r.data),

  getMine: (page: number, size: number) =>
    apiClient
      .get<ConversationSummaryDto[]>(`${BASE}/conversations/mine`, { params: { page, size } })
      .then((r) => r.data),

  getWaiting: (page: number, size: number) =>
    apiClient
      .get<ConversationSummaryDto[]>(`${BASE}/conversations/waiting`, { params: { page, size } })
      .then((r) => r.data),

  getAll: (page: number, size: number, status?: ConversationStatus) =>
    apiClient
      .get<ConversationSummaryDto[]>(`${BASE}/conversations/all`, { params: { page, size, status } })
      .then((r) => r.data),

  search: (params: ConversationSearchParams & { page: number; size: number }) =>
    apiClient.get<ConversationSummaryDto[]>(`${BASE}/conversations/search`, { params }).then((r) => r.data),

  getById: (id: number) => apiClient.get<ConversationDetailDto>(`${BASE}/conversations/${id}`).then((r) => r.data),

  getMessages: (id: number, afterId?: number) =>
    apiClient
      .get<ChatMessageDto[]>(`${BASE}/conversations/${id}/messages`, { params: { afterId } })
      .then((r) => r.data),

  accept: (id: number) =>
    apiClient.post<ConversationSummaryDto>(`${BASE}/conversations/${id}/accept`).then((r) => r.data),

  close: (id: number) =>
    apiClient.put<ConversationSummaryDto>(`${BASE}/conversations/${id}/close`).then((r) => r.data),

  getOrderContext: (id: number) =>
    apiClient.get<OrderContextDto>(`${BASE}/conversations/${id}/order-context`).then((r) => r.data),

  getAnalyticsSummary: (from: string, to: string) =>
    apiClient.get<SupportAnalyticsSummaryDto>(`${BASE}/analytics/summary`, { params: { from, to } }).then((r) => r.data),

  getAnalyticsAgents: (from: string, to: string) =>
    apiClient
      .get<SupportAgentPerformanceDto[]>(`${BASE}/analytics/agents`, { params: { from, to } })
      .then((r) => r.data),

  getAgents: () => apiClient.get<SupportAgentDto[]>(`${BASE}/agents`).then((r) => r.data),

  createAgent: (payload: CreateSupportAgentRequest) =>
    apiClient.post<SupportAgentDto>(`${BASE}/agents`, payload).then((r) => r.data),

  toggleAgent: (userId: number) =>
    apiClient.put<SupportAgentDto>(`${BASE}/agents/${userId}/toggle`).then((r) => r.data),
};
