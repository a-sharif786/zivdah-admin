import { Table, Rate, Empty } from 'antd';
import { useQueries, useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { productApi } from '@/api/productApi';
import { reviewApi } from '@/api/reviewApi';
import { formatDateTime } from '@/utils/format';
import type { ReviewResponseDto } from '@/types/review';

// No vendor-scoped review endpoint exists, so this composes the view client-side:
// fetch this vendor's product ids, then fetch reviews per product and flatten.
export function MyReviewsPage() {
  const { user } = useAuth();
  const vendorId = user!.id;

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['vendor-review-products', vendorId],
    queryFn: () => productApi.getByVendor(vendorId, 0, 100),
  });

  const reviewQueries = useQueries({
    queries: (products ?? []).map((p) => ({
      queryKey: ['vendor-reviews', p.id],
      queryFn: () => reviewApi.getByProduct(p.id, 0, 50),
      enabled: !!products,
    })),
  });

  const productNameById = new Map((products ?? []).map((p) => [p.id, p.name]));
  const reviews: ReviewResponseDto[] = reviewQueries.flatMap((q) => q.data ?? []);
  const loading = productsLoading || reviewQueries.some((q) => q.isLoading);

  return (
    <div>
      <PageHeader title="My Reviews" />
      {!loading && reviews.length === 0 ? (
        <Empty description="No reviews on your products yet" />
      ) : (
        <Table<ReviewResponseDto>
          rowKey="id"
          loading={loading}
          dataSource={reviews}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: 'Product', render: (_, r) => productNameById.get(r.productId) ?? `#${r.productId}` },
            { title: 'User ID', dataIndex: 'userId' },
            { title: 'Rating', dataIndex: 'rating', render: (v: number) => <Rate disabled value={v} /> },
            { title: 'Comment', dataIndex: 'comment' },
            { title: 'Created', dataIndex: 'createdAt', render: formatDateTime },
          ]}
        />
      )}
    </div>
  );
}
