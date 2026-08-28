import { useQueries, useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { useAuth } from '@/hooks/useAuth';
import { productApi } from '@/api/productApi';
import { inventoryApi } from '@/api/inventoryApi';
import { formatDateTime } from '@/utils/format';
import type { InventoryResponseDto } from '@/types/inventory';

// There is no vendor-scoped bulk inventory endpoint in the backend, so this page
// composes the view client-side: fetch this vendor's own product ids, then look up
// inventory for each one individually via the existing per-product endpoint.
export function MyInventoryPage() {
  const { user } = useAuth();
  const vendorId = user!.id;

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

  const rows: (InventoryResponseDto & { productName: string })[] = (products ?? [])
    .map((p, idx) => {
      const inv = inventoryQueries[idx]?.data;
      if (!inv) return null;
      return { ...inv, productName: p.name };
    })
    .filter((r): r is InventoryResponseDto & { productName: string } => r !== null);

  const loading = productsLoading || inventoryQueries.some((q) => q.isLoading);

  return (
    <div>
      <PageHeader title="My Inventory" />
      <DataTable
        rowKey="productId"
        loading={loading}
        dataSource={rows}
        emptyText="No inventory records found for your products yet"
        columns={[
          { title: 'Product', dataIndex: 'productName' },
          { title: 'Product ID', dataIndex: 'productId' },
          { title: 'Available', dataIndex: 'availableQuantity' },
          { title: 'Reserved', dataIndex: 'reservedQuantity' },
          { title: 'Last Updated', dataIndex: 'lastUpdated', render: (v) => formatDateTime(v as string) },
        ]}
      />
    </div>
  );
}
