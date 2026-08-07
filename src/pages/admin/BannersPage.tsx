import { useState } from 'react';
import { Table, Button, Modal, Image, Switch, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDeleteButton } from '@/components/common/ConfirmDeleteButton';
import { BannerForm } from '@/components/forms/BannerForm';
import { bannerApi } from '@/api/productApi';
import type { BannerRequestDto, BannerResponseDto } from '@/types/product';
import type { ApiError } from '@/types/common';

export function BannersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BannerResponseDto | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['banners'], queryFn: bannerApi.getAllAdmin });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['banners'] });

  const createMutation = useMutation({
    mutationFn: ({ dto, image }: { dto: BannerRequestDto; image: File }) => bannerApi.create(dto, image),
    onSuccess: () => {
      message.success('Banner created');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto, image }: { id: number; dto: BannerRequestDto; image: File | null }) =>
      bannerApi.update(id, dto, image),
    onSuccess: () => {
      message.success('Banner updated');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bannerApi.remove(id),
    onSuccess: () => {
      message.success('Banner deleted');
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => bannerApi.toggle(id),
    onSuccess: invalidate,
    onError: (err: ApiError) => message.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Banners"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            New Banner
          </Button>
        }
      />
      <Table<BannerResponseDto>
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        pagination={false}
        columns={[
          {
            title: 'Image',
            dataIndex: 'imageUrl',
            render: (url: string) => <Image src={url} width={120} height={48} style={{ objectFit: 'cover' }} />,
          },
          { title: 'Title', dataIndex: 'title' },
          {
            title: 'Active',
            dataIndex: 'active',
            render: (active: boolean, record) => (
              <Switch checked={active} onChange={() => toggleMutation.mutate(record.id)} />
            ),
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
        title={editing ? 'Edit Banner' : 'New Banner'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <BannerForm
          initial={editing}
          onSubmit={(dto, image) =>
            editing
              ? updateMutation.mutate({ id: editing.id, dto, image })
              : image && createMutation.mutate({ dto, image })
          }
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  );
}
