import { Form, Input, Switch, Button } from 'antd';
import { useEffect, useState } from 'react';
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
  const [form] = Form.useForm();
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue(initial);
    } else {
      form.resetFields();
    }
    setImage(null);
  }, [initial, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => onSubmit({ title: values.title, active: values.active ?? true }, image)}
    >
      <Form.Item label="Image">
        <ImageUploadField existingImageUrl={initial?.imageUrl} onFileSelected={setImage} />
        {!initial && !image && <div style={{ color: '#ff4d4f', fontSize: 12 }}>Image is required</div>}
      </Form.Item>
      <Form.Item name="title" label="Title">
        <Input />
      </Form.Item>
      <Form.Item name="active" label="Active" valuePropName="checked" initialValue={true}>
        <Switch />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting} block>
          {initial ? 'Update Banner' : 'Create Banner'}
        </Button>
      </Form.Item>
    </Form>
  );
}
