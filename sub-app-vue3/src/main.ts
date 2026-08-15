import { createApp, ref } from 'vue'
import App from './App.vue'

// 独立运行时挂载
function mount() {
  const app = createApp(App)
  app.mount('#app')
  console.log('[Vue3 Sub App] mounted')
}

// wujie 环境下
if ((window as any).__POWERED_BY_WUJIE__) {
  let app: any = null
  // wujie 生命周期
  ;(window as any).__WUJIE_MOUNT = () => {
    app = createApp(App)
    app.mount('#app')
  }
  ;(window as any).__WUJIE_UNMOUNT = () => {
    if (app) {
      app.unmount()
      app = null
    }
  }
} else {
  mount()
}
