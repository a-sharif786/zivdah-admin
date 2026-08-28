import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField, Stack, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { inventoryApi } from '@/api/inventoryApi';
import { formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { InventoryResponseDto } from '@/types/inventory';
import type { ApiError } from '@/types/common';

export function InventoryPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const queryClient = useQueryClient();

  const { items, total, isLoading } = usePagedQuery<InventoryResponseDto>(
    ['admin-inventory'],
    (p, s) => inventoryApi.getAll(p, s),
    page,
    size
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });

  const addStockMutation = useMutation({
    mutationFn: () => inventoryApi.addStock({ productId: Number(productId), quantity: Number(quantity) }),
    onSuccess: () => {
      notify.success('Stock added');
      setAddModalOpen(false);
      setProductId('');
      setQuantity('');
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Inventory"
        extra={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddModalOpen(true)}>
            Add Stock
          </Button>
        }
      />
      <DataTable<InventoryResponseDto>
        rowKey="productId"
        loading={isLoading}
        dataSource={items}
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
          { title: 'Product ID', dataIndex: 'productId' },
          {
            title: 'Available',
            dataIndex: 'availableQuantity',
            render: (v) => (
              <Chip
                label={v as number}
                size="small"
                color={(v as number) <= 5 ? 'error' : (v as number) <= 20 ? 'warning' : 'success'}
              />
            ),
          },
          { title: 'Reserved', dataIndex: 'reservedQuantity' },
          { title: 'Last Updated', dataIndex: 'lastUpdated', render: (v) => formatDateTime(v as string) },
        ]}
      />
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Stock</DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            spacing={2.25}
            sx={{ pt: 1 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (productId && quantity) addStockMutation.mutate();
            }}
          >
            <TextField
              label="Product ID"
              type="number"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              fullWidth
              required
            />
            <Button type="submit" variant="contained" loading={addStockMutation.isPending}>
              Add Stock
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </div>
  );
}
