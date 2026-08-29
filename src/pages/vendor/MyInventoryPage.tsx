import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { useAuth } from '@/hooks/useAuth';
import { productApi } from '@/api/productApi';
import { inventoryApi } from '@/api/inventoryApi';
import { formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { ApiError } from '@/types/common';

interface VendorInventoryRow {
  productId: number;
  productName: string;
  availableQuantity: number;
  reservedQuantity: number;
  lastUpdated: string | null;
}

// There is no vendor-scoped bulk inventory endpoint in the backend, so this page composes
// the view client-side: fetch this vendor's own product ids, then look up inventory for each
// one individually via the existing per-product endpoint. A product with no inventory row yet
// (e.g. one created before auto-seeding shipped) still gets a row here — zeros rather than
// being hidden — so there's always something to act on via "Add Stock" below.
export function MyInventoryPage() {
  const { user } = useAuth();
  const vendorId = user!.id;
  const queryClient = useQueryClient();
  const [addingFor, setAddingFor] = useState<{ productId: number; productName: string } | null>(null);
  const [quantity, setQuantity] = useState('');

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['vendor-inventory-products', vendorId],
    queryFn: () => productApi.getByVendor(vendorId, 0, 100),
  });

  const inventoryQueries = useQueries({
    queries: (products ?? []).map((p) => ({
      queryKey: ['vendor-inventory', p.id],
      queryFn: () => inventoryApi.getByProduct(p.id).catch(() => null),
      enabled: !!products,
    })),
  });

  const rows: VendorInventoryRow[] = (products ?? []).map((p, idx) => {
    const inv = inventoryQueries[idx]?.data;
    return {
      productId: p.id,
      productName: p.name,
      availableQuantity: inv?.availableQuantity ?? 0,
      reservedQuantity: inv?.reservedQuantity ?? 0,
      lastUpdated: inv?.lastUpdated ?? null,
    };
  });

  const loading = productsLoading || inventoryQueries.some((q) => q.isLoading);

  const addStockMutation = useMutation({
    mutationFn: () => inventoryApi.addStock({ productId: addingFor!.productId, quantity: Number(quantity) }),
    onSuccess: () => {
      notify.success('Stock added');
      queryClient.invalidateQueries({ queryKey: ['vendor-inventory', addingFor!.productId] });
      setAddingFor(null);
      setQuantity('');
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  return (
    <div>
      <PageHeader title="My Inventory" />
      <DataTable<VendorInventoryRow>
        rowKey="productId"
        loading={loading}
        dataSource={rows}
        emptyText="No products yet — add a product first"
        columns={[
          { title: 'Product', dataIndex: 'productName' },
          { title: 'Product ID', dataIndex: 'productId' },
          { title: 'Available', dataIndex: 'availableQuantity' },
          { title: 'Reserved', dataIndex: 'reservedQuantity' },
          { title: 'Last Updated', dataIndex: 'lastUpdated', render: (v) => formatDateTime(v as string | null) },
          {
            title: 'Actions',
            render: (_, record) => (
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setAddingFor({ productId: record.productId, productName: record.productName })}
              >
                Add Stock
              </Button>
            ),
          },
        ]}
      />
      <Dialog open={!!addingFor} onClose={() => setAddingFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Stock</DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            spacing={2.25}
            sx={{ pt: 1 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (quantity) addStockMutation.mutate();
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {addingFor?.productName}
            </Typography>
            <TextField
              label="Quantity to add"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              fullWidth
              required
              autoFocus
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
