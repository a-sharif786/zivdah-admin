import { useState } from 'react';
import { Paper, Stack, Typography, Button, Chip } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi, openInvoiceBlob } from '@/api/invoiceApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { ApiError } from '@/types/common';

interface InvoiceSectionProps {
  orderId: number;
  // Only ADMIN gets the manual "Generate Invoice" retry action (e.g. after a PDF-generation
  // hiccup — see requirement: PDF generation failure handling). Invoice generation itself is
  // otherwise fully automatic (triggered server-side the moment payment succeeds), so a
  // customer/vendor should never normally need this — they just view/download what already
  // exists.
  canGenerate?: boolean;
}

// Shared by admin's and vendor's OrderDetailPage — same component, same API calls; the backend
// (InvoiceController's ownership checks) is what actually scopes what each caller can see.
export function InvoiceSection({ orderId, canGenerate = false }: InvoiceSectionProps) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['invoice', 'order', orderId],
    queryFn: () => invoiceApi.getByOrderId(orderId),
    retry: false, // a 404 (no invoice yet) is an expected, not a retry-worthy, outcome
  });

  const generateMutation = useMutation({
    mutationFn: () => invoiceApi.generate(orderId),
    onSuccess: () => {
      notify.success('Invoice generated');
      queryClient.invalidateQueries({ queryKey: ['invoice', 'order', orderId] });
    },
    onError: (err: ApiError) => notify.error(err.message || 'Could not generate invoice'),
  });

  const viewOrDownload = async (mode: 'inline' | 'attachment') => {
    if (!invoice) return;
    setBusy(mode === 'inline' ? 'view' : 'download');
    try {
      const blob = await invoiceApi.downloadBlob(invoice.id, mode);
      openInvoiceBlob(blob, `${invoice.invoiceNumber}.pdf`, mode);
    } catch (err) {
      notify.error((err as ApiError).message || 'Could not fetch the invoice PDF');
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) return null;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Invoice
      </Typography>
      {invoice ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Chip label={invoice.invoiceNumber} color="primary" variant="outlined" />
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(invoice.invoiceDate)} · {formatCurrency(invoice.totalAmount)} · {invoice.paymentMethod ?? '-'}
          </Typography>
          <Button size="small" variant="outlined" loading={busy === 'view'} onClick={() => viewOrDownload('inline')}>
            View Invoice
          </Button>
          <Button size="small" variant="contained" loading={busy === 'download'} onClick={() => viewOrDownload('attachment')}>
            Download Invoice
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {isError ? 'No invoice has been generated for this order yet.' : ''}
          </Typography>
          {canGenerate && (
            <Button
              size="small"
              variant="outlined"
              loading={generateMutation.isPending}
              onClick={() => generateMutation.mutate()}
            >
              Generate Invoice
            </Button>
          )}
        </Stack>
      )}
    </Paper>
  );
}
