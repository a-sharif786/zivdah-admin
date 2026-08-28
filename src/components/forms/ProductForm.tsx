import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { TextField, MenuItem, Switch, FormControlLabel, Button, Stack, Typography, InputAdornment } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { ImageUploadField } from '@/components/common/ImageUploadField';
import type { ProductRequestDto, ProductResponseDto } from '@/types/product';

const CATEGORIES = ['VEGETABLE', 'FRUIT', 'MILK', 'PULSE', 'GROCERY'];

interface FormState {
  name: string;
  category: string;
  brand: string;
  price: string;
  discountPrice: string;
  unit: string;
  stockQuantity: string;
  expiryDate: Dayjs | null;
  organic: boolean;
  description: string;
}

const EMPTY: FormState = {
  name: '',
  category: '',
  brand: '',
  price: '',
  discountPrice: '',
  unit: '',
  stockQuantity: '',
  expiryDate: null,
  organic: false,
  description: '',
};

export function ProductForm({
  initial,
  onSubmit,
  submitting,
  requireImage,
}: {
  initial?: ProductResponseDto | null;
  onSubmit: (dto: ProductRequestDto, image: File | null) => void;
  submitting?: boolean;
  requireImage: boolean;
}) {
  const [values, setValues] = useState<FormState>(EMPTY);
  const [image, setImage] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (initial) {
      setValues({
        name: initial.name,
        category: initial.category,
        brand: initial.brand ?? '',
        price: String(initial.price),
        discountPrice: initial.discountPrice != null ? String(initial.discountPrice) : '',
        unit: initial.unit,
        stockQuantity: String(initial.stockQuantity),
        expiryDate: initial.expiryDate ? dayjs(initial.expiryDate) : null,
        organic: initial.organic ?? false,
        description: initial.description ?? '',
      });
    } else {
      setValues(EMPTY);
    }
    setImage(null);
    setTouched(false);
  }, [initial]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const missingImage = requireImage && !initial && !image;
  const errors = {
    name: !values.name,
    category: !values.category,
    price: !values.price,
    unit: !values.unit,
    stockQuantity: !values.stockQuantity,
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean) || missingImage) return;

    const dto: ProductRequestDto = {
      id: initial?.id,
      name: values.name,
      category: values.category as ProductRequestDto['category'],
      price: Number(values.price),
      discountPrice: values.discountPrice ? Number(values.discountPrice) : undefined,
      unit: values.unit,
      stockQuantity: Number(values.stockQuantity),
      expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : undefined,
      description: values.description || undefined,
      organic: values.organic,
      brand: values.brand || undefined,
      fav: initial?.fav,
    };
    onSubmit(dto, image);
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
      <TextField
        label="Name"
        value={values.name}
        onChange={(e) => set('name', e.target.value)}
        error={touched && errors.name}
        helperText={touched && errors.name ? 'Name is required' : undefined}
        fullWidth
        required
      />
      <TextField
        select
        label="Category"
        value={values.category}
        onChange={(e) => set('category', e.target.value)}
        error={touched && errors.category}
        helperText={touched && errors.category ? 'Category is required' : undefined}
        fullWidth
        required
      >
        {CATEGORIES.map((c) => (
          <MenuItem key={c} value={c}>
            {c}
          </MenuItem>
        ))}
      </TextField>
      <TextField label="Brand" value={values.brand} onChange={(e) => set('brand', e.target.value)} fullWidth />
      <TextField
        label="Price"
        type="number"
        value={values.price}
        onChange={(e) => set('price', e.target.value)}
        error={touched && errors.price}
        helperText={touched && errors.price ? 'Price is required' : undefined}
        slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
        fullWidth
        required
      />
      <TextField
        label="Discount Price"
        type="number"
        value={values.discountPrice}
        onChange={(e) => set('discountPrice', e.target.value)}
        slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
        fullWidth
      />
      <TextField
        label="Unit"
        placeholder="kg, litre, pack..."
        value={values.unit}
        onChange={(e) => set('unit', e.target.value)}
        error={touched && errors.unit}
        helperText={touched && errors.unit ? 'Unit is required' : undefined}
        fullWidth
        required
      />
      <TextField
        label="Stock Quantity"
        type="number"
        value={values.stockQuantity}
        onChange={(e) => set('stockQuantity', e.target.value)}
        error={touched && errors.stockQuantity}
        helperText={touched && errors.stockQuantity ? 'Stock quantity is required' : undefined}
        fullWidth
        required
      />
      <DatePicker
        label="Expiry Date"
        value={values.expiryDate}
        onChange={(v) => set('expiryDate', v)}
        slotProps={{ textField: { fullWidth: true } }}
      />
      <FormControlLabel
        control={<Switch checked={values.organic} onChange={(e) => set('organic', e.target.checked)} />}
        label="Organic"
      />
      <TextField
        label="Description"
        value={values.description}
        onChange={(e) => set('description', e.target.value)}
        multiline
        rows={3}
        fullWidth
      />
      <Button type="submit" variant="contained" size="large" loading={submitting}>
        {initial ? 'Update Product' : 'Create Product'}
      </Button>
    </Stack>
  );
}
