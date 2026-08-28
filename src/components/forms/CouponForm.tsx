import { useState } from 'react';
import type { FormEvent } from 'react';
import { TextField, MenuItem, Button, Stack } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { type Dayjs } from 'dayjs';
import type { CouponRequestDto } from '@/types/coupon';

export function CouponForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (dto: CouponRequestDto) => void;
  submitting?: boolean;
}) {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<CouponRequestDto['discountType']>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [validFrom, setValidFrom] = useState<Dayjs | null>(dayjs());
  const [validUntil, setValidUntil] = useState<Dayjs | null>(dayjs().add(1, 'month'));
  const [touched, setTouched] = useState(false);

  const errors = {
    code: !code,
    discountValue: !discountValue,
    usageLimit: !usageLimit,
    validRange: !validFrom || !validUntil,
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean) || !validFrom || !validUntil) return;

    onSubmit({
      code: code.toUpperCase(),
      description: description || undefined,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      usageLimit: Number(usageLimit),
      validFrom: validFrom.format('YYYY-MM-DDTHH:mm:ss'),
      validUntil: validUntil.format('YYYY-MM-DDTHH:mm:ss'),
    });
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2.25} sx={{ pt: 1 }}>
      <TextField
        label="Coupon Code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        error={touched && errors.code}
        helperText={touched && errors.code ? 'Coupon code is required' : undefined}
        fullWidth
        required
      />
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={2}
        fullWidth
      />
      <TextField
        select
        label="Discount Type"
        value={discountType}
        onChange={(e) => setDiscountType(e.target.value as CouponRequestDto['discountType'])}
        fullWidth
        required
      >
        <MenuItem value="PERCENTAGE">Percentage</MenuItem>
        <MenuItem value="FIXED">Fixed Amount</MenuItem>
      </TextField>
      <TextField
        label="Discount Value"
        type="number"
        value={discountValue}
        onChange={(e) => setDiscountValue(e.target.value)}
        error={touched && errors.discountValue}
        helperText={touched && errors.discountValue ? 'Discount value is required' : undefined}
        fullWidth
        required
      />
      <TextField
        label="Minimum Order Amount"
        type="number"
        value={minOrderAmount}
        onChange={(e) => setMinOrderAmount(e.target.value)}
        fullWidth
      />
      <TextField
        label="Maximum Discount Amount"
        type="number"
        value={maxDiscountAmount}
        onChange={(e) => setMaxDiscountAmount(e.target.value)}
        fullWidth
      />
      <TextField
        label="Usage Limit"
        type="number"
        value={usageLimit}
        onChange={(e) => setUsageLimit(e.target.value)}
        error={touched && errors.usageLimit}
        helperText={touched && errors.usageLimit ? 'Usage limit is required' : undefined}
        fullWidth
        required
      />
      <DateTimePicker
        label="Valid From"
        value={validFrom}
        onChange={setValidFrom}
        slotProps={{ textField: { fullWidth: true, required: true, error: touched && !validFrom } }}
      />
      <DateTimePicker
        label="Valid Until"
        value={validUntil}
        onChange={setValidUntil}
        slotProps={{ textField: { fullWidth: true, required: true, error: touched && !validUntil } }}
      />
      <Button type="submit" variant="contained" size="large" loading={submitting}>
        Create Coupon
      </Button>
    </Stack>
  );
}
