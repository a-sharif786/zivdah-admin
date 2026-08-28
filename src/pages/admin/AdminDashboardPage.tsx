import { useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Segmented, DatePicker, Space, Empty, Alert } from 'antd';
import { UserOutlined, ShopOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { authApi } from '@/api/authApi';
import { productApi } from '@/api/productApi';
import { orderApi } from '@/api/orderApi';
import { paymentApi } from '@/api/paymentApi';
import { couponApi } from '@/api/couponApi';
import { formatCurrency } from '@/utils/format';
import type { OrderStatus } from '@/types/order';

const API_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

type RangePreset = 'week' | 'month' | 'custom';

function rangeForPreset(preset: RangePreset, customRange: [Dayjs, Dayjs] | null): [Dayjs, Dayjs] {
  if (preset === 'week') return [dayjs().startOf('week'), dayjs().endOf('day')];
  if (preset === 'month') return [dayjs().startOf('month'), dayjs().endOf('day')];
  return customRange ?? [dayjs().startOf('week'), dayjs().endOf('day')];
}

export function AdminDashboardPage() {
  const [preset, setPreset] = useState<RangePreset>('week');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);

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

  const chartData = (paymentStats.data?.series ?? []).map((d) => ({
    date: dayjs(d.date).format('DD MMM'),
    amount: d.amount,
  }));

  const statusEntries = Object.entries(orderStats.data?.statusBreakdown ?? {}) as [OrderStatus, number][];

  return (
    <div>
      <PageHeader title="Dashboard" />

      {/* All-time platform totals */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              prefix={<UserOutlined />}
              value={userStats.data?.totalUsers ?? 0}
              loading={userStats.isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Vendors"
              prefix={<ShopOutlined />}
              value={userStats.data?.totalVendors ?? 0}
              loading={userStats.isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Products" value={productCount.data ?? 0} loading={productCount.isLoading} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Coupons"
              value={coupons.data?.filter((c) => c.active).length ?? 0}
              loading={coupons.isLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Date-range selector — drives the orders/revenue section below */}
      <Space style={{ marginTop: 24, marginBottom: 16 }} wrap>
        <Segmented
          value={preset}
          onChange={(v) => setPreset(v as RangePreset)}
          options={[
            { label: 'This Week', value: 'week' },
            { label: 'This Month', value: 'month' },
            { label: 'Custom', value: 'custom' },
          ]}
        />
        {preset === 'custom' && (
          <DatePicker.RangePicker
            value={customRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) setCustomRange([dates[0], dates[1]]);
            }}
          />
        )}
      </Space>

      {(orderStats.isError || paymentStats.isError) && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Could not load stats for the selected range."
        />
      )}

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Orders (all-time)"
              prefix={<ShoppingCartOutlined />}
              value={orderStats.data?.totalOrders ?? 0}
              loading={orderStats.isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Orders in range" value={orderStats.data?.ordersInRange ?? 0} loading={orderStats.isLoading} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Payment Received (range)"
              prefix={<DollarOutlined />}
              value={formatCurrency(paymentStats.data?.totalReceivedInRange ?? 0)}
              loading={paymentStats.isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Payment Received (all-time)"
              value={formatCurrency(paymentStats.data?.totalReceivedAllTime ?? 0)}
              loading={paymentStats.isLoading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="Payment Received — trend">
            {chartData.length === 0 ? (
              <Empty description="No successful payments in this range" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="paymentReceived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} width={90} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Area type="monotone" dataKey="amount" stroke="#1677ff" fill="url(#paymentReceived)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Orders by status (range)">
            {statusEntries.length === 0 ? (
              <Empty description="No orders in this range" />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {statusEntries.map(([status, count]) => (
                  <Space key={status} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <StatusTag value={status} />
                    <strong>{count}</strong>
                  </Space>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
