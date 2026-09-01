import { Chip } from '@mui/material';

// Hex colors (rather than antd's named palette) since MUI Chip takes a sx color, not a token name.
const COLOR_MAP: Record<string, string> = {
  // Order statuses
  CREATED: '#94a3b8',
  PAYMENT_PENDING: '#f59e0b',
  PAID: '#06b6d4',
  CONFIRMED: '#3b82f6',
  PACKING: '#6366f1',
  READY_FOR_DELIVERY: '#a855f7',
  OUT_FOR_DELIVERY: '#eab308',
  DELIVERED: '#22c55e',
  CANCELLED: '#ef4444',
  REFUNDED: '#f97316',
  // Delivery sub-statuses (READY_FOR_PICKUP shares PACKING's color family)
  PACKED: '#6366f1',
  READY_FOR_PICKUP: '#a855f7',
  PICKED_UP: '#eab308',
  ON_THE_WAY: '#eab308',
  // Payment statuses
  PENDING: '#f59e0b',
  PROCESSING: '#3b82f6',
  SUCCESS: '#22c55e',
  FAILED: '#ef4444',
  // Notification statuses
  SENT: '#22c55e',
  // Roles
  ADMIN: '#eab308',
  VENDOR: '#3b82f6',
  USER: '#94a3b8',
  DELIVERY_BOY: '#06b6d4',
};

export function StatusTag({ value }: { value: string | null | undefined }) {
  if (!value) return <Chip label="-" size="small" />;
  const color = COLOR_MAP[value] ?? '#94a3b8';
  return (
    <Chip
      label={value}
      size="small"
      sx={{
        color,
        backgroundColor: `${color}1f`,
        border: `1px solid ${color}40`,
      }}
    />
  );
}

export function BooleanTag({
  value,
  trueLabel = 'Active',
  falseLabel = 'Inactive',
}: {
  value: boolean | null | undefined;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <Chip
      label={value ? trueLabel : falseLabel}
      size="small"
      color={value ? 'success' : 'default'}
      variant={value ? 'filled' : 'outlined'}
    />
  );
}
