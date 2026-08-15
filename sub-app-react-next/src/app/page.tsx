import ClientPage from './ClientPage'

// 服务端渲染的页面信息（SSR）
const APP_NAME = 'React Next.js 子应用'
const APP_TECH = 'Next.js 15 + React 19'
const APP_PORT = '//localhost:9001'

export default function Home() {
  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      {/* 服务端渲染的静态标题和端口信息 */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{APP_NAME}</h1>
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>{APP_TECH}</p>
          </div>
          <div style={{
            fontSize: '11px',
            color: '#3b82f6',
            background: '#eff6ff',
            padding: '4px 10px',
            borderRadius: '12px',
            border: '1px solid #bfdbfe'
          }}>
            🌐 {APP_PORT}
          </div>
        </div>
      </div>

      {/* 客户端交互部分 */}
      <ClientPage />
    </div>
  )
}
