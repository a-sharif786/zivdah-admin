import { Box, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { StatusTag } from '@/components/common/StatusTag';
import { formatCurrency } from '@/utils/format';
import type { OrderContextDto } from '@/types/conversation';

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div">
        {value}
      </Typography>
    </Box>
  );
}

/**
 * Compact label/value panel shown alongside a HUMAN conversation whenever it has an
 * `orderId` — aggregated order+payment+delivery+vendor+deliveryBoy context so an agent
 * doesn't need to leave the chat to look the order up.
 */
export function OrderContextPanel({ orderContext, loading }: { orderContext: OrderContextDto | null | undefined; loading?: boolean }) {
  if (loading) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          Loading order context…
        </Typography>
      </Paper>
    );
  }

  if (!orderContext || !orderContext.order) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>Order Context</Typography>
        <Typography variant="body2" color="text.secondary">
          This conversation isn't linked to an order.
        </Typography>
      </Paper>
    );
  }

  const { order } = orderContext;

  return (
    <Paper sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Order Context</Typography>
      <Stack spacing={1.5}>
        <Row label="Customer" value={orderContext.customerName ?? `Customer #${order.userId}`} />
        <Row
          label="Order ID"
          value={
            <RouterLink to={`/admin/orders/${order.orderId}`} style={{ color: 'inherit', fontWeight: 600 }}>
              {order.orderNumber}
            </RouterLink>
          }
        />
        <Row label="Order Amount" value={formatCurrency(order.totalAmount, order.currency)} />
        <Row label="Payment Status" value={<StatusTag value={orderContext.paymentStatus} />} />
        <Row label="Order Status" value={<StatusTag value={order.status} />} />
        <Row label="Delivery Status" value={<StatusTag value={orderContext.deliveryStatus} />} />
        <Row label="Vendor" value={orderContext.vendorName ?? '-'} />
        <Row label="Delivery Boy" value={orderContext.deliveryBoyName ?? '-'} />
      </Stack>
    </Paper>
  );
}
