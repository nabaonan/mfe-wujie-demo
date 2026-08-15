<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navItems = [
  { name: 'Home', path: '/', label: '主应用首页' },
  { name: 'SubReactNext', path: '/sub-react-next', label: 'React Next.js 子应用' },
  { name: 'SubVue3', path: '/sub-vue3', label: 'Vue3 子应用' },
  { name: 'SubReactSpa', path: '/sub-react-spa', label: 'React SPA 子应用' }
]

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <aside class="w-56 border-r bg-card flex flex-col">
    <div class="h-14 flex items-center px-4 border-b">
      <span class="font-bold text-primary text-sm">MFE Demo</span>
    </div>
    <nav class="flex-1 p-2 space-y-1">
      <button
        v-for="item in navItems"
        :key="item.name"
        @click="navigate(item.path)"
        :class="[
          'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
          route.path === item.path
            ? 'bg-primary text-primary-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        ]"
      >
        {{ item.label }}
      </button>
    </nav>
    <div class="p-3 border-t text-xs text-muted-foreground">
      <p>wujie-vue3</p>
      <p>跨应用通信</p>
    </div>
  </aside>
</template>
