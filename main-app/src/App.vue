<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import MessagePanel from './components/MessagePanel.vue'

const messages = ref<Array<{from: string; content: string; time: string}>>([
  { from: '系统', content: '微前端应用已启动，欢迎使用！', time: new Date().toLocaleTimeString() }
])

// 全局消息队列 — 当目标子应用 iframe 不在视图中时缓存消息
const pendingQueue = ref<Record<string, Array<{from: string; content: string}>>>({
  'react-next': [],
  'vue3': [],
  'react-spa': []
})

function enqueueMsg(target: string, from: string, content: string) {
  if (pendingQueue.value[target]) {
    pendingQueue.value[target].push({ from, content })
  }
}

function dequeueMsgs(target: string): Array<{from: string; content: string}> {
  if (!pendingQueue.value[target]) return []
  return pendingQueue.value[target].splice(0)
}

// 挂到 window 上供 SubAppContainer 访问
;(window as any).__mfeQueue = { enqueueMsg, dequeueMsgs }

function addMessage(from: string, content: string) {
  messages.value.push({
    from,
    content,
    time: new Date().toLocaleTimeString()
  })
}

window.addEventListener('message', (e) => {
  if (e.data?.type === 'sub-app-message') {
    addMessage(e.data.from, e.data.content)
  }
})

;(window as any).__WUJIE_MAIN_APP__ = {
  addMessage,
  sendToSubApp: (subAppName: string, data: any) => {
    addMessage('主应用', '向 ' + subAppName + ' 发送: ' + JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('main-app-message', {
      detail: { target: subAppName, ...data }
    }))
  },
  broadcastToAll: (data: any) => {
    addMessage('主应用', '广播给所有子应用: ' + JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('main-app-message', {
      detail: { target: '*', ...data }
    }))
  }
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <Sidebar />
    <div class="flex-1 flex flex-col">
      <header class="h-14 border-b flex items-center px-6 bg-white/80 backdrop-blur-sm">
        <h1 class="text-lg font-semibold text-foreground">微前端 Demo - wujie 框架</h1>
        <span class="ml-4 text-xs text-muted-foreground">主应用: Vue3 + shadcn-vue</span>
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <router-view :key="$route.fullPath" />
      </main>
      <MessagePanel :messages="messages" />
    </div>
  </div>
</template>