import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { StatTile } from '@/components/common/StatTile';
import { DataTable } from '@/components/common/DataTable';
import { authApi } from '@/api/authApi';
import { orderApi } from '@/api/orderApi';
import { payoutApi } from '@/api/payoutApi';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { useIsDark } from '@/hooks/useIsDark';
import { BRAND } from '@/theme/theme';
import { buildPayinTransactions, buildPayoutTransactions, summarizeByDate, summarizeByVendor } from '@/utils/vendorFinancials';
import { FINANCIAL_BUCKETS, type FinancialBucket } from '@/utils/financialBuckets';
import type { VendorFinancialTransaction } from '@/types/vendorFinancials';

// No paginated/date-filtered "all orders for every vendor" endpoint exists on order-service
// (only /orders/all, page+size only, and /orders/vendor/{id}, one vendor at a time) — so, same
// "fetch everything, compute client-side" convention VendorDashboardPage.tsx already uses for a
// single vendor, this pulls every order once and does the vendor/date/status slicing here.
// Revisit with a real server-side aggregate if the order volume ever outgrows this.
const ALL_ORDERS_PAGE_SIZE = 5000;

type RangePreset = 'allTime' | 'week' | 'month' | 'custom';
type TypeFilter = 'ALL' | 'PAYIN' | 'PAYOUT';
type StatusFilter = 'ALL' | FinancialBucket;

function rangeForPreset(preset: RangePreset, customRange: [Dayjs, Dayjs] | null): [Dayjs, Dayjs] {
  if (preset === 'week') return [dayjs().startOf('week'), dayjs().endOf('day')];
  if (preset === 'month') return [dayjs().startOf('month'), dayjs().endOf('day')];
  if (preset === 'custom') return customRange ?? [dayjs().startOf('week'), dayjs().endOf('day')];
  return [dayjs(0), dayjs().endOf('day')];
}

const BUCKET_META: Record<FinancialBucket, { label: string; color: string }> = {
  SUCCESSFUL: { label: 'Successful', color: '#22c55e' },
  PENDING: { label: 'Pending', color: '#f59e0b' },
  FAILED: { label: 'Failed', color: '#ef4444' },
};

function BucketChip({ bucket }: { bucket: FinancialBucket }) {
  const meta = BUCKET_META[bucket];
  return (
    <Chip
      label={meta.label}
      size="small"
      sx={{ color: meta.color, backgroundColor: `${meta.color}1f`, border: `1px solid ${meta.color}40` }}
    />
  );
}

function TypeChip({ type }: { type: 'PAYIN' | 'PAYOUT' }) {
  const color = type === 'PAYIN' ? '#06b6d4' : '#8b5cf6';
  return (
    <Chip
      label={type === 'PAYIN' ? 'Payin' : 'Payout'}
      size="small"
      sx={{ color, backgroundColor: `${color}1f`, border: `1px solid ${color}40` }}
    />
  );
}

function EmptyChart({ description }: { description: string }) {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'));
  return (
    <Box sx={{ height: isMobile ? 220 : 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
  );
}

export function VendorFinancialsPage() {
  const navigate = useNavigate();
  const isDark = useIsDark();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const chartHeight = isMobile ? 220 : 260;
  const axisColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const tooltipStyle = {
    background: isDark ? '#131a2c' : '#fff',
    border: 'none',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  };
  const tooltipLabelStyle = { color: isDark ? '#e2e8f0' : '#1f2937' };

  const [preset, setPreset] = useState<RangePreset>('allTime');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [vendorFilter, setVendorFilter] = useState<number | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [txnPage, setTxnPage] = useState(0);
  const [txnPageSize, setTxnPageSize] = useState(10);
  const [datePage, setDatePage] = useState(0);
  const [datePageSize, setDatePageSize] = useState(10);

  useEffect(() => {
    setTxnPage(0);
    setDatePage(0);
  }, [preset, customRange, vendorFilter, typeFilter, statusFilter]);

  const users = useQuery({ queryKey: ['vendor-financials', 'users'], queryFn: authApi.getAllUsers });
  const orders = useQuery({
    queryKey: ['vendor-financials', 'orders'],
    queryFn: () => orderApi.getAll(0, ALL_ORDERS_PAGE_SIZE),
  });
  const payouts = useQuery({ queryKey: ['vendor-financials', 'payouts'], queryFn: () => payoutApi.getAll() });

  const isLoading = users.isLoading || orders.isLoading || payouts.isLoading;
  const isError = users.isError || orders.isError || payouts.isError;

  const vendors = useMemo(() => (users.data ?? []).filter((u) => u.role === 'VENDOR'), [users.data]);
  const vendorNameById = useMemo(() => new Map(vendors.map((v) => [v.userId, v.name])), [vendors]);

  const allTransactions = useMemo<VendorFinancialTransaction[]>(
    () => [
      ...buildPayinTransactions(orders.data ?? [], vendorNameById),
      ...buildPayoutTransactions(payouts.data ?? [], vendorNameById),
    ],
    [orders.data, payouts.data, vendorNameById],
  );

  const [from, to] = useMemo(() => rangeForPreset(preset, customRange), [preset, customRange]);
  const inRange = (iso: string) => {
    if (preset === 'allTime') return true;
    const d = dayjs(iso);
    return !d.isBefore(from) && !d.isAfter(to);
  };

  // Date + type + status only — deliberately NOT vendor-filtered, so the summary section stays
  // "across all vendors" per the spec, independent of which single vendor is selected below.
  const overviewTxns = useMemo(
    () =>
      allTransactions.filter(
        (t) =>
          inRange(t.date) &&
          (typeFilter === 'ALL' || t.type === typeFilter) &&
          (statusFilter === 'ALL' || t.bucket === statusFilter),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTransactions, preset, from, to, typeFilter, statusFilter],
  );

  const scopedTxns = useMemo(
    () => (vendorFilter === 'ALL' ? overviewTxns : overviewTxns.filter((t) => t.vendorId === vendorFilter)),
    [overviewTxns, vendorFilter],
  );

  // Single aggregation path for both the platform-wide summary tiles and the per-vendor table —
  // the overview totals are just this same per-vendor breakdown summed back up, so the two
  // sections can never disagree with each other.
  const vendorSummariesAll = useMemo(() => summarizeByVendor(overviewTxns, vendors), [overviewTxns, vendors]);
  const overallSummary = useMemo(
    () =>
      vendorSummariesAll.reduce(
        (acc, s) => ({
          totalPayin: acc.totalPayin + s.totalPayin,
          totalPayout: acc.totalPayout + s.totalPayout,
          netBalance: acc.netBalance + s.netBalance,
          payinCount: acc.payinCount + s.payinCount,
          payoutCount: acc.payoutCount + s.payoutCount,
          successfulPayin: acc.successfulPayin + s.successfulPayin,
          pendingPayin: acc.pendingPayin + s.pendingPayin,
          failedPayin: acc.failedPayin + s.failedPayin,
          successfulPayout: acc.successfulPayout + s.successfulPayout,
          pendingPayout: acc.pendingPayout + s.pendingPayout,
          failedPayout: acc.failedPayout + s.failedPayout,
          availableBalance: acc.availableBalance + s.availableBalance,
        }),
        {
          totalPayin: 0,
          totalPayout: 0,
          netBalance: 0,
          payinCount: 0,
          payoutCount: 0,
          successfulPayin: 0,
          pendingPayin: 0,
          failedPayin: 0,
          successfulPayout: 0,
          pendingPayout: 0,
          failedPayout: 0,
          availableBalance: 0,
        },
      ),
    [vendorSummariesAll],
  );

  const vendorSummaries = useMemo(() => {
    const scopedVendors = vendorFilter === 'ALL' ? vendors : vendors.filter((v) => v.userId === vendorFilter);
    return summarizeByVendor(scopedTxns, scopedVendors);
  }, [scopedTxns, vendors, vendorFilter]);

  const dateWiseSummary = useMemo(() => summarizeByDate(scopedTxns), [scopedTxns]);
  const dateChartData = useMemo(
    () =>
      dateWiseSummary
        .slice(0, 30)
        .slice()
        .reverse()
        .map((d) => ({ ...d, label: dayjs(d.date).format('DD MMM') })),
    [dateWiseSummary],
  );

  const sortedTxns = useMemo(() => [...scopedTxns].sort((a, b) => (a.date < b.date ? 1 : -1)), [scopedTxns]);
  const pagedTxns = sortedTxns.slice(txnPage * txnPageSize, txnPage * txnPageSize + txnPageSize);
  const pagedDates = dateWiseSummary.slice(datePage * datePageSize, datePage * datePageSize + datePageSize);

  const payinBucketMix = FINANCIAL_BUCKETS.map((b) => ({
    name: BUCKET_META[b].label,
    value: scopedTxns.filter((t) => t.type === 'PAYIN' && t.bucket === b).reduce((s, t) => s + t.amount, 0),
    color: BUCKET_META[b].color,
  })).filter((d) => d.value > 0);
  const payoutBucketMix = FINANCIAL_BUCKETS.map((b) => ({
    name: BUCKET_META[b].label,
    value: scopedTxns.filter((t) => t.type === 'PAYOUT' && t.bucket === b).reduce((s, t) => s + t.amount, 0),
    color: BUCKET_META[b].color,
  })).filter((d) => d.value > 0);

  return (
    <div>
      <PageHeader
        title="Vendor Financial Dashboard"
        subtitle="Payin/Payout breakdown across all vendors, computed from existing order and payout records"
      />

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load financial data. Try refreshing the page.
        </Alert>
      )}

      {/* Filters */}
      <Stack spacing={1.5} sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup size="small" value={preset} exclusive onChange={(_, v) => v && setPreset(v)}>
            <ToggleButton value="allTime">All Time</ToggleButton>
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
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Vendor"
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            sx={{ width: { xs: '100%', sm: 220 } }}
          >
            <MenuItem value="ALL">All Vendors</MenuItem>
            {vendors.map((v) => (
              <MenuItem key={v.userId} value={v.userId}>
                {v.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Transaction Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            sx={{ width: { xs: '100%', sm: 170 } }}
          >
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="PAYIN">Payin</MenuItem>
            <MenuItem value="PAYOUT">Payout</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Transaction Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            sx={{ width: { xs: '100%', sm: 170 } }}
          >
            <MenuItem value="ALL">All</MenuItem>
            {FINANCIAL_BUCKETS.map((b) => (
              <MenuItem key={b} value={b}>
                {BUCKET_META[b].label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>

      {/* Summary — across all vendors, independent of the Vendor filter above */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Total Payin"
            icon={<PaidOutlinedIcon />}
            color={BRAND.primary}
            value={formatCurrency(overallSummary.totalPayin)}
            loading={isLoading}
            hint={`${overallSummary.payinCount} transaction${overallSummary.payinCount === 1 ? '' : 's'}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Total Payout / Deducted"
            icon={<AccountBalanceWalletOutlinedIcon />}
            color="#8b5cf6"
            value={formatCurrency(overallSummary.totalPayout)}
            loading={isLoading}
            hint={`${overallSummary.payoutCount} transaction${overallSummary.payoutCount === 1 ? '' : 's'}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Net Balance"
            icon={<AccountBalanceOutlinedIcon />}
            color="#3b82f6"
            value={formatCurrency(overallSummary.netBalance)}
            loading={isLoading}
            hint="Total Payin − Total Payout"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Transaction Counts"
            icon={<ReceiptLongOutlinedIcon />}
            color="#06b6d4"
            value={overallSummary.payinCount + overallSummary.payoutCount}
            loading={isLoading}
            hint={`${overallSummary.payinCount} Payin · ${overallSummary.payoutCount} Payout`}
          />
        </Grid>
      </Grid>

      {/* Status breakdown, across all vendors */}
      <Card sx={{ mt: 2 }}>
        <CardHeader title="Status Breakdown (all vendors)" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
        <CardContent sx={{ pt: 0 }}>
          <DataTable<{ bucket: FinancialBucket; payin: number; payout: number }>
            rowKey="bucket"
            loading={isLoading}
            dataSource={FINANCIAL_BUCKETS.map((b) => ({
              bucket: b,
              payin: b === 'SUCCESSFUL' ? overallSummary.successfulPayin : b === 'PENDING' ? overallSummary.pendingPayin : overallSummary.failedPayin,
              payout: b === 'SUCCESSFUL' ? overallSummary.successfulPayout : b === 'PENDING' ? overallSummary.pendingPayout : overallSummary.failedPayout,
            }))}
            columns={[
              { title: 'Status', render: (_v, r) => <BucketChip bucket={r.bucket} /> },
              { title: 'Payin Amount', dataIndex: 'payin', render: (v) => formatCurrency(v as number) },
              { title: 'Payout Amount', dataIndex: 'payout', render: (v) => formatCurrency(v as number) },
            ]}
          />
        </CardContent>
      </Card>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardHeader title="Payin vs Payout — daily trend" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
            <CardContent>
              {dateChartData.length === 0 ? (
                <EmptyChart description="No transactions in this range" />
              ) : (
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={dateChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="label" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
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
                    <Legend />
                    <Bar dataKey="payin" name="Payin" fill={BRAND.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="payout" name="Payout" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2} sx={{ height: '100%' }}>
            <Card>
              <CardHeader title="Payin Status Mix" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
              <CardContent>
                {payinBucketMix.length === 0 ? (
                  <EmptyChart description="No Payin transactions in this scope" />
                ) : (
                  <ResponsiveContainer width="100%" height={chartHeight / 2}>
                    <PieChart>
                      <Pie data={payinBucketMix} dataKey="value" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={3}>
                        {payinBucketMix.map((d) => (
                          <Cell key={d.name} fill={d.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                      <Legend verticalAlign="bottom" height={28} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Payout Status Mix" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
              <CardContent>
                {payoutBucketMix.length === 0 ? (
                  <EmptyChart description="No Payout transactions in this scope" />
                ) : (
                  <ResponsiveContainer width="100%" height={chartHeight / 2}>
                    <PieChart>
                      <Pie data={payoutBucketMix} dataKey="value" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={3}>
                        {payoutBucketMix.map((d) => (
                          <Cell key={d.name} fill={d.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                      <Legend verticalAlign="bottom" height={28} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Per-vendor summary */}
      <Box sx={{ mt: 2 }}>
        <DataTable
          title="Vendor-wise Financial Summary"
          rowKey="vendorId"
          loading={isLoading}
          dataSource={vendorSummaries}
          onRowClick={(r) => setVendorFilter(r.vendorId)}
          emptyText="No vendors match the current filters"
          expandedRowRender={(r) => (
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Payin</strong> — Successful: {formatCurrency(r.successfulPayin)} · Pending:{' '}
                {formatCurrency(r.pendingPayin)} · Failed: {formatCurrency(r.failedPayin)}
              </Typography>
              <Typography variant="body2">
                <strong>Payout</strong> — Successful: {formatCurrency(r.successfulPayout)} · Pending:{' '}
                {formatCurrency(r.pendingPayout)} · Failed: {formatCurrency(r.failedPayout)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Available balance is computed as successful Payin − successful Payout; there is no stored wallet
                balance in the backend to read this from directly.
              </Typography>
            </Stack>
          )}
          columns={[
            { title: 'Vendor', render: (_v, r) => `${r.vendorName} (#${r.vendorId})` },
            { title: 'Total Payin', dataIndex: 'totalPayin', align: 'right', render: (v) => formatCurrency(v as number) },
            { title: 'Total Payout', dataIndex: 'totalPayout', align: 'right', render: (v) => formatCurrency(v as number) },
            { title: 'Net Balance', dataIndex: 'netBalance', align: 'right', render: (v) => formatCurrency(v as number) },
            {
              title: 'Available Balance',
              dataIndex: 'availableBalance',
              align: 'right',
              render: (v) => formatCurrency(v as number),
            },
            { title: 'Payin Txns', dataIndex: 'payinCount', align: 'right' },
            { title: 'Payout Txns', dataIndex: 'payoutCount', align: 'right' },
          ]}
        />
      </Box>

      {/* Date-wise financial summary */}
      <Box sx={{ mt: 2 }}>
        <DataTable
          title="Date-wise Financial Summary"
          rowKey="date"
          loading={isLoading}
          dataSource={pagedDates}
          emptyText="No transactions in this range"
          pagination={{
            page: datePage,
            pageSize: datePageSize,
            total: dateWiseSummary.length,
            onPageChange: setDatePage,
            onRowsPerPageChange: (size) => {
              setDatePageSize(size);
              setDatePage(0);
            },
          }}
          columns={[
            { title: 'Date', dataIndex: 'date', render: (v) => formatDate(v as string) },
            { title: 'Payin', dataIndex: 'payin', align: 'right', render: (v) => formatCurrency(v as number) },
            { title: 'Payout', dataIndex: 'payout', align: 'right', render: (v) => formatCurrency(v as number) },
            { title: 'Net', dataIndex: 'net', align: 'right', render: (v) => formatCurrency(v as number) },
          ]}
        />
      </Box>

      {/* Transaction-wise details */}
      <Box sx={{ mt: 2 }}>
        <DataTable<VendorFinancialTransaction>
          title="Transaction-wise Details"
          rowKey="id"
          loading={isLoading}
          dataSource={pagedTxns}
          emptyText="No transactions match the current filters"
          onRowClick={(r) => {
            if (r.type === 'PAYIN' && r.orderId) navigate(`/admin/orders/${r.orderId}`);
          }}
          pagination={{
            page: txnPage,
            pageSize: txnPageSize,
            total: sortedTxns.length,
            onPageChange: setTxnPage,
            onRowsPerPageChange: (size) => {
              setTxnPageSize(size);
              setTxnPage(0);
            },
          }}
          columns={[
            { title: 'Date', dataIndex: 'date', render: (v) => formatDateTime(v as string) },
            { title: 'Vendor', render: (_v, r) => `${r.vendorName} (#${r.vendorId})` },
            { title: 'Type', render: (_v, r) => <TypeChip type={r.type} /> },
            { title: 'Reference', dataIndex: 'reference' },
            { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v) => formatCurrency(v as number) },
            {
              title: 'Status',
              render: (_v, r) => (
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <BucketChip bucket={r.bucket} />
                  <Typography variant="caption" color="text.secondary">
                    ({r.rawStatus})
                  </Typography>
                </Stack>
              ),
            },
          ]}
        />
      </Box>
    </div>
  );
}
