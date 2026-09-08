import { useState } from 'react';
import {
  Stack,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '@/api/deliveryApi';
import { notify } from '@/utils/notify';
import { NEXT_DELIVERY_BOY_STATUSES, FAILURE_REASON_LABELS } from '@/types/delivery';
import type { DeliveryResponseDto, DeliveryStatus, FailureReason } from '@/types/delivery';
import type { ApiError } from '@/types/common';

/**
 * The Delivery portal's status-update control for one order row. Options come straight from
 * NEXT_DELIVERY_BOY_STATUSES (mirrors DeliveryServiceImpl's DELIVERY_BOY_TARGETS ∩
 * ALLOWED_TRANSITIONS on the backend) so a delivery boy is only ever offered a legal next
 * status — the backend re-validates (and re-checks assignment) regardless. Marking a
 * delivery FAILED requires a reason, enforced here to match the backend's own 400 on a
 * missing one. (This is separate from OrderDetailPage.tsx's vendor/admin-facing dropdown,
 * which uses NEXT_VENDOR_DELIVERY_STATUSES instead — the two roles drive different halves of
 * the same DeliveryStatus enum.)
 */
export function DeliveryStatusControl({
  delivery,
  onUpdated,
}: {
  delivery: DeliveryResponseDto;
  onUpdated?: (updated: DeliveryResponseDto) => void;
}) {
  const queryClient = useQueryClient();
  const nextOptions = NEXT_DELIVERY_BOY_STATUSES[delivery.status];
  const [target, setTarget] = useState<DeliveryStatus | ''>('');
  const [failureDialogOpen, setFailureDialogOpen] = useState(false);
  const [failureReason, setFailureReason] = useState<FailureReason | ''>('');
  const [failureNote, setFailureNote] = useState('');

  const mutation = useMutation({
    mutationFn: (vars: { status: DeliveryStatus; reason?: FailureReason; note?: string }) =>
      deliveryApi.updateStatus(delivery.id, vars.status, vars.reason, vars.note),
    onSuccess: (updated) => {
      notify.success(`Delivery #${updated.id} updated to ${updated.status.replace(/_/g, ' ')}`);
      // Refetches every "my-deliveries" list page so the row reflects the new status
      // immediately, wherever it's rendered (dashboard preview or the full list).
      queryClient.invalidateQueries({ queryKey: ['my-deliveries'] });
      setTarget('');
      setFailureDialogOpen(false);
      setFailureReason('');
      setFailureNote('');
      onUpdated?.(updated);
    },
    onError: (err: ApiError) => notify.error(err.message || 'Could not update delivery status'),
  });

  if (nextOptions.length === 0) {
    const waitingOnVendor = delivery.status === 'PENDING' || delivery.status === 'PACKED';
    return (
      <Typography variant="body2" color="text.secondary">
        {waitingOnVendor ? 'Awaiting vendor pickup prep' : 'No action needed'}
      </Typography>
    );
  }

  const handleApply = () => {
    if (!target) return;
    if (target === 'FAILED') {
      setFailureDialogOpen(true);
      return;
    }
    mutation.mutate({ status: target });
  };

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label="Update to"
          value={target}
          onChange={(e) => setTarget(e.target.value as DeliveryStatus)}
          disabled={mutation.isPending}
          sx={{ minWidth: 170 }}
        >
          {nextOptions.map((s) => (
            <MenuItem key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" size="small" disabled={!target} loading={mutation.isPending} onClick={handleApply}>
          Update
        </Button>
      </Stack>

      <Dialog open={failureDialogOpen} onClose={() => !mutation.isPending && setFailureDialogOpen(false)}>
        <DialogTitle>Mark delivery as failed</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
            <TextField
              select
              label="Reason"
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value as FailureReason)}
              disabled={mutation.isPending}
              required
              fullWidth
            >
              {Object.entries(FAILURE_REASON_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Note (optional)"
              value={failureNote}
              onChange={(e) => setFailureNote(e.target.value)}
              disabled={mutation.isPending}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFailureDialogOpen(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={!failureReason}
            loading={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                status: 'FAILED',
                reason: failureReason as FailureReason,
                note: failureNote || undefined,
              })
            }
          >
            Confirm Failed
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
