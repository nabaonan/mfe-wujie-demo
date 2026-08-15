import React, { useState, useEffect, useCallback } from 'react'
import { Card, Input, Button, Tag, Typography, Space, Divider } from 'antd'
import { SendOutlined, SwapOutlined, MessageOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

type MessageSource = 'parent' | 'other-sub' | 'self'
interface Message { source: MessageSource; from: string; content: string; time: string }

// ========== 模块级全局接收器 ==========
type GlobalMsgHandler = (source: string, from: string, content: string) => void
let globalMsgHandler: GlobalMsgHandler | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('message', function globalMsgListener(e: MessageEvent) {
    if (!globalMsgHandler) return
    if (e.data?.type === 'main-to-sub') {
      if (e.data.target === 'react-spa' || e.data.target === '*') {
        globalMsgHandler('parent', '主应用', e.data.content)
      }
    }
    if (e.data?.type === 'sub-app-message' && e.data.bridged && e.data.target === 'react-spa') {
      globalMsgHandler('other-sub', e.data.originalFrom || e.data.from, e.data.content)
    }
  })
}

function trySetupWujieBus() {
  try {
    const wujie = (window as any).$wujie
    if (wujie?.bus && !(window as any).__wujieBusReady) {
      ;(window as any).__wujieBusReady = true
      wujie.bus.$on('main-to-react-spa', (data: any) => {
        if (data?.text && globalMsgHandler) globalMsgHandler('parent', '主应用', data.text)
      })
      wujie.bus.$on('main-to-all', (data: any) => {
        if (data?.text && globalMsgHandler && (data.target === '*' || data.target === 'react-spa' || !data.target)) {
          globalMsgHandler('parent', '主应用', data.text)
        }
      })
      wujie.bus.$on('sub-to-sub', (data: any) => {
        if (data?.target === 'react-spa' && data?.from && data?.content && data.from !== 'React SPA' && globalMsgHandler) {
          globalMsgHandler('other-sub', data.from, data.content)
        }
      })
      console.log('[React SPA] wujie bus ready')
    } else {
      setTimeout(trySetupWujieBus, 200)
    }
  } catch (e) {
    setTimeout(trySetupWujieBus, 200)
  }
}
trySetupWujieBus()

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMsg, setInputMsg] = useState('')
  const [parentMessages, setParentMessages] = useState<string[]>([])
  const [otherSubMessages, setOtherSubMessages] = useState<string[]>([])

  const addLog = useCallback((source: MessageSource, from: string, content: string) => {
    setMessages(prev => [...prev, { source, from, content, time: new Date().toLocaleTimeString() }])
  }, [])

  const receiveFromMain = useCallback((text: string) => {
    setParentMessages(prev => [...prev, '[' + new Date().toLocaleTimeString() + '] ' + text])
    addLog('parent', '主应用', text)
  }, [addLog])

  const receiveFromOtherSub = useCallback((from: string, content: string) => {
    setOtherSubMessages(prev => [...prev, '[' + new Date().toLocaleTimeString() + '] ' + from + ': ' + content])
    addLog('other-sub', from, content)
  }, [addLog])

  useEffect(() => {
    globalMsgHandler = (source: string, from: string, content: string) => {
      if (source === 'parent') receiveFromMain(content)
      else if (source === 'other-sub') receiveFromOtherSub(from, content)
    }
    return () => { globalMsgHandler = null }
  }, [receiveFromMain, receiveFromOtherSub])

  const shouldShowDivider = (index: number, msgs: Message[]): boolean => {
    if (index === 0) return false
    const prev = msgs[index - 1]; const curr = msgs[index]
    if (prev.source === 'parent' && curr.source !== 'parent') return true
    if (prev.source !== 'parent' && curr.source === 'parent') return true
    return false
  }

  const sendToMain = () => {
    if (!inputMsg.trim()) return
    const text = inputMsg
    window.parent.postMessage({ type: 'sub-app-message', from: 'React SPA', content: text }, '*')
    try { const w = (window as any).$wujie; if (w?.bus) w.bus.$emit('sub-to-main', { type: 'sub-app-message', from: 'React SPA', content: text }) } catch (e) {}
    addLog('self', '本应用', '已发送给主应用: ' + text)
    setInputMsg('')
  }

  const sendToOtherSubApp = (target: string, targetLabel: string) => {
    if (!inputMsg.trim()) return
    const text = inputMsg
    const data = { type: 'sub-app-message', from: 'React SPA', content: text, target, subAppBridge: true, action: 'forward-to-sub', originalFrom: 'React SPA' }
    window.parent.postMessage(data, '*')
    try { const w = (window as any).$wujie; if (w?.bus) w.bus.$emit('sub-to-sub', { target, from: 'React SPA', content: text }) } catch (e) {}
    addLog('self', '本应用', '转发给 ' + targetLabel + ': ' + text)
    setInputMsg('')
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'linear-gradient(135deg, #f8fafc 0%, #faf5ff 100%)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>React SPA + Antd 子应用</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>技术栈: React 18 + Ant Design 5 + Vite</Text>
          </div>
          <div style={{ fontSize: 11, color: '#7c3aed', background: '#faf5ff', padding: '4px 10px', borderRadius: 12, border: '1px solid #ddd6fe' }}>
            🌐 //localhost:9003
          </div>
        </div>
      </div>

      {parentMessages.length > 0 && (
        <div style={{ marginBottom: 16, border: '2px solid #1677ff', borderRadius: 8, background: '#f0f5ff', padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1677ff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📩</span> 来自父应用的消息
          </div>
          <div style={{ borderTop: '2px dashed #91caff', marginBottom: 8 }}></div>
          {parentMessages.slice().reverse().map((msg, i) => (
            <div key={i} style={{ fontSize: 12, padding: '6px 8px', marginBottom: i < parentMessages.length - 1 ? 4 : 0, background: i === 0 ? '#d6e4ff' : 'transparent', borderRadius: 4, borderLeft: '3px solid #1677ff' }}>
              {msg}
            </div>
          ))}
        </div>
      )}

      {otherSubMessages.length > 0 && (
        <div style={{ marginBottom: 16, border: '2px solid #52c41a', borderRadius: 8, background: '#f6ffed', padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#52c41a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🔄</span> 来自其他子应用的消息
          </div>
          <div style={{ borderTop: '2px dashed #b7eb8f', marginBottom: 8 }}></div>
          {otherSubMessages.slice().reverse().map((msg, i) => (
            <div key={i} style={{ fontSize: 12, padding: '6px 8px', marginBottom: i < otherSubMessages.length - 1 ? 4 : 0, background: i === 0 ? '#d9f7be' : 'transparent', borderRadius: 4, borderLeft: '3px solid #52c41a' }}>
              {msg}
            </div>
          ))}
        </div>
      )}

      <Card title={<Space><MessageOutlined />消息通信</Space>} size="small" style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
          <Input value={inputMsg} onChange={e => setInputMsg(e.target.value)} onPressEnter={sendToMain} placeholder="输入消息..." prefix={<SendOutlined />} />
          <Button type="primary" onClick={sendToMain} disabled={!inputMsg.trim()}>发送给主应用</Button>
        </Space.Compact>
        <Divider plain style={{ fontSize: 12, margin: '12px 0' }}>跨子应用通信</Divider>
        <Space>
          <Button icon={<SwapOutlined />} onClick={() => sendToOtherSubApp('react-next', 'Next.js')} disabled={!inputMsg.trim()} style={{ fontSize: 12 }}>转发给 Next.js 子应用</Button>
          <Button icon={<SwapOutlined />} onClick={() => sendToOtherSubApp('vue3', 'Vue3')} disabled={!inputMsg.trim()} style={{ fontSize: 12 }}>转发给 Vue3 子应用</Button>
        </Space>
      </Card>

      <Card title="详细通信日志" size="small">
        <div style={{ maxHeight: 250, overflow: 'auto' }}>
          {messages.map((msg, i) => (
            <div key={i}>
              {shouldShowDivider(i, messages) && (
                <div style={{ position: 'relative', margin: '8px 0', textAlign: 'center' }}>
                  <div style={{ borderTop: '2px dashed #aaa' }}></div>
                  <span style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 8px', fontSize: 10, color: '#999' }}>
                    {msg.source === 'parent' ? '--- 父应用消息 ---' : '--- 子应用消息 ---'}
                  </span>
                </div>
              )}
              <div style={{ fontSize: 12, padding: '4px 8px', margin: '2px 0', borderRadius: 4, background: msg.source === 'parent' ? '#f0f7ff' : msg.source === 'other-sub' ? '#f0fdf4' : 'transparent' }}>
                <Text style={{ fontSize: 12, color: '#1677ff' }}>[{msg.time}]</Text>{' '}
                <Text strong style={{ fontSize: 12 }}>{msg.from}:</Text>{' '}
                <Text style={{ fontSize: 12 }}>{msg.content}</Text>
                {msg.source === 'parent' && <Tag color="blue" style={{ fontSize: 10, marginLeft: 6 }}>父应用</Tag>}
                {msg.source === 'other-sub' && <Tag color="green" style={{ fontSize: 10, marginLeft: 6 }}>其他子应用</Tag>}
              </div>
            </div>
          ))}
          {messages.length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>暂无消息</Text>}
        </div>
      </Card>
    </div>
  )
}

export default App
