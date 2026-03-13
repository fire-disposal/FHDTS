import {
  AppstoreOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  WifiOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Avatar, Dropdown, Layout, Menu, Space, theme } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const { Header, Sider, Content } = Layout

const roleLabels: Record<string, string> = {
  ADMIN: '管理员',
  CAREGIVER: '护理人员',
  FAMILY: '家属',
}

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/patients',
      icon: <TeamOutlined />,
      label: '患者管理',
    },
    {
      key: '/devices',
      icon: <WifiOutlined />,
      label: '设备管理',
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            key: '/users',
            icon: <UserOutlined />,
            label: '用户管理',
          },
        ]
      : []),
    {
      key: '/digital-twin',
      icon: <AppstoreOutlined />,
      label: '数字孪生',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ]

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{user?.name || user?.email}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{user?.role && roleLabels[user.role]}</div>
          </div>
        </Space>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
          }}
        >
          居家健康管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>居家健康管理系统</h2>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <Space style={{ cursor: 'pointer', padding: '8px 12px' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              {user?.name || user?.email}
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            padding: 24,
            margin: 16,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
