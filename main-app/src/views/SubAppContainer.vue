<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import WujieVue from 'wujie-vue3'

const props = defineProps<{
  subApp: string
}>()

const loading = ref(true)
const error = ref('')

const subAppUrls: Record<string, string> = {
  'react-next': '//localhost:9001',
  'vue3': '//localhost:9002',
  'react-spa': '//localhost:9003',
}

const url = subAppUrls[props.subApp] || ''

// ---- 消息系统 ----
type MessageEntry = {
  type: 'parent' | 'child' | 'self'
  from: string
  content: string
  time: string
}

const sendMessageToSub = ref('')
const messages = ref<MessageEntry[]>([])

function addLog(type: MessageEntry['type'], from: string, content: string) {
  messages.value.push({ type, from, content, time: new Date().toLocaleTimeString() })
}

function getBus() { return (WujieVue as any).bus }

function findSubAppIframe(): HTMLIFrameElement | null {
  // wujie 创建 iframe 时设置了 name 属性
  let iframe = document.querySelector(`iframe[name="${props.subApp}"]`)
  // 如果找不到，尝试在 shadow DOM 中查找
  if (!iframe) {
    const allIframes = document.querySelectorAll('iframe')
    for (const f of allIframes) {
      if (f.name === props.subApp || f.id === props.subApp) {
        iframe = f
        break
      }
    }
  }
  return iframe
}

function sendToCurrentSub() {
  if (!sendMessageToSub.value.trim()) return
  const text = sendMessageToSub.value
  const bus = getBus()
  if (bus) bus.$emit('main-to-' + props.subApp, { text, from: '主应用' })
  const iframe = findSubAppIframe()
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({ type: 'main-to-sub', from: '主应用', content: text, target: props.subApp }, '*')
  }
  addLog('parent', '主应用', '已发送给 ' + props.subApp + ': ' + text)
  sendMessageToSub.value = ''
}

function broadcastToAll() {
  const text = '广播消息: ' + new Date().toLocaleTimeString()
  const bus = getBus()
  if (bus) bus.$emit('main-to-all', { text, from: '主应用', target: '*' })
  ;['react-next', 'vue3', 'react-spa'].forEach(name => {
    if (bus) bus.$emit('main-to-' + name, { text, from: '主应用', target: '*' })
    const iframe = document.querySelector(`iframe[name="${name}"]`)
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'main-to-sub', from: '主应用', content: text, target: '*' }, '*')
    }
  })
  addLog('parent', '主应用', '广播: ' + text)
}

const handleMessage = (e: MessageEvent) => {
  if (e.data?.type === 'sub-app-message' && !e.data.bridged) {
    addLog('child', e.data.from, e.data.content)
  }
  // 跨子应用中转
  if (e.data?.subAppBridge && e.data.action === 'forward-to-sub' && e.data.target) {
    const targetName = e.data.target
    const bus = getBus()
    if (bus) bus.$emit('sub-to-sub', { target: targetName, from: e.data.from, content: e.data.content })
    const iframe = document.querySelector(`iframe[name="${targetName}"]`)
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'sub-app-message', from: e.data.from, originalFrom: e.data.from,
        content: e.data.content, bridged: true, target: targetName
      }, '*')
    }
  }
}

function onWujieLoad() {
  loading.value = false
  addLog('self', '系统', props.subApp + ' 子应用已加载')
}

function onWujieError(e: any) {
  error.value = '加载失败: ' + (typeof e === 'string' ? e : JSON.stringify(e))
  loading.value = false
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
  const bus = getBus()
  if (bus) {
    bus.$on('sub-to-main', (data: any) => {
      if (data?.from && data?.content) addLog('child', data.from, data.content)
    })
  }
  setTimeout(() => { if (loading.value) loading.value = false }, 5000)
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<template>
  <div class="space-y-4">
    <!-- 通信控制 -->
    <div class="flex gap-2">
      <input
        v-model="sendMessageToSub"
        placeholder="输入要发送给子应用的消息..."
        class="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background"
        @keyup.enter="sendToCurrentSub"
      />
      <button
        @click="sendToCurrentSub"
        :disabled="!sendMessageToSub.trim()"
        class="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        发送给当前子应用
      </button>
      <button
        @click="broadcastToAll"
        class="px-3 py-2 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
      >
        广播
      </button>
    </div>

    <!-- 消息日志 -->
    <div class="rounded-lg border bg-card" v-if="messages.length > 0">
      <div class="p-3 max-h-40 overflow-auto space-y-1">
        <template v-for="(msg, i) in messages" :key="i">
          <div
            v-if="i > 0 && msg.type !== messages[i-1].type"
            class="border-t-2 border-dashed border-gray-300 my-2 pt-2"
          ></div>
          <div
            :class="[
              'text-xs py-1 px-2 rounded',
              msg.type === 'parent' ? 'bg-blue-50 text-blue-800' : '',
              msg.type === 'child' ? 'bg-green-50 text-green-800' : '',
              msg.type === 'self' ? 'bg-gray-50 text-gray-600' : '',
            ]"
          >
            <span class="font-medium">[{{ msg.time }}]</span>
            <span class="ml-1 font-semibold">{{ msg.from }}:</span>
            <span class="ml-1">{{ msg.content }}</span>
            <span v-if="msg.type === 'parent'" class="ml-2 text-[10px] text-blue-500 border border-blue-300 rounded px-1">主应用</span>
            <span v-else-if="msg.type === 'child'" class="ml-2 text-[10px] text-green-500 border border-green-300 rounded px-1">子应用</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 子应用容器 -->
    <div class="relative rounded-lg border overflow-hidden min-h-[400px] bg-white">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
        <div class="text-sm text-muted-foreground">正在加载子应用...</div>
      </div>
      <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
        <div class="text-sm text-destructive">{{ error }}</div>
      </div>

      <!-- Next.js 子应用使用原生 iframe，保留 SSR 能力 -->
      <iframe
        v-if="subApp === 'react-next'"
        :src="'http:' + url"
        name="react-next"
        style="width: 100%; height: 400px; border: none;"
        @load="onWujieLoad"
      ></iframe>
      <!-- 其他子应用使用 wujie 沙箱 -->
      <WujieVue
        v-else-if="url"
        :width="'100%'"
        :height="'100%'"
        :name="subApp"
        :url="url"
        :sync="true"
        :alive="true"
        :plugins="[]"
        :props="{ appName: subApp, appUrl: url }"
        style="min-height: 400px;"
        @load="onWujieLoad"
        @error="onWujieError"
      />
      <div v-else class="flex items-center justify-center h-[400px] text-muted-foreground">
        未知子应用
      </div>
    </div>
  </div>
</template>