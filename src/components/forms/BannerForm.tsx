import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { TextField, Switch, FormControlLabel, Button, Stack, Typography } from '@mui/material';
import { ImageUploadField } from '@/components/common/ImageUploadField';
import type { BannerRequestDto, BannerResponseDto } from '@/types/product';

export function BannerForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: BannerResponseDto | null;
  onSubmit: (dto: BannerRequestDto, image: File | null) => void;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title ?? '');
      setActive(initial.active);
    } else {
      setTitle('');
      setActive(true);
    }
    setImage(null);
    setTouched(false);
  }, [initial]);

  const missingImage = !initial && !image;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (missingImage) return;
    onSubmit({ title, active }, image);
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2.25} sx={{ pt: 1 }}>
      <div>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Image
        </Typography>
        <ImageUploadField existingImageUrl={initial?.imageUrl} onFileSelected={setImage} />
        {touched && missingImage && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
            Image is required
          </Typography>
        )}
      </div>
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
      <FormControlLabel
        control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
        label="Active"
      />
      <Button type="submit" variant="contained" size="large" loading={submitting}>
        {initial ? 'Update Banner' : 'Create Banner'}
      </Button>
    </Stack>
  );
}
