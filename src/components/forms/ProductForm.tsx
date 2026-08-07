import { Form, Input, InputNumber, Select, Switch, DatePicker, Button } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { ImageUploadField } from '@/components/common/ImageUploadField';
import type { ProductRequestDto, ProductResponseDto } from '@/types/product';

const CATEGORIES = ['VEGETABLE', 'FRUIT', 'MILK', 'PULSE', 'GROCERY'];

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
  const [form] = Form.useForm();
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        ...initial,
        expiryDate: initial.expiryDate ? dayjs(initial.expiryDate) : undefined,
      });
    } else {
      form.resetFields();
    }
    setImage(null);
  }, [initial, form]);

  const handleFinish = (values: Record<string, unknown>) => {
    const dto: ProductRequestDto = {
      id: initial?.id,
      name: values.name as string,
      category: values.category as ProductRequestDto['category'],
      price: values.price as number,
      discountPrice: values.discountPrice as number | undefined,
      unit: values.unit as string,
      stockQuantity: values.stockQuantity as number,
      expiryDate: values.expiryDate ? (values.expiryDate as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
      description: values.description as string | undefined,
      organic: values.organic as boolean | undefined,
      brand: values.brand as string | undefined,
      fav: initial?.fav,
    };
    onSubmit(dto, image);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item label="Image">
        <ImageUploadField existingImageUrl={initial?.imageUrl} onFileSelected={setImage} />
        {requireImage && !initial && !image && (
          <div style={{ color: '#ff4d4f', fontSize: 12 }}>Image is required</div>
        )}
      </Form.Item>
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="category" label="Category" rules={[{ required: true }]}>
        <Select options={CATEGORIES.map((c) => ({ label: c, value: c }))} />
      </Form.Item>
      <Form.Item name="brand" label="Brand">
        <Input />
      </Form.Item>
      <Form.Item name="price" label="Price" rules={[{ required: true }]}>
        <InputNumber min={0} style={{ width: '100%' }} prefix="₹" />
      </Form.Item>
      <Form.Item name="discountPrice" label="Discount Price">
        <InputNumber min={0} style={{ width: '100%' }} prefix="₹" />
      </Form.Item>
      <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
        <Input placeholder="kg, litre, pack..." />
      </Form.Item>
      <Form.Item name="stockQuantity" label="Stock Quantity" rules={[{ required: true }]}>
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="expiryDate" label="Expiry Date">
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="organic" label="Organic" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting} block>
          {initial ? 'Update Product' : 'Create Product'}
        </Button>
      </Form.Item>
    </Form>
  );
}
