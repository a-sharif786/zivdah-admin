import { useState } from 'react';
import { Layout, Menu, Avatar, Tag, Dropdown, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_NAV, VENDOR_NAV } from '@/components/layout/navConfig';
import { authApi } from '@/api/authApi';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'gold',
  VENDOR: 'blue',
};

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const nav = isAdmin ? ADMIN_NAV : VENDOR_NAV;
  const selectedKey =
    nav
      .slice()
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
      ?.key ?? 'dashboard';

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort; proceed to clear local session regardless
    }
    logout();
    navigate('/login', { replace: true });
  };

  const userMenu: MenuProps['items'] = [
    { key: 'logout', label: 'Log out', icon: <LogoutOutlined />, onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 48,
            margin: 16,
            color: '#fff',
            fontWeight: 700,
            fontSize: collapsed ? 16 : 18,
            textAlign: 'center',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? 'ZA' : 'Zivdah Admin'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={nav.map((item) => ({ key: item.key, icon: item.icon, label: item.label }))}
          onClick={({ key }) => {
            const item = nav.find((n) => n.key === key);
            if (item) navigate(item.path);
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            paddingInline: 24,
          }}
        >
          {user && <Tag color={ROLE_COLORS[user.role] ?? 'default'}>{user.role}</Tag>}
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} size="small" />
              <Text>{user?.name}</Text>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
