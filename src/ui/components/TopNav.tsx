import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Space, Tag, Typography, Button } from 'antd'
import { DashboardOutlined, FileTextOutlined, LoginOutlined, LogoutOutlined, UserAddOutlined } from '@ant-design/icons'
import { db } from '../../lib/db'
import { getCurrentUser, logout } from '../../lib/auth'

export function TopNav() {
  const nav = useNavigate()
  const loc = useLocation()
  const u = getCurrentUser()

  return (
    <Layout.Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '100%',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(148,163,184,0.26)',
      }}
    >
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Space size={14}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1677ff 0%, #13c2c2 40%, #52c41a 100%)',
                boxShadow: '0 8px 20px rgba(22,119,255,0.20)',
              }}
            />
            <Typography.Text strong style={{ letterSpacing: -0.2 }}>
              HEALTH AI
            </Typography.Text>
          </Link>

          <Menu
            mode="horizontal"
            selectedKeys={[loc.pathname.startsWith('/admin') ? 'admin' : loc.pathname.startsWith('/posts') ? 'posts' : '']}
            items={[
              {
                key: 'posts',
                icon: <FileTextOutlined />,
                label: 'Announcements',
                onClick: () => nav('/posts'),
              },
              ...(u?.role === 'admin'
                ? [
                    {
                      key: 'admin',
                      icon: <DashboardOutlined />,
                      label: 'Admin',
                      onClick: () => nav('/admin'),
                    },
                  ]
                : []),
            ]}
            style={{ minWidth: 320, background: 'transparent', borderBottom: 0 }}
          />
        </Space>

        <Space size={10}>
          {u ? (
            <>
              <Space size={6} className="hidden md:flex">
                <Typography.Text type="secondary">{u.name}</Typography.Text>
                <Tag color="blue">{db.roleLabel(u.role)}</Tag>
                {u.verified ? <Tag color="green">Verified</Tag> : <Tag color="orange">Unverified</Tag>}
              </Space>
              <Button
                icon={<LogoutOutlined />}
                onClick={() => {
                  logout()
                  nav('/')
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button icon={<LoginOutlined />} onClick={() => nav('/login')}>
                Log in
              </Button>
              <Button type="primary" icon={<UserAddOutlined />} onClick={() => nav('/register')}>
                Register
              </Button>
            </>
          )}
        </Space>
      </div>
    </Layout.Header>
  )
}

