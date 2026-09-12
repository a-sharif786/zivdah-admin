import { apiClient } from '@/api/client';
import type { InvoiceResponseDto } from '@/types/invoice';

const BASE = '/restful/v1/api/invoices';

export const invoiceApi = {
  // Idempotent — safe to call even if one already exists for the order (returns the existing
  // one unless force is passed). Used as the manual "Generate Invoice" retry action.
  generate: (orderId: number, force = false) =>
    apiClient.post<InvoiceResponseDto>(`${BASE}/generate/${orderId}`, { force }).then((r) => r.data),

  getByOrderId: (orderId: number) =>
    apiClient.get<InvoiceResponseDto>(`${BASE}/order/${orderId}`).then((r) => r.data),

  getById: (invoiceId: number) => apiClient.get<InvoiceResponseDto>(`${BASE}/${invoiceId}`).then((r) => r.data),

  getByCustomer: (customerId: number, page: number, size: number) =>
    apiClient
      .get<InvoiceResponseDto[]>(`${BASE}/customer/${customerId}`, { params: { page, size } })
      .then((r) => r.data),

  getAll: (page: number, size: number) =>
    apiClient.get<InvoiceResponseDto[]>(`${BASE}/all`, { params: { page, size } }).then((r) => r.data),

  // Raw PDF bytes, ownership-checked server-side — never fetch invoice.pdfUrl directly from
  // the UI (that's the unauthenticated nginx-static link, see the backend's nginx config notes).
  downloadBlob: (invoiceId: number, mode: 'inline' | 'attachment' = 'attachment') =>
    apiClient
      .get<Blob>(`${BASE}/${invoiceId}/download`, { params: { mode }, responseType: 'blob' })
      .then((r) => r.data),
};

// Triggers the browser's native download/view behavior for a fetched PDF Blob — used by both
// admin and vendor "View/Download Invoice" buttons.
export function openInvoiceBlob(blob: Blob, filename: string, mode: 'inline' | 'attachment') {
  const url = window.URL.createObjectURL(blob);
  if (mode === 'inline') {
    window.open(url, '_blank');
    // Revoke lazily — an immediate revoke can race the new tab's own PDF viewer opening the URL.
    setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
    return;
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
