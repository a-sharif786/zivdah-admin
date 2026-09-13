import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, Grid, Stack, ToggleButton, ToggleButtonGroup, Typography, Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import StarOutlineOutlinedIcon from '@mui/icons-material/StarOutlineOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { StatTile } from '@/components/common/StatTile';
import { DataTable } from '@/components/common/DataTable';
import { conversationApi } from '@/api/conversationApi';
import { useIsDark } from '@/hooks/useIsDark';
import { BRAND } from '@/theme/theme';
import type { SupportAgentPerformanceDto } from '@/types/conversation';

const API_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
type RangePreset = 'week' | 'month' | 'custom';

function rangeForPreset(preset: RangePreset, customRange: [Dayjs, Dayjs] | null): [Dayjs, Dayjs] {
  if (preset === 'week') return [dayjs().startOf('week'), dayjs().endOf('day')];
  if (preset === 'month') return [dayjs().startOf('month'), dayjs().endOf('day')];
  return customRange ?? [dayjs().startOf('week'), dayjs().endOf('day')];
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '-';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;
}

function EmptyChart({ description }: { description: string }) {
  return (
    <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
  );
}

export function SupportAnalyticsPage() {
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
  const fromStr = from.format(API_DATE_FORMAT);
  const toStr = to.format(API_DATE_FORMAT);

  const summary = useQuery({
    queryKey: ['support-analytics-summary', fromStr, toStr],
    queryFn: () => conversationApi.getAnalyticsSummary(fromStr, toStr),
  });
  const agentPerformance = useQuery({
    queryKey: ['support-analytics-agents', fromStr, toStr],
    queryFn: () => conversationApi.getAnalyticsAgents(fromStr, toStr),
  });

  const series = summary.data?.series ?? [];
  const volumeData = series.map((d) => ({ date: dayjs(d.date).format('DD MMM'), Bot: d.botCount, Human: d.humanCount }));
  const hasTimeSeries = series.some((d) => d.avgResponseTimeSeconds != null || d.avgResolutionTimeSeconds != null);
  const timeTrendData = series.map((d) => ({
    date: dayjs(d.date).format('DD MMM'),
    'Response time (s)': d.avgResponseTimeSeconds ?? null,
    'Resolution time (s)': d.avgResolutionTimeSeconds ?? null,
  }));

  return (
    <div>
      <PageHeader title="Support Analytics" subtitle="Chat volume, response times, and agent performance" />

      <Stack direction="row" spacing={2} useFlexGap sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile title="Open" icon={<ForumOutlinedIcon />} color="#94a3b8" value={summary.data?.openCount ?? 0} loading={summary.isLoading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Waiting"
            icon={<HourglassEmptyOutlinedIcon />}
            color="#f59e0b"
            value={summary.data?.waitingCount ?? 0}
            loading={summary.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Active"
            icon={<ChatOutlinedIcon />}
            color="#22c55e"
            value={summary.data?.activeCount ?? 0}
            loading={summary.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile
            title="Closed"
            icon={<DoneAllOutlinedIcon />}
            color="#64748b"
            value={summary.data?.closedCount ?? 0}
            loading={summary.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatTile
            title="Avg Rating"
            icon={<StarOutlineOutlinedIcon />}
            color="#eab308"
            value={summary.data?.avgRating != null ? summary.data.avgRating.toFixed(1) : '-'}
            loading={summary.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatTile
            title="Avg First Response Time"
            icon={<TimerOutlinedIcon />}
            color="#3b82f6"
            value={formatDuration(summary.data?.avgFirstResponseTimeSeconds)}
            loading={summary.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatTile
            title="Avg Resolution Time"
            icon={<TaskAltOutlinedIcon />}
            color={BRAND.primary}
            value={formatDuration(summary.data?.avgResolutionTimeSeconds)}
            loading={summary.isLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardHeader title="Bot vs Human Volume" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
            <CardContent>
              {volumeData.length === 0 ? (
                <EmptyChart description="No conversations in this range" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="date" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
                    <YAxis allowDecimals={false} stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                    <Legend />
                    <Bar dataKey="Bot" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Human" fill={BRAND.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardHeader
              title="Response / Resolution Time Trend"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
            />
            <CardContent>
              {!hasTimeSeries ? (
                <EmptyChart description="Not enough data yet for a time trend — see the StatTile averages above" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={timeTrendData}>
                    <defs>
                      <linearGradient id="responseTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="resolutionTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND.primary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={BRAND.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="date" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(v) => formatDuration(v as number)}
                      stroke={axisColor}
                      tick={{ fill: axisColor, fontSize: 12 }}
                    />
                    <Tooltip formatter={(v) => formatDuration(Number(v))} contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
                    <Legend />
                    <Area type="monotone" dataKey="Response time (s)" stroke="#3b82f6" fill="url(#responseTime)" strokeWidth={2} connectNulls />
                    <Area
                      type="monotone"
                      dataKey="Resolution time (s)"
                      stroke={BRAND.primary}
                      fill="url(#resolutionTime)"
                      strokeWidth={2}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <DataTable<SupportAgentPerformanceDto>
          title="Per-Agent Performance"
          rowKey="agentId"
          loading={agentPerformance.isLoading}
          dataSource={agentPerformance.data ?? []}
          columns={[
            { title: 'Agent', dataIndex: 'displayName' },
            { title: 'Conversations Handled', dataIndex: 'conversationsHandled' },
            { title: 'Avg Rating', dataIndex: 'avgRating', render: (v) => (v != null ? (v as number).toFixed(1) : '-') },
            { title: 'Avg Response Time', dataIndex: 'avgResponseTimeSeconds', render: (v) => formatDuration(v as number | null) },
            { title: 'Avg Resolution Time', dataIndex: 'avgResolutionTimeSeconds', render: (v) => formatDuration(v as number | null) },
          ]}
        />
      </Box>
    </div>
  );
}
