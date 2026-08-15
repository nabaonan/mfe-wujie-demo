<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

type MessageEntry = {
  source: 'parent' | 'other-sub' | 'self'
  from: string
  content: string
  time: string
}

const messages = ref<MessageEntry[]>([])
const inputMsg = ref('')
const parentMessages = ref<string[]>([])
const otherSubMessages = ref<string[]>([])

function addLog(source: MessageEntry['source'], from: string, content: string) {
  messages.value.push({ source, from, content, time: new Date().toLocaleTimeString() })
}

function receiveFromMain(text: string) {
  parentMessages.value.push('[' + new Date().toLocaleTimeString() + '] ' + text)
  addLog('parent', '主应用', text)
}

function receiveFromOtherSub(from: string, content: string) {
  otherSubMessages.value.push('[' + new Date().toLocaleTimeString() + '] ' + from + ': ' + content)
  addLog('other-sub', from, content)
}

function shouldShowDivider(index: number): boolean {
  if (index === 0) return false
  const prev = messages.value[index - 1]; const curr = messages.value[index]
  if (prev.source === 'parent' && curr.source !== 'parent') return true
  if (prev.source !== 'parent' && curr.source === 'parent') return true
  return false
}

// ========== 模块级全局接收器（在 setup 外注册，但也在此文件中） ==========
// 已经通过 Vue 的 setup 函数中的 onMounted 注册了 postMessage 监听
// 但为了和 React 保持一致，也加上模块级保护

onMounted(() => {
  // 通道1: postMessage
  const msgHandler = (e: MessageEvent) => {
    if (e.data?.type === 'main-to-sub') {
      if (e.data.target === 'vue3' || e.data.target === '*') {
        receiveFromMain(e.data.content)
      }
    }
    if (e.data?.type === 'sub-app-message' && e.data.bridged && e.data.target === 'vue3') {
      receiveFromOtherSub(e.data.originalFrom || e.data.from, e.data.content)
    }
  }
  window.addEventListener('message', msgHandler)

  // 通道2: wujie bus (Vue 3 的子应用中这个通常能正常工作)
  function setupBus() {
    try {
      const wujie = (window as any).$wujie
      if (wujie?.bus) {
        wujie.bus.$on('main-to-vue3', (data: any) => {
          if (data?.text) receiveFromMain(data.text)
        })
        wujie.bus.$on('main-to-all', (data: any) => {
          if (data?.text && (data.target === '*' || data.target === 'vue3' || !data.target)) {
            receiveFromMain(data.text)
          }
        })
        wujie.bus.$on('sub-to-sub', (data: any) => {
          if (data?.target === 'vue3' && data?.from && data?.content && data.from !== 'Vue3 子应用') {
            receiveFromOtherSub(data.from, data.content)
          }
        })
        console.log('[Vue3] wujie bus ready')
      } else {
        setTimeout(setupBus, 200)
      }
    } catch (e) {
      setTimeout(setupBus, 200)
    }
  }
  setupBus()

  onUnmounted(() => { window.removeEventListener('message', msgHandler) })
})

function sendToMain() {
  if (!inputMsg.value.trim()) return
  const text = inputMsg.value
  window.parent.postMessage({ type: 'sub-app-message', from: 'Vue3 子应用', content: text }, '*')
  try { const w = (window as any).$wujie; if (w?.bus) w.bus.$emit('sub-to-main', { type: 'sub-app-message', from: 'Vue3 子应用', content: text }) } catch (e) {}
  addLog('self', '本应用', '已发送给主应用: ' + text)
  inputMsg.value = ''
}

function sendToOtherSubApp(target: string, targetLabel: string) {
  if (!inputMsg.value.trim()) return
  const text = inputMsg.value
  const data = { type: 'sub-app-message', from: 'Vue3 子应用', content: text, target, subAppBridge: true, action: 'forward-to-sub', originalFrom: 'Vue3 子应用' }
  window.parent.postMessage(data, '*')
  try { const w = (window as any).$wujie; if (w?.bus) w.bus.$emit('sub-to-sub', { target, from: 'Vue3 子应用', content: text }) } catch (e) {}
  addLog('self', '本应用', '转发给 ' + targetLabel + ': ' + text)
  inputMsg.value = ''
}
</script>

<template>
  <div style="padding: 24px; font-family: system-ui, sans-serif;">
    <div style="margin-bottom: 16px; padding: 12px; border-radius: 8px; background: linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%); border: 1px solid #e2e8f0;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h1 style="font-size: 18px; font-weight: bold; margin: 0;">Vue3 子应用</h1>
          <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">技术栈: Vue 3 + Vite</p>
        </div>
        <div style="font-size: 11px; color: #16a34a; background: #f0fdf4; padding: 4px 10px; border-radius: 12px; border: 1px solid #bbf7d0;">
          🌐 //localhost:9002
        </div>
      </div>
    </div>

    <!-- 来自父应用的消息 -->
    <div v-if="parentMessages.length > 0" style="margin-bottom: 16px; border: 2px solid #3b82f6; border-radius: 8px; background: #eff6ff; padding: 12px;">
      <div style="font-size: 13px; font-weight: 600; color: #1d4ed8; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
        <span>📩</span> 来自父应用的消息
      </div>
      <div style="border-top: 2px dashed #93c5fd; margin-bottom: 8px;"></div>
      <div v-for="(msg, i) in parentMessages.slice().reverse()" :key="i" :style="{
        fontSize: '12px', padding: '6px 8px', marginBottom: i < parentMessages.length - 1 ? '4px' : 0,
        background: i === 0 ? '#dbeafe' : 'transparent', borderRadius: '4px', borderLeft: '3px solid #3b82f6'
      }">{{ msg }}</div>
    </div>

    <!-- 来自其他子应用的消息 -->
    <div v-if="otherSubMessages.length > 0" style="margin-bottom: 16px; border: 2px solid #16a34a; border-radius: 8px; background: #f0fdf4; padding: 12px;">
      <div style="font-size: 13px; font-weight: 600; color: #15803d; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
        <span>🔄</span> 来自其他子应用的消息
      </div>
      <div style="border-top: 2px dashed #86efac; margin-bottom: 8px;"></div>
      <div v-for="(msg, i) in otherSubMessages.slice().reverse()" :key="i" :style="{
        fontSize: '12px', padding: '6px 8px', marginBottom: i < otherSubMessages.length - 1 ? '4px' : 0,
        background: i === 0 ? '#dcfce7' : 'transparent', borderRadius: '4px', borderLeft: '3px solid #16a34a'
      }">{{ msg }}</div>
    </div>

    <!-- 消息输入 -->
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <input v-model="inputMsg" @keyup.enter="sendToMain" placeholder="输入消息..."
        style="flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid #d0d5dd; font-size: 14px;" />
      <button @click="sendToMain" :disabled="!inputMsg.trim()"
        style="padding: 8px 16px; background: #16a34a; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; opacity: inputMsg.trim() ? 1 : 0.5;">
        发送给主应用
      </button>
    </div>

    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
      <button @click="sendToOtherSubApp('react-next', 'Next.js')" :disabled="!inputMsg.trim()"
        style="padding: 6px 12px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; opacity: inputMsg.trim() ? 1 : 0.5;">
        转发给 Next.js 子应用
      </button>
      <button @click="sendToOtherSubApp('react-spa', 'React SPA')" :disabled="!inputMsg.trim()"
        style="padding: 6px 12px; background: #7c3aed; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; opacity: inputMsg.trim() ? 1 : 0.5;">
        转发给 React SPA 子应用
      </button>
    </div>

    <div style="border-radius: 8px; border: 1px solid #e5e7eb; background: #fafafa; max-height: 250px; overflow: auto; padding: 8px;">
      <p style="font-size: 12px; font-weight: 600; color: #666; margin: 0 0 8px 0;">详细通信日志</p>
      <template v-for="(msg, i) in messages" :key="i">
        <div v-if="shouldShowDivider(i)" style="position: relative; margin: 8px 0;">
          <div style="border-top: 2px dashed #aaa;"></div>
          <span style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: #fafafa; padding: 0 8px; font-size: 10px; color: #999;">
            {{ msg.source === 'parent' ? '--- 父应用消息 ---' : '--- 子应用消息 ---' }}
          </span>
        </div>
        <div :style="{
          fontSize: '12px', padding: '4px 8px', margin: '2px 0', borderRadius: '4px',
          background: msg.source === 'parent' ? '#f0f7ff' : msg.source === 'other-sub' ? '#f0fdf4' : 'transparent'
        }">
          <span style="color: #16a34a;">[{{ msg.time }}]</span>
          <span style="color: #666; font-weight: 500;">{{ msg.from }}:</span>
          {{ msg.content }}
          <span v-if="msg.source === 'parent'" style="margin-left: 6px; font-size: 10px; color: #3b82f6; border: 1px solid #93c5fd; border-radius: 3px; padding: 0 4px;">父应用</span>
          <span v-else-if="msg.source === 'other-sub'" style="margin-left: 6px; font-size: 10px; color: #16a34a; border: 1px solid #86efac; border-radius: 3px; padding: 0 4px;">其他子应用</span>
        </div>
      </template>
      <p v-if="messages.length === 0" style="font-size: 12px; color: #999;">暂无消息</p>
    </div>
  </div>
</template>
