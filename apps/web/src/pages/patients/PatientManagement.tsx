import { DeleteOutlined, EditOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import type { ProColumns } from '@ant-design/pro-components'
import { ProTable } from '@ant-design/pro-components'
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useCreatePatient, useDeletePatient, usePatients, useUpdatePatient } from '../../hooks/api'
import type { Patient } from '../../types'

const { TextArea } = Input

const genderLabels: Record<string, string> = {
  男: '男',
  女: '女',
  其他: '其他',
}

const statusLabels: Record<string, string> = {
  ACTIVE: '在管',
  INACTIVE: '未激活',
  SUSPENDED: '已暂停',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
  SUSPENDED: 'red',
}

export function PatientManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [searchText, _setSearchText] = useState('')
  const [form] = Form.useForm()

  const { data, refetch } = usePatients({ search: searchText || undefined })
  const createMutation = useCreatePatient({ onSuccess: () => setIsModalOpen(false) })
  const updateMutation = useUpdatePatient({ onSuccess: () => setIsModalOpen(false) })
  const deleteMutation = useDeletePatient()

  const handleCreate = () => {
    setEditingPatient(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient)
    form.setFieldsValue({
      name: patient.name,
      gender: patient.gender,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth ? dayjs(patient.dateOfBirth) : null,
      address: patient.address,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (values: any) => {
    const data = {
      name: values.name,
      gender: values.gender,
      phone: values.phone,
      dateOfBirth: values.dateOfBirth?.toISOString(),
      address: values.address,
    }

    if (editingPatient) {
      updateMutation.mutate({ patientId: editingPatient.id, data })
    } else {
      createMutation.mutate(data)
    }
    refetch()
  }

  const columns: ProColumns<Patient>[] = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 120,
      formItemProps: {
        rules: [{ required: true, message: '请输入姓名' }],
      },
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 80,
      valueType: 'select',
      valueEnum: {
        男: { text: '男' },
        女: { text: '女' },
        其他: { text: '其他' },
      },
      render: (_, record) => <span>{genderLabels[record.gender] || '-'}</span>,
    },
    {
      title: '出生日期',
      dataIndex: 'dateOfBirth',
      width: 120,
      valueType: 'date',
      render: (_, record) =>
        record.dateOfBirth ? dayjs(record.dateOfBirth).format('YYYY-MM-DD') : '-',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      width: 130,
      copyable: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      valueEnum: {
        ACTIVE: { text: statusLabels.ACTIVE, status: 'Success' },
        INACTIVE: { text: statusLabels.INACTIVE, status: 'Default' },
        SUSPENDED: { text: statusLabels.SUSPENDED, status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={statusColors[record.status]}>{statusLabels[record.status]}</Tag>
      ),
    },
    {
      title: '护理人员',
      key: 'caregivers',
      width: 150,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ maxWidth: 150 }}>
          {record.caregivers.slice(0, 2).map((c: any) => (
            <Tag key={c.id} icon={<UserOutlined />}>
              {c.name || c.email}
            </Tag>
          ))}
          {record.caregivers.length > 2 && <Tag>+{record.caregivers.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: '观察记录',
      dataIndex: 'observationCount',
      width: 90,
      search: false,
    },
    {
      title: '设备数',
      dataIndex: 'deviceCount',
      width: 80,
      search: false,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      search: false,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该患者？"
            onConfirm={() => deleteMutation.mutate({ patientId: record.id })}
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
      <ProTable<Patient>
        columns={columns}
        dataSource={data?.patients || []}
        rowKey="id"
        loading={data === undefined}
        pagination={{
          showSizeChanger: true,
          showTotal: total => `共 ${total} 条`,
          defaultPageSize: 10,
        }}
        headerTitle="患者管理"
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建患者
          </Button>,
        ]}
        search={{
          labelWidth: 'auto',
          optionRender: () => [
            <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建患者
            </Button>,
          ],
        }}
        options={false}
      />

      <Modal
        title={editingPatient ? '编辑患者' : '新建患者'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入患者姓名" />
          </Form.Item>

          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="gender" label="性别" style={{ marginBottom: 0, flex: 1 }}>
              <Select placeholder="选择性别">
                <Select.Option value="男">男</Select.Option>
                <Select.Option value="女">女</Select.Option>
                <Select.Option value="其他">其他</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="dateOfBirth" label="出生日期" style={{ marginBottom: 0, flex: 2 }}>
              <DatePicker style={{ width: '100%' }} placeholder="选择出生日期" />
            </Form.Item>
          </Space.Compact>

          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item name="address" label="住址">
            <TextArea rows={2} placeholder="请输入居住地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
