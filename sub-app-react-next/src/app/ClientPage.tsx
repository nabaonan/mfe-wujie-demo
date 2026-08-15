'use client'

import { useState, useEffect, useCallback } from 'react'

type Message = {
  source: 'parent' | 'other-sub' | 'self'
  from: string
  content: string
  time: string
}

// ========== 模块级全局接收器 ==========
type GlobalMsgHandler = (source: string, from: string, content: string) => void
let globalMsgHandler: GlobalMsgHandler | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('message', function globalMsgListener(e: MessageEvent) {
    if (!globalMsgHandler) return
    if (e.data?.type === 'main-to-sub') {
      if (e.data.target === 'react-next' || e.data.target === '*') {
        globalMsgHandler('parent', '主应用', e.data.content)
      }
    }
    if (e.data?.type === 'sub-app-message' && e.data.bridged && e.data.target === 'react-next') {
      globalMsgHandler('other-sub', e.data.originalFrom || e.data.from, e.data.content)
    }
  })
}

function trySetupWujieBus() {
  try {
    const wujie = (window as any).$wujie
    if (wujie?.bus && !(window as any).__wujieBusReady) {
      ;(window as any).__wujieBusReady = true
      wujie.bus.$on('main-to-react-next', (data: any) => {
        if (data?.text && globalMsgHandler) globalMsgHandler('parent', '主应用', data.text)
      })
      wujie.bus.$on('main-to-all', (data: any) => {
        if (data?.text && globalMsgHandler && (data.target === '*' || data.target === 'react-next' || !data.target)) {
          globalMsgHandler('parent', '主应用', data.text)
        }
      })
      wujie.bus.$on('sub-to-sub', (data: any) => {
        if (data?.target === 'react-next' && data?.from && data?.content && data.from !== 'React Next.js' && globalMsgHandler) {
          globalMsgHandler('other-sub', data.from, data.content)
        }
      })
      console.log('[React Next.js] wujie bus ready')
    } else {
      setTimeout(trySetupWujieBus, 200)
    }
  } catch (e) {
    setTimeout(trySetupWujieBus, 200)
  }
}
trySetupWujieBus()

export default function ClientPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMsg, setInputMsg] = useState('')
  const [parentMessages, setParentMessages] = useState<string[]>([])
  const [otherSubMessages, setOtherSubMessages] = useState<string[]>([])

  const addLog = useCallback((source: Message['source'], from: string, content: string) => {
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

  const shouldShowDivider = (index: number): boolean => {
    if (index === 0) return false
    const prev = messages[index - 1]; const curr = messages[index]
    if (prev.source === 'parent' && curr.source !== 'parent') return true
    if (prev.source !== 'parent' && curr.source === 'parent') return true
    return false
  }

  const sendToMain = () => {
    if (!inputMsg.trim()) return
    const text = inputMsg
    window.parent.postMessage({ type: 'sub-app-message', from: 'React Next.js', content: text }, '*')
    try { const w = (window as any).$wujie; if (w?.bus) w.bus.$emit('sub-to-main', { type: 'sub-app-message', from: 'React Next.js', content: text }) } catch (e) {}
    addLog('self', '本应用', '已发送给主应用: ' + text)
    setInputMsg('')
  }

  const sendToOtherSubApp = (target: string, targetLabel: string) => {
    if (!inputMsg.trim()) return
    const text = inputMsg
    const data = { type: 'sub-app-message', from: 'React Next.js', content: text, target, subAppBridge: true, action: 'forward-to-sub', originalFrom: 'React Next.js' }
    window.parent.postMessage(data, '*')
    try { const w = (window as any).$wujie; if (w?.bus) w.bus.$emit('sub-to-sub', { target, from: 'React Next.js', content: text }) } catch (e) {}
    addLog('self', '本应用', '转发给 ' + targetLabel + ': ' + text)
    setInputMsg('')
  }

  return (
    <>
      {parentMessages.length > 0 && (
        <div style={{ marginBottom: '16px', border: '2px solid #3b82f6', borderRadius: '8px', background: '#eff6ff', padding: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d4ed8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📩</span> 来自父应用的消息
          </div>
          <div style={{ borderTop: '2px dashed #93c5fd', marginBottom: '8px' }}></div>
          {parentMessages.slice().reverse().map((msg, i) => (
            <div key={i} style={{ fontSize: '12px', padding: '6px 8px', marginBottom: i < parentMessages.length - 1 ? '4px' : 0, background: i === 0 ? '#dbeafe' : 'transparent', borderRadius: '4px', borderLeft: '3px solid #3b82f6' }}>{msg}</div>
          ))}
        </div>
      )}

      {otherSubMessages.length > 0 && (
        <div style={{ marginBottom: '16px', border: '2px solid #16a34a', borderRadius: '8px', background: '#f0fdf4', padding: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔄</span> 来自其他子应用的消息
          </div>
          <div style={{ borderTop: '2px dashed #86efac', marginBottom: '8px' }}></div>
          {otherSubMessages.slice().reverse().map((msg, i) => (
            <div key={i} style={{ fontSize: '12px', padding: '6px 8px', marginBottom: i < otherSubMessages.length - 1 ? '4px' : 0, background: i === 0 ? '#dcfce7' : 'transparent', borderRadius: '4px', borderLeft: '3px solid #16a34a' }}>{msg}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input value={inputMsg} onChange={e => setInputMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendToMain()}
          placeholder="输入消息..." style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #d0d5dd', fontSize: '14px' }} />
        <button onClick={sendToMain} disabled={!inputMsg.trim()}
          style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', opacity: inputMsg.trim() ? 1 : 0.5 }}>
          发送给主应用
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => sendToOtherSubApp('vue3', 'Vue3')} disabled={!inputMsg.trim()}
          style={{ padding: '6px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', opacity: inputMsg.trim() ? 1 : 0.5 }}>
          转发给 Vue3 子应用
        </button>
        <button onClick={() => sendToOtherSubApp('react-spa', 'React SPA')} disabled={!inputMsg.trim()}
          style={{ padding: '6px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', opacity: inputMsg.trim() ? 1 : 0.5 }}>
          转发给 React SPA 子应用
        </button>
      </div>

      <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fafafa', maxHeight: '250px', overflow: 'auto', padding: '8px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#666', margin: '0 0 8px 0' }}>详细通信日志</p>
        {messages.map((msg, i) => (
          <div key={i}>
            {shouldShowDivider(i) && (
              <div style={{ position: 'relative', margin: '8px 0', textAlign: 'center' }}>
                <div style={{ borderTop: '2px dashed #aaa' }}></div>
                <span style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: '#fafafa', padding: '0 8px', fontSize: '10px', color: '#999' }}>
                  {msg.source === 'parent' ? '--- 父应用消息 ---' : '--- 子应用消息 ---'}
                </span>
              </div>
            )}
            <div style={{ fontSize: '12px', padding: '4px 8px', margin: '2px 0', borderRadius: '4px', background: msg.source === 'parent' ? '#f0f7ff' : msg.source === 'other-sub' ? '#f0fdf4' : 'transparent' }}>
              <span style={{ color: '#2563eb' }}>[{msg.time}]</span>{' '}
              <span style={{ color: '#666', fontWeight: 500 }}>{msg.from}:</span>{' '}
              {msg.content}
              {msg.source === 'parent' && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#3b82f6', border: '1px solid #93c5fd', borderRadius: '3px', padding: '0 4px' }}>父应用</span>}
              {msg.source === 'other-sub' && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#16a34a', border: '1px solid #86efac', borderRadius: '3px', padding: '0 4px' }}>其他子应用</span>}
            </div>
          </div>
        ))}
        {messages.length === 0 && <p style={{ fontSize: '12px', color: '#999' }}>暂无消息</p>}
      </div>
    </>
  )
}
