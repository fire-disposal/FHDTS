import { AlertOutlined, ClockCircleOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Row, Skeleton, Statistic, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { useLatestObservations, usePatients } from '../../hooks/api'
import { useAuthStore } from '../../stores/authStore'

interface ObservationWithPatient {
  id: string
  patientId: string
  patientName: string
  code: string
  value: number
  unit: string
  timestamp: Date
  note: string | null
}

const codeLabels: Record<string, string> = {
  'blood-pressure': '血压',
  'heart-rate': '心率',
  'blood-sugar': '血糖',
  'blood-oxygen': '血氧',
  temperature: '体温',
}

const normalRanges: Record<string, [number, number]> = {
  'blood-pressure': [90, 140],
  'heart-rate': [60, 100],
  'blood-sugar': [3.9, 7.8],
  'blood-oxygen': [95, 100],
  temperature: [36.0, 37.3],
}

export function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const { data: patientData } = usePatients({ take: 100 })
  const { data: observations, isLoading: obsLoading } = useLatestObservations(10)

  const patientCount = patientData?.total || 0
  const activeDevices = 12

  const getStatus = (code: string, value: number): 'normal' | 'high' | 'low' => {
    const range = normalRanges[code]
    if (!range) return 'normal'
    if (value < range[0]) return 'low'
    if (value > range[1]) return 'high'
    return 'normal'
  }

  const recentData = (observations || []).map((o: ObservationWithPatient) => {
    const status = getStatus(o.code, o.value)
    return {
      key: o.id,
      patient: o.patientName,
      type: codeLabels[o.code] || o.code,
      value: `${o.value} ${o.unit}`,
      time: dayjs(o.timestamp).fromNow(),
      status,
    }
  })

  const columns: ColumnsType<(typeof recentData)[0]> = [
    { title: '患者', dataIndex: 'patient', key: 'patient' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      render: (value: string, record: any) => (
        <span
          style={{
            color:
              record.status === 'high'
                ? '#ff4d4f'
                : record.status === 'low'
                  ? '#faad14'
                  : 'inherit',
          }}
        >
          {value} {record.status !== 'normal' && '⚠️'}
        </span>
      ),
    },
    { title: '时间', dataIndex: 'time', key: 'time' },
  ]

  const abnormalCount = (observations || []).filter((o: ObservationWithPatient) => {
    const status = getStatus(o.code, o.value)
    return status !== 'normal'
  }).length

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0 }}>仪表盘</h1>
        <Button type="primary" onClick={() => navigate('/patients')}>
          查看患者列表
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Skeleton loading={!patientData} active>
            <Card>
              <Statistic
                title={user?.role === 'ADMIN' ? '在管患者' : '我的患者'}
                value={patientCount}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Skeleton>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日数据"
              value={observations?.length || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="异常告警"
              value={abnormalCount}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="在线设备"
              value={activeDevices}
              suffix="台"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近健康数据">
        {obsLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : recentData.length > 0 ? (
          <Table columns={columns} dataSource={recentData} pagination={false} size="small" />
        ) : (
          <Empty description="暂无健康数据" />
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="患者状态分布">
            {patientData?.patients && patientData.patients.length > 0 ? (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Tag color="green" style={{ fontSize: 14 }}>
                  在管{' '}
                  {(patientData.patients as any).filter((p: any) => p.status === 'ACTIVE').length}
                </Tag>
                <Tag color="default" style={{ fontSize: 14 }}>
                  未激活{' '}
                  {(patientData.patients as any).filter((p: any) => p.status === 'INACTIVE').length}
                </Tag>
                <Tag color="red" style={{ fontSize: 14 }}>
                  已暂停{' '}
                  {
                    (patientData.patients as any).filter((p: any) => p.status === 'SUSPENDED')
                      .length
                  }
                </Tag>
              </div>
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="数据类型分布">
            {observations && observations.length > 0 ? (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {Object.entries(codeLabels).map(([code, label]) => {
                  const count = (observations as ObservationWithPatient[]).filter(
                    o => o.code === code
                  ).length
                  return (
                    <Tag key={code} color="blue" style={{ fontSize: 14 }}>
                      {label}: {count}
                    </Tag>
                  )
                })}
              </div>
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
