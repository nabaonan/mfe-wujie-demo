import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import WujieVue from 'wujie-vue3'

const app = createApp(App)
app.use(router)
app.use(WujieVue)
app.mount('#app')
