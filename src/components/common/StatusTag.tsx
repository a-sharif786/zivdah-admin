import { Tag } from 'antd';

const COLOR_MAP: Record<string, string> = {
  // Order statuses
  CREATED: 'default',
  PAYMENT_PENDING: 'orange',
  PAID: 'cyan',
  CONFIRMED: 'blue',
  PACKING: 'geekblue',
  READY_FOR_DELIVERY: 'purple',
  OUT_FOR_DELIVERY: 'gold',
  DELIVERED: 'green',
  CANCELLED: 'red',
  REFUNDED: 'volcano',
  // Payment statuses
  PENDING: 'orange',
  PROCESSING: 'blue',
  SUCCESS: 'green',
  FAILED: 'red',
  // Notification statuses
  SENT: 'green',
  // Roles
  ADMIN: 'gold',
  VENDOR: 'blue',
  USER: 'default',
};

export function StatusTag({ value }: { value: string | null | undefined }) {
  if (!value) return <Tag>-</Tag>;
  return <Tag color={COLOR_MAP[value] ?? 'default'}>{value}</Tag>;
}

export function BooleanTag({ value, trueLabel = 'Active', falseLabel = 'Inactive' }: {
  value: boolean | null | undefined;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return <Tag color={value ? 'green' : 'default'}>{value ? trueLabel : falseLabel}</Tag>;
}
