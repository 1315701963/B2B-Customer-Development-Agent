import { Layout, Menu, Tag, Typography } from 'antd'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import AccountListPage from './pages/AccountListPage'
import RunDetailPage from './pages/RunDetailPage'

const items = [
  { key: 'accounts', label: <Link to="/">Accounts</Link> },
  { key: 'runs', label: <Link to="/">Runs</Link> },
  { key: 'handoff', label: <Link to="/">Handoff</Link> },
]

export default function App() {
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Layout.Sider width={220}>
          <div style={{ color: '#fff', padding: 16 }}>
            <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
              B2B Agent
            </Typography.Title>
          </div>
          <Menu theme="dark" mode="inline" items={items} />
        </Layout.Sider>
        <Layout>
          <Layout.Header style={{ background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography.Text strong>Customer Development Workflow</Typography.Text>
            <Tag color="blue">Phase 5</Tag>
          </Layout.Header>
          <Layout.Content style={{ padding: 24 }}>
            <Routes>
              <Route path="/" element={<AccountListPage />} />
              <Route path="/runs/:id" element={<RunDetailPage />} />
            </Routes>
          </Layout.Content>
        </Layout>
      </Layout>
    </BrowserRouter>
  )
}
