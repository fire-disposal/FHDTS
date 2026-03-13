import { PlusOutlined } from '@ant-design/icons'
import { type ProColumns, ProTable } from '@ant-design/pro-components'
import { Button, Empty, Tag } from 'antd'

interface Device {
  id: string
  name: string
  type: string
  serialNumber: string
  patientId: string | null
  patientName?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  lastSeenAt: Date | null
  createdAt: Date
}

const statusLabels: Record<string, string> = {
  ACTIVE: '在线',
  INACTIVE: '离线',
  SUSPENDED: '停用',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'green',
  INACTIVE: 'default',
  SUSPENDED: 'red',
}

const typeLabels: Record<string, string> = {
  'blood-pressure': '血压计',
  'heart-rate': '心率带',
  'blood-sugar': '血糖仪',
  'blood-oxygen': '血氧仪',
  temperature: '体温计',
  weight: '体重秤',
}

export function DeviceManagement() {
  const columns: ProColumns<Device>[] = [
    {
      title: '设备名称',
      dataIndex: 'name',
      width: 150,
      copyable: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      valueType: 'select',
      valueEnum: typeLabels,
      render: (_, record) => <span>{typeLabels[record.type] || record.type}</span>,
    },
    {
      title: '序列号',
      dataIndex: 'serialNumber',
      width: 150,
      copyable: true,
    },
    {
      title: '绑定患者',
      dataIndex: 'patientName',
      width: 120,
      render: (_, record) => record.patientName || <span style={{ color: '#999' }}>未绑定</span>,
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
        <Tag color={statusColors[record.status]}>{statusLabels[record.status]}</Tag>
      ),
    },
    {
      title: '最后在线',
      dataIndex: 'lastSeenAt',
      width: 160,
      valueType: 'dateTime',
      search: false,
      render: (_, record) =>
        record.lastSeenAt ? new Date(record.lastSeenAt).toLocaleString() : '从未在线',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateTime',
      search: false,
    },
  ]

  return (
    <div>
      <ProTable<Device>
        columns={columns}
        dataSource={[]}
        rowKey="id"
        pagination={{
          showSizeChanger: true,
          showTotal: total => `共 ${total} 条`,
          defaultPageSize: 10,
        }}
        headerTitle="设备管理"
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} disabled>
            添加设备
          </Button>,
        ]}
        search={false}
        options={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <p>暂无设备数据</p>
                  <p style={{ color: '#999', fontSize: 12 }}>设备管理功能开发中，敬请期待...</p>
                </div>
              }
            />
          ),
        }}
      />
    </div>
  )
}
