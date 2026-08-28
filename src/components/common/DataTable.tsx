import { Fragment, useState } from 'react';
import type { Key, ReactNode } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Collapse,
  Box,
  LinearProgress,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

export interface DataTableColumn<T> {
  title: string;
  dataIndex?: keyof T & string;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  render?: (value: unknown, record: T, index: number) => ReactNode;
}

export interface DataTablePaginationProps {
  /** 0-indexed, matching MUI's TablePagination. */
  page: number;
  pageSize: number;
  /** From usePagedQuery's size+1 probe — pass -1 if truly unknown. */
  total: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (pageSize: number) => void;
  rowsPerPageOptions?: number[];
}

/**
 * Generic Material UI replacement for antd's <Table>. Rows highlight on
 * hover and, when `onRowClick` is set, on click (selection persists until
 * another row is clicked) — a stronger tinted background plus a left
 * accent border, so "this is the row I just acted on" stays visible.
 */
export function DataTable<T extends object>({
  title,
  extra,
  columns,
  dataSource,
  rowKey,
  loading,
  pagination,
  onRowClick,
  size = 'medium',
  expandedRowRender,
  emptyText = 'No data',
}: {
  title?: ReactNode;
  extra?: ReactNode;
  columns: DataTableColumn<T>[];
  dataSource: T[];
  rowKey: (keyof T & string) | ((record: T) => Key);
  loading?: boolean;
  pagination?: DataTablePaginationProps | false;
  onRowClick?: (record: T) => void;
  size?: 'small' | 'medium';
  expandedRowRender?: (record: T) => ReactNode;
  emptyText?: ReactNode;
}) {
  const theme = useTheme();
  const [selectedKey, setSelectedKey] = useState<Key | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<ReadonlySet<Key>>(new Set());

  const getKey = (record: T): Key =>
    typeof rowKey === 'function' ? rowKey(record) : (record[rowKey] as Key);

  const toggleExpand = (key: Key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const columnCount = columns.length + (expandedRowRender ? 1 : 0);

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {(title || extra) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {typeof title === 'string' ? <Typography sx={{ fontWeight: 700 }}>{title}</Typography> : title}
          {extra}
        </Box>
      )}
      {loading && <LinearProgress />}
      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size={size}>
          <TableHead>
            <TableRow>
              {expandedRowRender && <TableCell width={40} />}
              {columns.map((col, i) => (
                <TableCell key={col.dataIndex ?? i} align={col.align} sx={{ width: col.width }}>
                  {col.title}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {dataSource.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={columnCount || 1} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {dataSource.map((record, index) => {
              const key = getKey(record);
              const isSelected = selectedKey === key;
              const isExpanded = expandedKeys.has(key);
              return (
                <Fragment key={key}>
                  <TableRow
                    hover
                    selected={isSelected}
                    onClick={() => {
                      if (onRowClick) {
                        setSelectedKey(key);
                        onRowClick(record);
                      }
                    }}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        borderLeft: `3px solid ${theme.palette.primary.main}`,
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.18),
                      },
                    }}
                  >
                    {expandedRowRender && (
                      <TableCell width={40}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(key);
                          }}
                        >
                          {isExpanded ? (
                            <KeyboardArrowDownIcon fontSize="small" />
                          ) : (
                            <KeyboardArrowRightIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                    )}
                    {columns.map((col, i) => {
                      const value = col.dataIndex ? (record as Record<string, unknown>)[col.dataIndex] : undefined;
                      return (
                        <TableCell key={col.dataIndex ?? i} align={col.align}>
                          {col.render ? col.render(value, record, index) : (value as ReactNode)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {expandedRowRender && (
                    <TableRow>
                      <TableCell colSpan={columnCount} sx={{ p: 0, border: isExpanded ? undefined : 'none' }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.03) }}>
                            {expandedRowRender(record)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          rowsPerPage={pagination.pageSize}
          onPageChange={(_, newPage) => pagination.onPageChange(newPage)}
          onRowsPerPageChange={
            pagination.onRowsPerPageChange
              ? (e) => pagination.onRowsPerPageChange!(parseInt(e.target.value, 10))
              : undefined
          }
          rowsPerPageOptions={pagination.rowsPerPageOptions ?? [10, 20, 50]}
        />
      )}
    </Paper>
  );
}
