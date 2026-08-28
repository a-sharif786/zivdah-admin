import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, Switch, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDeleteButton } from '@/components/common/ConfirmButton';
import { DataTable } from '@/components/common/DataTable';
import { BannerForm } from '@/components/forms/BannerForm';
import { bannerApi } from '@/api/productApi';
import { notify } from '@/utils/notify';
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
      notify.success('Banner created');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto, image }: { id: number; dto: BannerRequestDto; image: File | null }) =>
      bannerApi.update(id, dto, image),
    onSuccess: () => {
      notify.success('Banner updated');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bannerApi.remove(id),
    onSuccess: () => {
      notify.success('Banner deleted');
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => bannerApi.toggle(id),
    onSuccess: invalidate,
    onError: (err: ApiError) => notify.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Banners"
        extra={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            New Banner
          </Button>
        }
      />
      <DataTable<BannerResponseDto>
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        columns={[
          {
            title: 'Image',
            dataIndex: 'imageUrl',
            render: (url) => (
              <Box component="img" src={url as string} sx={{ width: 120, height: 48, objectFit: 'cover', borderRadius: 1 }} />
            ),
          },
          { title: 'Title', dataIndex: 'title' },
          {
            title: 'Active',
            dataIndex: 'active',
            render: (active, record) => (
              <Switch
                checked={active as boolean}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleMutation.mutate(record.id)}
              />
            ),
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
        <DialogTitle>{editing ? 'Edit Banner' : 'New Banner'}</DialogTitle>
        <DialogContent>
          <BannerForm
            initial={editing}
            onSubmit={(dto, image) =>
              editing
                ? updateMutation.mutate({ id: editing.id, dto, image })
                : image && createMutation.mutate({ dto, image })
            }
            submitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
