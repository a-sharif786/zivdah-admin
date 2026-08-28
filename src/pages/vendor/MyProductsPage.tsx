import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, Chip, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDeleteButton } from '@/components/common/ConfirmButton';
import { DataTable } from '@/components/common/DataTable';
import { ProductForm } from '@/components/forms/ProductForm';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { useAuth } from '@/hooks/useAuth';
import { productApi } from '@/api/productApi';
import { formatCurrency } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { ProductRequestDto, ProductResponseDto } from '@/types/product';
import type { ApiError } from '@/types/common';

export function MyProductsPage() {
  const { user } = useAuth();
  const vendorId = user!.id;
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductResponseDto | null>(null);
  const queryClient = useQueryClient();

  const { items, total, isLoading } = usePagedQuery<ProductResponseDto>(
    ['vendor-products', vendorId],
    (p, s) => productApi.getByVendor(vendorId, p, s),
    page,
    size
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vendor-products', vendorId] });

  const createMutation = useMutation({
    mutationFn: ({ dto, image }: { dto: ProductRequestDto; image: File }) => productApi.create(dto, image),
    onSuccess: () => {
      notify.success('Product created');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto, image }: { id: number; dto: ProductRequestDto; image: File | null }) =>
      productApi.update(id, dto, image),
    onSuccess: () => {
      notify.success('Product updated');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.remove(id),
    onSuccess: () => {
      notify.success('Product deleted');
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="My Products"
        extra={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            New Product
          </Button>
        }
      />
      <DataTable<ProductResponseDto>
        rowKey="id"
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
          {
            title: 'Image',
            dataIndex: 'imageUrl',
            width: 70,
            render: (url) => (
              <Box component="img" src={url as string} sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }} />
            ),
          },
          { title: 'Name', dataIndex: 'name' },
          { title: 'Category', dataIndex: 'category' },
          { title: 'Price', dataIndex: 'price', render: (v) => formatCurrency(v as number) },
          { title: 'Stock', dataIndex: 'stockQuantity' },
          {
            title: 'In Stock',
            dataIndex: 'inStock',
            render: (v) => <Chip label={v ? 'Yes' : 'No'} size="small" color={v ? 'success' : 'error'} />,
          },
          {
            title: 'Actions',
            render: (_, record) => (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(record);
                    setModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                <ConfirmDeleteButton onConfirm={() => deleteMutation.mutate(record.id)} loading={deleteMutation.isPending} />
              </Box>
            ),
          },
        ]}
      />
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Edit Product' : 'New Product'}</DialogTitle>
        <DialogContent>
          <ProductForm
            initial={editing}
            onSubmit={(dto, image) =>
              editing
                ? updateMutation.mutate({ id: editing.id, dto, image })
                : image && createMutation.mutate({ dto, image })
            }
            submitting={createMutation.isPending || updateMutation.isPending}
            requireImage={!editing}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
