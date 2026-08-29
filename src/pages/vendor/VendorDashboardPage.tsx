import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import StarRateOutlinedIcon from '@mui/icons-material/StarRateOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { useQueries, useQuery } from '@tanstack/react-query';
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
import { useAuth } from '@/hooks/useAuth';
import { productApi } from '@/api/productApi';
import { orderApi } from '@/api/orderApi';
import { reviewApi } from '@/api/reviewApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { useIsDark } from '@/hooks/useIsDark';
import { BRAND } from '@/theme/theme';
import type { OrderResponseDto, OrderStatus } from '@/types/order';
import type { ProductCategory } from '@/types/product';
import type { ReviewResponseDto } from '@/types/review';

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

// Same presentation dressing over the product category enum used by AdminDashboardPage.tsx —
// kept in sync so the two dashboards look like one family.
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

// Orders in these statuses represent money the vendor has actually received (or will, once
// shipped) — excludes not-yet-paid (CREATED/PAYMENT_PENDING) and reversed
// (CANCELLED/REFUNDED) orders from every revenue figure on this page.
const REVENUE_STATUSES = new Set<OrderStatus>([
  'PAID',
  'CONFIRMED',
  'PACKING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]);

export function VendorDashboardPage() {
  const { user } = useAuth();
  const vendorId = user!.id;

  const [preset, setPreset] = useState<RangePreset>('week');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);
  const isDark = useIsDark();
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

  // No vendor-scoped stats/aggregate endpoint exists on the backend, so — same pattern
  // MyInventoryPage.tsx/MyReviewsPage.tsx already use — fetch everything this vendor owns
  // once and compute every stat/chart below client-side.
  const products = useQuery({
    queryKey: ['vendor-dashboard', 'products', vendorId],
    queryFn: () => productApi.getByVendor(vendorId, 0, 1000),
  });
  const orders = useQuery({
    queryKey: ['vendor-dashboard', 'orders', vendorId],
    queryFn: () => orderApi.getByVendor(vendorId, 0, 1000),
  });
  const reviewQueries = useQueries({
    queries: (products.data ?? []).map((p) => ({
      queryKey: ['vendor-dashboard', 'reviews', p.id],
      queryFn: () => reviewApi.getByProduct(p.id, 0, 100),
      enabled: !!products.data,
    })),
  });
  const reviewsLoading = products.isLoading || reviewQueries.some((q) => q.isLoading);
  const reviews: ReviewResponseDto[] = reviewQueries.flatMap((q) => q.data ?? []);

  const productList = products.data ?? [];
  const orderList = orders.data ?? [];
  const productNameById = new Map(productList.map((p) => [p.id, p.name]));

  const inRange = (createdAt: string) => {
    const d = dayjs(createdAt);
    return !d.isBefore(from) && !d.isAfter(to);
  };

  // A vendor's revenue for one order = the subtotal of just THEIR items — orderApi.getByVendor
  // already filters each order's `items` to this vendor's own line items server-side (see the
  // caption on MyOrdersPage.tsx) — not `order.totalAmount`, which reflects the whole,
  // possibly multi-vendor, order.
  const orderRevenue = (order: OrderResponseDto) => order.items.reduce((sum, item) => sum + item.subtotal, 0);

  const ordersInRange = orderList.filter((o) => inRange(o.createdAt));
  const reviewsInRange = reviews.filter((r) => inRange(r.createdAt));

  const revenueAllTime = orderList
    .filter((o) => REVENUE_STATUSES.has(o.status))
    .reduce((sum, o) => sum + orderRevenue(o), 0);
  const revenueInRange = ordersInRange
    .filter((o) => REVENUE_STATUSES.has(o.status))
    .reduce((sum, o) => sum + orderRevenue(o), 0);

  const outOfStockCount = productList.filter((p) => !p.inStock).length;
  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const revenueTrendMap = new Map<string, number>();
  ordersInRange
    .filter((o) => REVENUE_STATUSES.has(o.status))
    .forEach((o) => {
      const day = dayjs(o.createdAt).format('YYYY-MM-DD');
      revenueTrendMap.set(day, (revenueTrendMap.get(day) ?? 0) + orderRevenue(o));
    });
  const revenueTrend = Array.from(revenueTrendMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, amount]) => ({ date: dayjs(day).format('DD MMM'), amount }));

  const statusCounts = new Map<OrderStatus, number>();
  ordersInRange.forEach((o) => statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1));
  const statusPieData = Array.from(statusCounts.entries()).map(([status, count]) => ({
    name: status,
    value: count,
    color: STATUS_COLORS[status] ?? '#94a3b8',
  }));

  const categoryCounts = new Map<ProductCategory, number>();
  productList.forEach((p) => categoryCounts.set(p.category, (categoryCounts.get(p.category) ?? 0) + 1));
  const categoryData = CATEGORY_LIST.map((cat) => ({
    category: CATEGORY_META[cat].label,
    count: categoryCounts.get(cat) ?? 0,
    color: CATEGORY_META[cat].color,
  }));

  const productRevenue = new Map<number, number>();
  orderList.forEach((o) =>
    o.items.forEach((item) => {
      productRevenue.set(item.productId, (productRevenue.get(item.productId) ?? 0) + item.subtotal);
    })
  );
  const topProducts = Array.from(productRevenue.entries())
    .map(([productId, revenue]) => ({ product: productNameById.get(productId) ?? `#${productId}`, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const recentOrders = [...orderList].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6);
  const recentReviews = [...reviews].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name}`} subtitle="Here's a snapshot of your store" />

      {/* All-time totals */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="My Products"
            icon={<Inventory2OutlinedIcon />}
            color="#f59e0b"
            value={productList.length}
            loading={products.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Out of Stock"
            icon={<ReportProblemOutlinedIcon />}
            color="#ef4444"
            value={outOfStockCount}
            loading={products.isLoading}
            hint={products.data ? `${outOfStockCount} of ${productList.length} products` : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="My Orders (all-time)"
            icon={<ShoppingCartOutlinedIcon />}
            color="#06b6d4"
            value={orderList.length}
            loading={orders.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Average Rating"
            icon={<StarRateOutlinedIcon />}
            color="#8b5cf6"
            value={reviews.length ? avgRating.toFixed(1) : '-'}
            loading={reviewsLoading}
            hint={`Based on ${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
          />
        </Grid>
      </Grid>

      {/* Date-range selector — drives everything below */}
      <Stack direction="row" spacing={2} useFlexGap sx={{ mt: 3, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ToggleButtonGroup size="small" value={preset} exclusive onChange={(_, v) => v && setPreset(v)}>
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

      {(products.isError || orders.isError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load your dashboard data. Please try refreshing.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Orders in range"
            icon={<CalendarMonthOutlinedIcon />}
            color="#6366f1"
            value={ordersInRange.length}
            loading={orders.isLoading}
            hint={`Order value: ${formatCurrency(ordersInRange.reduce((s, o) => s + o.totalAmount, 0))}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="My Revenue (range)"
            icon={<PaidOutlinedIcon />}
            color={BRAND.primary}
            value={formatCurrency(revenueInRange)}
            loading={orders.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="My Revenue (all-time)"
            icon={<AccountBalanceWalletOutlinedIcon />}
            color="#16a34a"
            value={formatCurrency(revenueAllTime)}
            loading={orders.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="New Reviews (range)"
            icon={<RateReviewOutlinedIcon />}
            color="#ec4899"
            value={reviewsInRange.length}
            loading={reviewsLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardHeader title="My Revenue — trend" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
            <CardContent>
              {revenueTrend.length === 0 ? (
                <EmptyChart description="No paid orders in this range" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="vendorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="amount" stroke={BRAND.primary} fill="url(#vendorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardHeader title="Orders by Status (range)" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
            <CardContent>
              {statusPieData.length === 0 ? (
                <EmptyChart description="No orders in this range" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2}>
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
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardHeader title="Product Mix by Category" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
            <CardContent>
              {products.isLoading ? (
                <EmptyChart description="Loading…" />
              ) : categoryData.every((d) => d.count === 0) ? (
                <EmptyChart description="No products yet" />
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
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardHeader title="Top Products by Revenue" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
            <CardContent>
              {orders.isLoading ? (
                <EmptyChart description="Loading…" />
              ) : topProducts.length === 0 ? (
                <EmptyChart description="No sales yet" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatCurrency(v)}
                      stroke={axisColor}
                      tick={{ fill: axisColor, fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="product"
                      stroke={axisColor}
                      tick={{ fill: axisColor, fontSize: 12 }}
                      width={110}
                    />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={22} fill={BRAND.primary} />
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
              <Typography component={Link} to="/vendor/orders" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none' }}>
                View all
              </Typography>
            }
            rowKey="orderId"
            size="small"
            loading={orders.isLoading}
            dataSource={recentOrders}
            columns={[
              { title: 'Order #', dataIndex: 'orderNumber' },
              { title: 'My Items', render: (_, r) => r.items?.length ?? 0 },
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
                <Typography component={Link} to="/vendor/reviews" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', mr: 2 }}>
                  View all
                </Typography>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {!reviewsLoading && recentReviews.length === 0 ? (
                <EmptyChart description="No reviews yet" />
              ) : (
                <List disablePadding>
                  {recentReviews.map((r) => (
                    <ListItem
                      key={r.id}
                      alignItems="flex-start"
                      disableGutters
                      sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.25 }}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <PersonOutlineIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Rating readOnly value={r.rating} size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {productNameById.get(r.productId) ?? `Product #${r.productId}`}
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
