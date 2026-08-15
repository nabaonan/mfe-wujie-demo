<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'

const router = useRouter()
const eventLog = ref<string[]>([])

const subApps = [
  { name: 'react-next', label: 'React Next.js', desc: '基于 Next.js 14 的子应用', color: 'bg-gray-100 text-gray-800' },
  { name: 'vue3', label: 'Vue 3', desc: '基于 Vue 3 + Vite 的子应用', color: 'bg-green-100 text-green-800' },
  { name: 'react-spa', label: 'React SPA + Antd', desc: '基于 React + Ant Design 的子应用', color: 'bg-blue-100 text-blue-800' },
]

function handleBroadcast(event: CustomEvent) {
  eventLog.value.push('收到主应用广播: ' + JSON.stringify(event.detail))
}

onMounted(() => {
  window.addEventListener('main-app-message', handleBroadcast as any)
})

onUnmounted(() => {
  window.removeEventListener('main-app-message', handleBroadcast as any)
})
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <h2 class="text-2xl font-bold tracking-tight">微前端 Demo 首页</h2>
      <p class="text-muted-foreground">
        本 Demo 演示了基于 wujie 框架的微前端架构，包含 1 个主应用和 3 个子应用。
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        v-for="app in subApps"
        :key="app.name"
        @click="router.push('/sub-' + app.name)"
        class="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div class="space-y-2">
          <span :class="['inline-block px-2 py-0.5 rounded text-xs font-medium', app.color]">
            {{ app.label }}
          </span>
          <h3 class="font-semibold">{{ app.desc }}</h3>
          <p class="text-xs text-muted-foreground">子应用名称: {{ app.name }}</p>
        </div>
      </div>
    </div>

    <div class="rounded-lg border bg-card p-4">
      <h3 class="text-sm font-semibold mb-3">通信能力说明</h3>
      <ul class="space-y-2 text-sm text-muted-foreground">
        <li class="flex items-start gap-2">
          <span class="text-primary mt-1">&#8226;</span>
          <span><strong>父 &#8594; 子:</strong> 主应用通过 wujie bus 或 window event 向子应用发送消息</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary mt-1">&#8226;</span>
          <span><strong>子 &#8594; 父:</strong> 子应用通过 wujie bus 或 window.postMessage 向主应用发送消息</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary mt-1">&#8226;</span>
          <span><strong>子 &#8596; 子:</strong> 子应用间通过主应用桥梁进行间接通信</span>
        </li>
      </ul>
    </div>

    <div class="rounded-lg border bg-card p-4" v-if="eventLog.length > 0">
      <h3 class="text-sm font-semibold mb-3">广播事件日志</h3>
      <div v-for="(log, i) in eventLog" :key="i" class="text-xs py-1 border-b last:border-0">
        {{ log }}
      </div>
    </div>
  </div>
</template>
