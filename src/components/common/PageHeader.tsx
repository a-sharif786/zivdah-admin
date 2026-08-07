import { Typography, Space } from 'antd';
import type { ReactNode } from 'react';

const { Title } = Typography;

export function PageHeader({ title, extra }: { title: string; extra?: ReactNode }) {
  return (
    <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
      <Title level={3} style={{ margin: 0 }}>
        {title}
      </Title>
      <Space>{extra}</Space>
    </Space>
  );
}
