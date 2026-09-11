import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Rating,
  Typography,
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import MoneyOffOutlinedIcon from '@mui/icons-material/MoneyOffOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { useQuery, useQueries } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { StatTile } from '@/components/common/StatTile';
import { DataTable } from '@/components/common/DataTable';
import { authApi } from '@/api/authApi';
import { productApi } from '@/api/productApi';
import { orderApi } from '@/api/orderApi';
import { paymentApi } from '@/api/paymentApi';
import { couponApi } from '@/api/couponApi';
import { reviewApi } from '@/api/reviewApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { useIsDark } from '@/hooks/useIsDark';
import { BRAND } from '@/theme/theme';
import type { OrderResponseDto, OrderStatus } from '@/types/order';
import type { ProductCategory } from '@/types/product';

const API_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

type RangePreset = 'week' | 'month' | 'custom';

function rangeForPreset(preset: RangePreset, customRange: [Dayjs, Dayjs] | null): [Dayjs, Dayjs] {
  if (preset === 'week') return [dayjs().startOf('week'), dayjs().endOf('day')];
  if (preset === 'month') return [dayjs().startOf('month'), dayjs().endOf('day')];
  return customRange ?? [dayjs().startOf('week'), dayjs().endOf('day')];
}

function EmptyChart({ description }: { description: string }) {
  return (
    <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
  );
}

// Client-side presentation dressing over the real backend enum (com.zivdah.product.enums.ProductCategory)
// — matches the labels/colors zivdah-web uses in its category chips, for a consistent look across apps.
const CATEGORY_META: Record<ProductCategory, { label: string; color: string }> = {
  VEGETABLE: { label: 'Vegetables', color: '#4caf50' },
  FRUIT: { label: 'Fruits', color: '#e53935' },
  MILK: { label: 'Dairy & Milk', color: '#42a5f5' },
  PULSE: { label: 'Pulses & Grains', color: '#8d6e63' },
  GROCERY: { label: 'Grocery', color: '#fb8c00' },
};
const CATEGORY_LIST = Object.keys(CATEGORY_META) as ProductCategory[];

const STATUS_COLORS: Record<string, string> = {
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
};

const USER_COMPOSITION_COLORS = { customers: '#27ae60', vendors: '#3b82f6', admins: '#f59e0b' };

export function AdminDashboardPage() {
  const [preset, setPreset] = useState<RangePreset>('week');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);
  const isDark = useIsDark();
  const navigate = useNavigate();
  const axisColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const tooltipStyle = {
    background: isDark ? '#131a2c' : '#fff',
    border: 'none',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  };
  const tooltipLabelStyle = { color: isDark ? '#e2e8f0' : '#1f2937' };

  const [from, to] = useMemo(() => rangeForPreset(preset, customRange), [preset, customRange]);
  const fromStr = from.format(API_DATE_FORMAT);
  const toStr = to.format(API_DATE_FORMAT);

  // All-time totals — current state of the platform, not affected by the date range below.
  const userStats = useQuery({ queryKey: ['dashboard', 'userStats'], queryFn: authApi.getStats });
  const productCount = useQuery({ queryKey: ['dashboard', 'productCount'], queryFn: productApi.getCount });
  const coupons = useQuery({ queryKey: ['dashboard', 'coupons'], queryFn: couponApi.getAll });

  // Range-scoped figures — recomputed whenever the date range changes.
  const orderStats = useQuery({
    queryKey: ['dashboard', 'orderStats', fromStr, toStr],
    queryFn: () => orderApi.getStats(fromStr, toStr),
  });
  const paymentStats = useQuery({
    queryKey: ['dashboard', 'paymentStats', fromStr, toStr],
    queryFn: () => paymentApi.getStats(fromStr, toStr),
  });

  // No aggregate "count by category" endpoint exists, so we page each category directly —
  // only 5 requests, and gives an accurate product-mix chart rather than sampling.
  const categoryQueries = useQueries({
    queries: CATEGORY_LIST.map((cat) => ({
      queryKey: ['dashboard', 'categoryCount', cat],
      queryFn: () => productApi.getByCategory(cat, 0, 1000),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const categoryLoading = categoryQueries.some((q) => q.isLoading);
  const categoryData = CATEGORY_LIST.map((cat, i) => ({
    category: CATEGORY_META[cat].label,
    count: categoryQueries[i]?.data?.length ?? 0,
    color: CATEGORY_META[cat].color,
  }));

  const recentOrders = useQuery({ queryKey: ['dashboard', 'recentOrders'], queryFn: () => orderApi.getAll(0, 6) });
  const recentReviews = useQuery({ queryKey: ['dashboard', 'recentReviews'], queryFn: () => reviewApi.getAll(0, 5) });

  const revenueTrend = (paymentStats.data?.series ?? []).map((d) => ({
    date: dayjs(d.date).format('DD MMM'),
    amount: d.amount,
  }));

  const statusEntries = Object.entries(orderStats.data?.statusBreakdown ?? {}) as [OrderStatus, number][];
  const statusPieData = statusEntries.map(([status, count]) => ({
    name: status,
    value: count,
    color: STATUS_COLORS[status] ?? '#94a3b8',
  }));

  const userCompositionData = userStats.data
    ? [
        { name: 'Customers', value: userStats.data.totalCustomers, color: USER_COMPOSITION_COLORS.customers },
        { name: 'Vendors', value: userStats.data.totalVendors, color: USER_COMPOSITION_COLORS.vendors },
        { name: 'Admins', value: userStats.data.totalAdmins, color: USER_COMPOSITION_COLORS.admins },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform overview across all vendors and customers" />

      {/* All-time platform totals */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Total Users"
            icon={<PersonOutlineIcon />}
            color="#3b82f6"
            value={userStats.data?.totalUsers ?? 0}
            loading={userStats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Vendors"
            icon={<StorefrontOutlinedIcon />}
            color="#8b5cf6"
            value={userStats.data?.totalVendors ?? 0}
            loading={userStats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Total Products"
            icon={<GridViewOutlinedIcon />}
            color="#f59e0b"
            value={productCount.data ?? 0}
            loading={productCount.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Active Coupons"
            icon={<LocalOfferOutlinedIcon />}
            color="#ec4899"
            value={coupons.data?.filter((c) => c.active).length ?? 0}
            loading={coupons.isLoading}
            hint={coupons.data ? `${coupons.data.length} total` : undefined}
          />
        </Grid>
      </Grid>

      {/* Date-range selector — drives everything below */}
      <Stack direction="row" spacing={2} useFlexGap sx={{ mt: 3, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          size="small"
          value={preset}
          exclusive
          onChange={(_, v) => v && setPreset(v)}
        >
          <ToggleButton value="week">This Week</ToggleButton>
          <ToggleButton value="month">This Month</ToggleButton>
          <ToggleButton value="custom">Custom</ToggleButton>
        </ToggleButtonGroup>
        {preset === 'custom' && (
          <Stack direction="row" spacing={1.5}>
            <DatePicker
              label="From"
              value={customRange?.[0] ?? null}
              onChange={(v) => v && setCustomRange([v, customRange?.[1] ?? v.endOf('day')])}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="To"
              value={customRange?.[1] ?? null}
              onChange={(v) => v && setCustomRange([customRange?.[0] ?? v.startOf('day'), v.endOf('day')])}
              slotProps={{ textField: { size: 'small' } }}
            />
          </Stack>
        )}
      </Stack>

      {(orderStats.isError || paymentStats.isError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load stats for the selected range.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Orders (all-time)"
            icon={<ShoppingCartOutlinedIcon />}
            color="#06b6d4"
            value={orderStats.data?.totalOrders ?? 0}
            loading={orderStats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Orders in range"
            icon={<CalendarMonthOutlinedIcon />}
            color="#6366f1"
            value={orderStats.data?.ordersInRange ?? 0}
            loading={orderStats.isLoading}
            hint={orderStats.data ? `Order value: ${formatCurrency(orderStats.data.revenueInRange)}` : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Payment Received (range)"
            icon={<PaidOutlinedIcon />}
            color={BRAND.primary}
            value={formatCurrency(paymentStats.data?.totalReceivedInRange ?? 0)}
            loading={paymentStats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Payment Received (all-time)"
            icon={<AccountBalanceWalletOutlinedIcon />}
            color="#16a34a"
            value={formatCurrency(paymentStats.data?.totalReceivedAllTime ?? 0)}
            loading={paymentStats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Refund (range)"
            icon={<MoneyOffOutlinedIcon />}
            color={STATUS_COLORS.REFUNDED}
            value={formatCurrency(paymentStats.data?.totalRefundedInRange ?? 0)}
            loading={paymentStats.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Refund (all-time)"
            icon={<MoneyOffOutlinedIcon />}
            color={STATUS_COLORS.REFUNDED}
            value={formatCurrency(paymentStats.data?.totalRefundedAllTime ?? 0)}
            loading={paymentStats.isLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardHeader title="Payment Received — trend" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
            <CardContent>
              {revenueTrend.length === 0 ? (
                <EmptyChart description="No successful payments in this range" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="paymentReceived" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND.primary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={BRAND.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="date" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      width={90}
                      stroke={axisColor}
                      tick={{ fill: axisColor, fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(v) => formatCurrency(Number(v))}
                      contentStyle={tooltipStyle}
                      labelStyle={tooltipLabelStyle}
                    />
                    <Area type="monotone" dataKey="amount" stroke={BRAND.primary} fill="url(#paymentReceived)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardHeader title="Team Composition" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
            <CardContent>
              {userCompositionData.length === 0 ? (
                <EmptyChart description="No user data" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={userCompositionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      {userCompositionData.map((d) => (
                        <Cell key={d.name} fill={d.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardHeader title="Orders by Status (range)" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
            <CardContent>
              {statusPieData.length === 0 ? (
                <EmptyChart description="No orders in this range" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={2}
                    >
                      {statusPieData.map((d) => (
                        <Cell key={d.name} fill={d.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                    <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardHeader title="Product Mix by Category" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
            <CardContent>
              {categoryLoading && categoryData.every((d) => d.count === 0) ? (
                <EmptyChart description="Loading…" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                    <XAxis type="number" allowDecimals={false} stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      stroke={axisColor}
                      tick={{ fill: axisColor, fontSize: 12 }}
                      width={110}
                    />
                    <Tooltip
                      formatter={(v) => `${v} product${Number(v) === 1 ? '' : 's'}`}
                      contentStyle={tooltipStyle}
                      labelStyle={tooltipLabelStyle}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                      {categoryData.map((d) => (
                        <Cell key={d.category} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <DataTable<OrderResponseDto>
            title="Recent Orders"
            extra={
              <Typography component={Link} to="/admin/orders" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none' }}>
                View all
              </Typography>
            }
            rowKey="orderId"
            size="small"
            loading={recentOrders.isLoading}
            dataSource={recentOrders.data ?? []}
            onRowClick={(record) => navigate(`/admin/orders/${record.orderId}`)}
            columns={[
              { title: 'Order #', dataIndex: 'orderNumber' },
              { title: 'Total', dataIndex: 'totalAmount', render: (v, r) => formatCurrency(v as number, r.currency) },
              { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
              { title: 'Created', dataIndex: 'createdAt', render: (v) => formatDateTime(v as string) },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardHeader
              title="Recent Reviews"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
              action={
                <Typography component={Link} to="/admin/reviews" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', mr: 2 }}>
                  View all
                </Typography>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {!recentReviews.isLoading && (recentReviews.data ?? []).length === 0 ? (
                <EmptyChart description="No reviews yet" />
              ) : (
                <List disablePadding>
                  {(recentReviews.data ?? []).map((r) => (
                    <ListItem key={r.id} alignItems="flex-start" disableGutters sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.25 }}>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonOutlineIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Rating readOnly value={r.rating} size="small" />
                          <Typography variant="caption" color="text.secondary">
                            Product #{r.productId}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" noWrap title={r.comment}>
                          {r.comment || 'No comment left'}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', pl: 1 }}>
                        {formatDateTime(r.createdAt)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
