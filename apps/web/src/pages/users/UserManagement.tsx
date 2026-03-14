import { DeleteOutlined, EditOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons'
import type { ProColumns } from '@ant-design/pro-components'
import { ProTable } from '@ant-design/pro-components'
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Tag } from 'antd'
import { useState } from 'react'
import {
  useCreateUser,
  useDeleteUser,
  useResetPassword,
  useUpdateUser,
  useUsers,
} from '../../hooks/api'
import type { User } from '../../lib/trpc'

const roleLabels: Record<string, string> = {
  ADMIN: '管理员',
  CAREGIVER: '护理人员',
  FAMILY: '家属',
}

const statusLabels: Record<string, string> = {
  ACTIVE: '正常',
  INACTIVE: '未激活',
  SUSPENDED: '已停用',
}

const roleColors: Record<string, string> = {
  ADMIN: 'red',
  CAREGIVER: 'blue',
  FAMILY: 'green',
}

export function UserManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()

  const { data } = useUsers()
  const createMutation = useCreateUser({ onSuccess: () => setIsModalOpen(false) })
  const updateMutation = useUpdateUser({ onSuccess: () => setIsModalOpen(false) })
  const deleteMutation = useDeleteUser()
  const resetPasswordMutation = useResetPassword()

  const handleCreate = () => {
    setEditingUser(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue({
      name: user.name,
      role: user.role,
      status: user.status,
    })
    setIsModalOpen(true)
  }

  const handleResetPassword = (userId: string, email: string) => {
    const newPassword = Math.random().toString(36).slice(-8)
    Modal.confirm({
      title: '重置密码',
      content: `将用户 ${email} 的密码重置为：${newPassword}，请立即告知用户`,
      onOk: () => {
        resetPasswordMutation.mutate({ userId, newPassword })
      },
    })
  }

  const handleSubmit = async (values: {
    email?: string
    password?: string
    name?: string
    role?: 'ADMIN' | 'CAREGIVER' | 'FAMILY'
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  }) => {
    if (editingUser) {
      updateMutation.mutate({
        userId: editingUser.id,
        data: {
          name: values.name,
          role: values.role,
          status: values.status,
        },
      })
    } else {
      // 确保在创建用户时必填字段存在
      if (values.email && values.password && values.role) {
        createMutation.mutate({
          email: values.email,
          password: values.password,
          name: values.name,
          role: values.role,
        })
      }
    }
  }

  const columns: ProColumns<User>[] = [
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      copyable: true,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      valueType: 'select',
      valueEnum: {
        ADMIN: { text: roleLabels.ADMIN, status: 'Error' },
        CAREGIVER: { text: roleLabels.CAREGIVER, status: 'Processing' },
        FAMILY: { text: roleLabels.FAMILY, status: 'Success' },
      },
      render: (_, record) => <Tag color={roleColors[record.role]}>{roleLabels[record.role]}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        ACTIVE: { text: statusLabels.ACTIVE, status: 'Success' },
        INACTIVE: { text: statusLabels.INACTIVE, status: 'Default' },
        SUSPENDED: { text: statusLabels.SUSPENDED, status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={record.status === 'ACTIVE' ? 'green' : 'default'}>
          {statusLabels[record.status]}
        </Tag>
      ),
    },
    {
      title: '负责患者',
      dataIndex: 'patientCount',
      width: 100,
      search: false,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      search: false,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            onClick={() => handleResetPassword(record.id, record.email)}
          >
            重置密码
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该用户？"
            onConfirm={() => deleteMutation.mutate({ userId: record.id })}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <ProTable<User>
        columns={columns}
        dataSource={data?.users || []}
        rowKey="id"
        loading={data === undefined}
        pagination={{
          showSizeChanger: true,
          showTotal: total => `共 ${total} 条`,
          defaultPageSize: 10,
        }}
        headerTitle="用户管理"
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建用户
          </Button>,
        ]}
        search={false}
        options={false}
      />

      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingUser && (
            <>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, min: 6, message: '密码至少 6 位' }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </>
          )}
          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="ADMIN">管理员</Select.Option>
              <Select.Option value="CAREGIVER">护理人员</Select.Option>
              <Select.Option value="FAMILY">家属</Select.Option>
            </Select>
          </Form.Item>
          {editingUser && (
            <Form.Item name="status" label="状态">
              <Select>
                <Select.Option value="ACTIVE">正常</Select.Option>
                <Select.Option value="INACTIVE">未激活</Select.Option>
                <Select.Option value="SUSPENDED">已停用</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
