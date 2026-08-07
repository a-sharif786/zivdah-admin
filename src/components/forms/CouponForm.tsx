import { Form, Input, InputNumber, Select, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';
import type { CouponRequestDto } from '@/types/coupon';

export function CouponForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (dto: CouponRequestDto) => void;
  submitting?: boolean;
}) {
  const [form] = Form.useForm();

  const handleFinish = (values: Record<string, unknown>) => {
    const range = values.validRange as [dayjs.Dayjs, dayjs.Dayjs];
    onSubmit({
      code: (values.code as string).toUpperCase(),
      description: values.description as string | undefined,
      discountType: values.discountType as CouponRequestDto['discountType'],
      discountValue: values.discountValue as number,
      minOrderAmount: values.minOrderAmount as number | undefined,
      maxDiscountAmount: values.maxDiscountAmount as number | undefined,
      usageLimit: values.usageLimit as number,
      validFrom: range[0].format('YYYY-MM-DDTHH:mm:ss'),
      validUntil: range[1].format('YYYY-MM-DDTHH:mm:ss'),
    });
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item name="code" label="Coupon Code" rules={[{ required: true }]}>
        <Input style={{ textTransform: 'uppercase' }} />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item name="discountType" label="Discount Type" rules={[{ required: true }]} initialValue="PERCENTAGE">
        <Select
          options={[
            { label: 'Percentage', value: 'PERCENTAGE' },
            { label: 'Fixed Amount', value: 'FIXED' },
          ]}
        />
      </Form.Item>
      <Form.Item name="discountValue" label="Discount Value" rules={[{ required: true }]}>
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="minOrderAmount" label="Minimum Order Amount">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="maxDiscountAmount" label="Maximum Discount Amount">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="usageLimit" label="Usage Limit" rules={[{ required: true }]}>
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="validRange" label="Valid From / Until" rules={[{ required: true }]}>
        <DatePicker.RangePicker showTime style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting} block>
          Create Coupon
        </Button>
      </Form.Item>
    </Form>
  );
}
