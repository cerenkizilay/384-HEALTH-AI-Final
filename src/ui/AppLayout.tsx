import { Outlet } from 'react-router-dom'
import { Layout, Typography } from 'antd'
import { TopNav } from './components/TopNav'

export function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-200/60 via-indigo-100/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-52 right-[-180px] h-[620px] w-[620px] rounded-full bg-gradient-to-br from-emerald-200/45 via-cyan-200/25 to-transparent blur-3xl" />
      </div>

      <TopNav />
      <Layout.Content style={{ padding: '22px 0' }}>
        <div className="app-container">
          <Outlet />
        </div>
      </Layout.Content>
      <Layout.Footer style={{ background: 'transparent' }}>
        <div className="app-container">
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            HEALTH AI • Co-Creation Platform • No patient data • No file uploads • Meetings happen externally
          </Typography.Text>
        </div>
      </Layout.Footer>
    </Layout>
  )
}

