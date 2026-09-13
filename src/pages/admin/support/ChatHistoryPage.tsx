import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, TextField, ToggleButton, ToggleButtonGroup, InputAdornment } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';
import dayjs, { type Dayjs } from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { conversationApi } from '@/api/conversationApi';
import { formatDateTime } from '@/utils/format';
import type { ConversationSummaryDto } from '@/types/conversation';

const API_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

type RangePreset = 'week' | 'month' | 'custom';

function rangeForPreset(preset: RangePreset, customRange: [Dayjs, Dayjs] | null): [Dayjs, Dayjs] {
  if (preset === 'week') return [dayjs().startOf('week'), dayjs().endOf('day')];
  if (preset === 'month') return [dayjs().startOf('month'), dayjs().endOf('day')];
  return customRange ?? [dayjs().startOf('week'), dayjs().endOf('day')];
}

export function ChatHistoryPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [q, setQ] = useState('');
  const [preset, setPreset] = useState<RangePreset>('week');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);
  const navigate = useNavigate();

  const [from, to] = useMemo(() => rangeForPreset(preset, customRange), [preset, customRange]);
  const fromStr = from.format(API_DATE_FORMAT);
  const toStr = to.format(API_DATE_FORMAT);

  const { items, total, isLoading } = usePagedQuery<ConversationSummaryDto>(
    ['support-conversations', 'search', q, fromStr, toStr],
    (p, s) => conversationApi.search({ q: q || undefined, from: fromStr, to: toStr, page: p, size: s }),
    page,
    size
  );

  return (
    <div>
      <PageHeader title="Chat History" subtitle="Search past conversations by customer or message text" />
      <Stack direction="row" spacing={2} useFlexGap sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search messages or customer…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 280 }}
        />
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
      <DataTable<ConversationSummaryDto>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        onRowClick={(r) => navigate(`/admin/support/conversations/${r.id}`)}
        pagination={{
          page,
          pageSize: size,
          total,
          onPageChange: setPage,
          onRowsPerPageChange: (s) => {
            setSize(s);
            setPage(0);
          },
        }}
        columns={[
          { title: 'Conversation #', dataIndex: 'id' },
          { title: 'Customer', dataIndex: 'customerId', render: (v, r) => r.customerName ?? `#${v}` },
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          { title: 'Last message', dataIndex: 'lastMessage', render: (v) => (v as string) ?? '-' },
          { title: 'Updated', dataIndex: 'updatedAt', render: (v) => formatDateTime(v as string) },
        ]}
      />
    </div>
  );
}
