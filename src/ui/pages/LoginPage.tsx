import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { login } from '../../lib/auth'

export function LoginPage() {
  const nav = useNavigate()
  const loc = useLocation()
  const from = useMemo(() => (loc.state as { from?: string } | null)?.from ?? '/posts', [loc.state])

  const [error, setError] = useState<string | null>(null)

  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: '16px 0' }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 16,
          boxShadow: '0 18px 60px rgba(15,23,42,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Space align="center" size={10}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #1677ff 0%, #13c2c2 45%, #52c41a 100%)',
                boxShadow: '0 12px 30px rgba(22,119,255,0.20)',
              }}
            />
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                Log in
              </Typography.Title>
              <Typography.Text type="secondary">Institutional access only (.edu)</Typography.Text>
            </div>
          </Space>

          <Alert
            type="info"
            showIcon
            message="Demo accounts"
            description={
              <div>
                engineer@demo.edu • doctor@demo.edu • admin@demo.edu
              </div>
            }
          />

          {error ? <Alert type="error" showIcon message={error} /> : null}

          <Form
            layout="vertical"
            onFinish={(values: { email: string }) => {
              setError(null)
              try {
                login(values.email)
                nav(from, { replace: true })
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Login failed.')
              }
            }}
          >
            <Form.Item
              label="Institutional email"
              name="email"
              rules={[{ required: true, message: 'Email is required.' }]}
            >
              <Input size="large" prefix={<MailOutlined />} placeholder="name@university.edu" />
            </Form.Item>

            <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button type="primary" size="large" icon={<LockOutlined />} htmlType="submit">
                Log in
              </Button>
              <Button type="link" onClick={() => nav('/register')}>
                Create an account
              </Button>
            </Space>
          </Form>
        </Space>
      </Card>
    </div>
  )
}

