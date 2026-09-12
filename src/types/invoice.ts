// Mirrors zivdah-order-service's InvoiceResponseDto.
export interface InvoiceResponseDto {
  id: number;
  invoiceNumber: string;
  orderId: number;
  customerId: number;
  customerName?: string;
  customerEmail?: string;

  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;

  paymentStatus: string;
  paymentMethod?: string;
  transactionId?: string;

  invoiceDate: string;
  // Direct (nginx-static, unauthenticated) link — see the backend's nginx config notes.
  // Prefer downloadUrl for anything the UI triggers.
  pdfUrl: string;
  // Authenticated path that validates ownership before streaming the PDF — always use this
  // one, via invoiceApi.download(), rather than pdfUrl directly.
  downloadUrl: string;

  createdAt: string;
  updatedAt?: string;
}
