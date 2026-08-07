import { useState } from 'react';
import { Table, Button, Modal, Input, Image, message, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDeleteButton } from '@/components/common/ConfirmDeleteButton';
import { ProductForm } from '@/components/forms/ProductForm';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { productApi } from '@/api/productApi';
import { formatCurrency } from '@/utils/format';
import type { ProductRequestDto, ProductResponseDto } from '@/types/product';
import type { ApiError } from '@/types/common';

export function ProductsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
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
      message.success('Product created');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto, image }: { id: number; dto: ProductRequestDto; image: File | null }) =>
      productApi.update(id, dto, image),
    onSuccess: () => {
      message.success('Product updated');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.remove(id),
    onSuccess: () => {
      message.success('Product deleted');
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
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
            <Input.Search
              placeholder="Search products..."
              allowClear
              prefix={<SearchOutlined />}
              onSearch={(v) => {
                setKeyword(v);
                setPage(0);
              }}
              style={{ width: 240 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
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
      <Table<ProductResponseDto>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        pagination={{
          current: page + 1,
          pageSize: size,
          total,
          showSizeChanger: true,
          onChange: (p, s) => {
            setPage(p - 1);
            setSize(s);
          },
        }}
        columns={[
          {
            title: 'Image',
            dataIndex: 'imageUrl',
            width: 70,
            render: (url: string) => <Image src={url} width={48} height={48} style={{ objectFit: 'cover' }} />,
          },
          { title: 'Name', dataIndex: 'name' },
          { title: 'Category', dataIndex: 'category' },
          { title: 'Price', dataIndex: 'price', render: (v: number) => formatCurrency(v) },
          { title: 'Stock', dataIndex: 'stockQuantity' },
          {
            title: 'In Stock',
            dataIndex: 'inStock',
            render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Yes' : 'No'}</Tag>,
          },
          {
            title: 'Vendor',
            dataIndex: 'vendorId',
            render: (v: number | null) => (v ? <Tag color="blue">#{v}</Tag> : <Tag>Platform</Tag>),
          },
          {
            title: 'Actions',
            render: (_, record) => (
              <>
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(record);
                    setModalOpen(true);
                  }}
                  style={{ marginRight: 8 }}
                >
                  Edit
                </Button>
                <ConfirmDeleteButton onConfirm={() => deleteMutation.mutate(record.id)} loading={deleteMutation.isPending} />
              </>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? 'Edit Product' : 'New Product'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <ProductForm
          initial={editing}
          onSubmit={handleSubmit}
          submitting={createMutation.isPending || updateMutation.isPending}
          requireImage={!editing}
        />
      </Modal>
    </div>
  );
}
