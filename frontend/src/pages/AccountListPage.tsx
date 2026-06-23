import { useEffect, useState } from 'react'
import { Button, Card, Col, Row, Space, Spin, Table, Tag, Typography, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { createRun, listAccountRuns, listAccounts } from '../api/client'
import type { Account, AgentRun } from '../types'

export default function AccountListPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [latestRuns, setLatestRuns] = useState<Record<number, AgentRun | null>>({})
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState<number | null>(null)

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const loadedAccounts = await listAccounts()
      setAccounts(loadedAccounts)

      const runEntries = await Promise.all(
        loadedAccounts.map(async account => {
          const runs = await listAccountRuns(account.id)
          return [account.id, runs[0] ?? null] as const
        }),
      )

      setLatestRuns(Object.fromEntries(runEntries))
    } catch {
      message.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAccounts()
  }, [])

  const handleRun = async (accountId: number) => {
    setStartingId(accountId)
    try {
      const run = await createRun(accountId)
      message.success('Workflow started')
      await loadAccounts()
      navigate(`/runs/${run.id}`)
    } catch {
      message.error('Failed to start workflow')
    } finally {
      setStartingId(null)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={8}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Accounts
          </Typography.Title>
          <Typography.Text type="secondary">
            Track account research, intent scoring, and handoff readiness.
          </Typography.Text>
        </Space>
      </Card>
      <Card>
        <Spin spinning={loading}>
          <Table<Account>
            rowKey="id"
            dataSource={accounts}
            pagination={false}
            columns={[
              {
                title: 'Company',
                dataIndex: 'company_name',
                render: (_value, record) => {
                  const latestRun = latestRuns[record.id]
                  return latestRun ? <Link to={`/runs/${latestRun.id}`}>{record.company_name}</Link> : record.company_name
                },
              },
              { title: 'Domain', dataIndex: 'domain' },
              {
                title: 'ICP',
                dataIndex: 'icp_label',
                render: value => <Tag>{value ?? 'pending'}</Tag>,
              },
              {
                title: 'Intent',
                dataIndex: 'intent_label',
                render: (_value, record) => (
                  <Tag color={record.intent_label === 'hot' ? 'red' : record.intent_label === 'warm' ? 'gold' : 'blue'}>
                    {record.intent_label ?? 'pending'}
                    {record.intent_score != null ? ` • ${record.intent_score}` : ''}
                  </Tag>
                ),
              },
              {
                title: 'Latest run',
                render: (_value, record) => {
                  const latestRun = latestRuns[record.id]
                  return latestRun ? <Link to={`/runs/${latestRun.id}`}>View run #{latestRun.id}</Link> : '-'
                },
              },
              {
                title: 'Status',
                dataIndex: 'status',
                render: value => <Tag>{value}</Tag>,
              },
              {
                title: 'Actions',
                render: (_value, record) => (
                  <Button loading={startingId === record.id} onClick={() => void handleRun(record.id)}>
                    Run workflow
                  </Button>
                ),
              },
            ]}
          />
        </Spin>
      </Card>
      <Row gutter={16}>
        {accounts.slice(0, 4).map(account => (
          <Col span={12} key={account.id}>
            <Card title={account.company_name}>
              <Typography.Paragraph ellipsis={{ rows: 3 }}>{account.handoff_summary ?? 'No handoff summary yet.'}</Typography.Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  )
}
