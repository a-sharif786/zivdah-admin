import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField, InputAdornment, Chip, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDeleteButton } from '@/components/common/ConfirmButton';
import { DataTable } from '@/components/common/DataTable';
import { ProductForm } from '@/components/forms/ProductForm';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { productApi } from '@/api/productApi';
import { formatCurrency } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { ProductRequestDto, ProductResponseDto } from '@/types/product';
import type { ApiError } from '@/types/common';

export function ProductsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductResponseDto | null>(null);
  const queryClient = useQueryClient();

  const { items, total, isLoading } = usePagedQuery<ProductResponseDto>(
    ['admin-products', keyword],
    (p, s) => (keyword ? productApi.search(keyword, p, s) : productApi.getAll(p, s)),
    page,
    size
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-products'] });

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

  const handleSubmit = (dto: ProductRequestDto, image: File | null) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, dto, image });
    } else if (image) {
      createMutation.mutate({ dto, image });
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        extra={
          <>
            <TextField
              placeholder="Search products..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setKeyword(search);
                  setPage(0);
                }
              }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
              sx={{ width: 240 }}
            />
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
          </>
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
            title: 'Vendor',
            dataIndex: 'vendorId',
            render: (v) => (v ? <Chip label={`#${v}`} size="small" color="info" /> : <Chip label="Platform" size="small" />),
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
            onSubmit={handleSubmit}
            submitting={createMutation.isPending || updateMutation.isPending}
            requireImage={!editing}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
