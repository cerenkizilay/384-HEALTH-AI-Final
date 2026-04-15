import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0f766e',
          borderRadius: 12,
          colorBgContainer: 'rgba(255,255,255,0.82)',
          colorText: '#0f172a',
          boxShadowSecondary: '0 18px 55px rgba(15, 23, 42, 0.10)',
        },
        components: {
          Button: {
            borderRadius: 12,
            controlHeight: 40,
            colorPrimary: '#0f766e',
            colorPrimaryHover: '#0d9488',
          },
          Card: {
            borderRadiusLG: 16,
          },
          Menu: {
            itemBorderRadius: 10,
            itemSelectedBg: 'rgba(15, 118, 110, 0.12)',
            itemSelectedColor: '#0f766e',
          },
          Input: {
            borderRadius: 10,
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
)
