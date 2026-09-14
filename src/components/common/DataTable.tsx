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
  Stack,
  Divider,
  LinearProgress,
  Typography,
  alpha,
  useTheme,
  useMediaQuery,
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
  // Below this, a table (even with the horizontal-scroll fallback TableContainer
  // already has) is genuinely hard to use — switch to one card per row instead.
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  const getCell = (col: DataTableColumn<T>, record: T, index: number): ReactNode => {
    const value = col.dataIndex ? (record as Record<string, unknown>)[col.dataIndex] : undefined;
    return col.render ? col.render(value, record, index) : (value as ReactNode);
  };

  const columnCount = columns.length + (expandedRowRender ? 1 : 0);

  // Card-view column split: the first column (commonly a name/id/thumbnail) becomes
  // the card's prominent header; a trailing column with no dataIndex (i.e. purely
  // render-based — the "Actions" column convention used across every page) sits
  // beside it instead of being buried in the label/value list below.
  const [firstCol, ...restCols] = columns;
  const trailingCol = restCols[restCols.length - 1];
  const hasTrailingActionsCol = restCols.length > 0 && !trailingCol.dataIndex;
  const bodyCols = hasTrailingActionsCol ? restCols.slice(0, -1) : restCols;

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

      {isMobile ? (
        <Stack spacing={1.25} sx={{ p: 1.5 }}>
          {dataSource.length === 0 && !loading && (
            <Typography align="center" sx={{ py: 4, color: 'text.secondary' }}>
              {emptyText}
            </Typography>
          )}
          {dataSource.map((record, index) => {
            const key = getKey(record);
            const isSelected = selectedKey === key;
            const isExpanded = expandedKeys.has(key);
            return (
              <Paper
                key={key}
                variant="outlined"
                onClick={() => {
                  if (onRowClick) {
                    setSelectedKey(key);
                    onRowClick(record);
                  }
                }}
                sx={{
                  p: 1.75,
                  cursor: onRowClick ? 'pointer' : 'default',
                  ...(isSelected && {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                  }),
                }}
              >
                {/* flexWrap, not a plain nowrap row: the trailing slot isn't always a compact
                    action button — it can be arbitrary render output (e.g. a status hint
                    sentence), and forcing it to share a line with a squeezed, wrapping header
                    text made the two visually collide (single-line trailing text vertically
                    centered against a now-two-line header). Letting it drop to its own line
                    when it doesn't fit avoids that entirely. */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 1, rowGap: 0.5 }}>
                  {/* flexBasis: 'auto' (not the 0% that a bare `flex: 1` shorthand implies) — the
                      wrap decision above is based on each item's hypothetical (pre-shrink) size,
                      and a 0% basis made this item invisible to that calculation, so the row
                      never wrapped even when there truly wasn't room for both children. */}
                  <Box sx={{ minWidth: 0, flexGrow: 1, flexShrink: 1, flexBasis: 'auto', fontWeight: 600 }}>
                    {getCell(firstCol, record, index)}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
                    {hasTrailingActionsCol && getCell(trailingCol, record, index)}
                    {expandedRowRender && (
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
                    )}
                  </Box>
                </Box>

                {bodyCols.length > 0 && (
                  <>
                    <Divider sx={{ my: 1.25 }} />
                    <Stack spacing={0.75}>
                      {bodyCols.map((col, i) => (
                        <Box
                          key={col.dataIndex ?? i}
                          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                            {col.title}
                          </Typography>
                          <Box sx={{ fontSize: 14, textAlign: 'right', minWidth: 0 }}>
                            {getCell(col, record, index)}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </>
                )}

                {expandedRowRender && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box
                      sx={{
                        mt: 1.25,
                        pt: 1.25,
                        borderTop: `1px dashed ${theme.palette.divider}`,
                      }}
                    >
                      {expandedRowRender(record)}
                    </Box>
                  </Collapse>
                )}
              </Paper>
            );
          })}
        </Stack>
      ) : (
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
                      {columns.map((col, i) => (
                        <TableCell key={col.dataIndex ?? i} align={col.align}>
                          {getCell(col, record, index)}
                        </TableCell>
                      ))}
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
      )}

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
