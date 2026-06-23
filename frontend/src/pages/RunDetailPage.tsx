import { useEffect, useState } from 'react'
import { Card, Descriptions, Space, Spin, Table, Tag, Typography, message } from 'antd'
import { useParams } from 'react-router-dom'
import { getRun } from '../api/client'
import type { AgentRunDetail } from '../types'

export default function RunDetailPage() {
  const { id } = useParams()
  const runId = Number(id)
  const [detail, setDetail] = useState<AgentRunDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRun = async () => {
      setLoading(true)
      try {
        setDetail(await getRun(runId))
      } catch {
        message.error('Failed to load run detail')
      } finally {
        setLoading(false)
      }
    }

    void loadRun()
  }, [runId])

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Run detail
          </Typography.Title>
        </Card>
        <Card>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Run ID">{detail?.run.id ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag>{detail?.run.status ?? '-'}</Tag></Descriptions.Item>
            <Descriptions.Item label="Workflow">{detail?.run.workflow_name ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Duration">{detail?.run.duration_ms != null ? `${detail.run.duration_ms} ms` : '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
        <Card title="Steps">
          <Table
            rowKey="id"
            pagination={false}
            dataSource={detail?.steps ?? []}
            columns={[
              { title: 'Order', dataIndex: 'step_order' },
              { title: 'Step', dataIndex: 'step_name' },
              { title: 'Status', dataIndex: 'status', render: value => <Tag>{value}</Tag> },
              { title: 'Duration', dataIndex: 'duration_ms', render: value => (value != null ? `${value} ms` : '-') },
              {
                title: 'Output',
                dataIndex: 'output_json',
                render: value => <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(value ?? {}, null, 2)}</pre>,
              },
            ]}
          />
        </Card>
      </Space>
    </Spin>
  )
}
