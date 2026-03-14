import { UserOutlined } from '@ant-design/icons'
import { Card, Col, Row, Statistic } from 'antd'
import { useUsers } from '../../hooks/api'
import { useAuthStore } from '../../stores/authStore'

export function Dashboard() {
  const user = useAuthStore(state => state.user)
  const { data: usersData } = useUsers()

  const userCount = usersData?.users?.length || 0

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>仪表盘</h1>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="用户总数"
              value={userCount}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="当前用户"
              value={user?.name || user?.email || '-'}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="角色"
              value={user?.role === 'ADMIN' ? '管理员' : '用户'}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="欢迎使用系统管理平台">
        <p>您可以通过左侧菜单导航到不同的功能页面。</p>
        {user?.role === 'ADMIN' && <p>作为管理员，您可以管理用户账户和系统设置。</p>}
      </Card>
    </div>
  )
}
