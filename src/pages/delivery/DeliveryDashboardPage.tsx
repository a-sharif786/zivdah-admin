import { Grid, Alert, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { PageHeader } from '@/components/common/PageHeader';
import { StatTile } from '@/components/common/StatTile';
import { DataTable } from '@/components/common/DataTable';
import { StatusTag } from '@/components/common/StatusTag';
import { DeliveryStatusControl } from '@/components/delivery/DeliveryStatusControl';
import { useAuth } from '@/hooks/useAuth';
import { useMyDeliveries } from '@/hooks/useMyDeliveries';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { BRAND } from '@/theme/theme';
import type { DeliveryWithOrder } from '@/hooks/useMyDeliveries';
import type { DeliveryStatus } from '@/types/delivery';

// Same "fetch a delivery boy's whole caseload, compute client-side" reasoning as
// MyDeliveriesPage.tsx — there's no dashboard/stats endpoint on delivery-service.
const FETCH_SIZE = 100;
const ACTIVE_STATUSES = new Set<DeliveryStatus>(['PENDING', 'PACKED', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY']);

export function DeliveryDashboardPage() {
  const { user } = useAuth();
  const { rows, isLoading, isError } = useMyDeliveries(0, FETCH_SIZE);

  const active = rows.filter((r) => ACTIVE_STATUSES.has(r.delivery.status));
  const readyForPickup = rows.filter((r) => r.delivery.status === 'READY_FOR_PICKUP').length;
  const onTheWay = rows.filter((r) => r.delivery.status === 'ON_THE_WAY').length;
  const deliveredToday = rows.filter(
    (r) => r.delivery.status === 'DELIVERED' && dayjs(r.delivery.updatedAt).isSame(dayjs(), 'day')
  ).length;

  const recentActive: DeliveryWithOrder[] = [...active]
    .sort((a, b) => (a.delivery.updatedAt < b.delivery.updatedAt ? 1 : -1))
    .slice(0, 6);

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name}`} subtitle="Here's what's on your route today" />

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load your deliveries. Please try refreshing.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Active Deliveries"
            icon={<LocalShippingOutlinedIcon />}
            color="#06b6d4"
            value={active.length}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Ready for Pickup"
            icon={<Inventory2OutlinedIcon />}
            color="#a855f7"
            value={readyForPickup}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="On the Way"
            icon={<DirectionsBikeOutlinedIcon />}
            color="#eab308"
            value={onTheWay}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Delivered Today"
            icon={<CheckCircleOutlinedIcon />}
            color={BRAND.primary}
            value={deliveredToday}
            loading={isLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12 }}>
          <DataTable<DeliveryWithOrder>
            title="Active Deliveries"
            extra={
              <Typography
                component={Link}
                to="/delivery/orders"
                variant="body2"
                sx={{ color: 'primary.main', textDecoration: 'none' }}
              >
                View all
              </Typography>
            }
            rowKey={(r) => r.delivery.id}
            loading={isLoading}
            dataSource={recentActive}
            emptyText="No active deliveries right now"
            columns={[
              { title: 'Order #', render: (_, r) => r.order?.orderNumber ?? `Order #${r.delivery.orderId}` },
              {
                title: 'Amount',
                render: (_, r) => (r.order ? formatCurrency(r.order.totalAmount, r.order.currency) : '-'),
              },
              { title: 'Status', render: (_, r) => <StatusTag value={r.delivery.status} /> },
              { title: 'Assigned', render: (_, r) => formatDateTime(r.delivery.assignedAt) },
              { title: 'Action', render: (_, r) => <DeliveryStatusControl delivery={r.delivery} /> },
            ]}
          />
        </Grid>
      </Grid>
    </div>
  );
}
