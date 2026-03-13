import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthLogin } from '../../hooks/api'
import { useAuthStore } from '../../stores/authStore'

export function Login() {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)

  const loginMutation = useAuthLogin({
    onSuccess: () => {
      navigate('/')
    },
  })

  const handleSubmit = (values: { email: string; password: string }) => {
    loginMutation.mutate(values, {
      onSuccess: data => {
        login(data.user, data.token)
      },
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>居家健康管理系统</h1>
          <p style={{ color: '#666', marginTop: 8 }}>Digital Twin Health Platform</p>
        </div>

        <Form onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="email"
            rules={[{ required: true, message: '请输入邮箱', type: 'email' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码', min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loginMutation.isPending}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
