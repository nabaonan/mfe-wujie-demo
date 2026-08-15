import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/sub-react-next',
    name: 'SubReactNext',
    component: () => import('../views/SubAppContainer.vue'),
    props: { subApp: 'react-next' }
  },
  {
    path: '/sub-vue3',
    name: 'SubVue3',
    component: () => import('../views/SubAppContainer.vue'),
    props: { subApp: 'vue3' }
  },
  {
    path: '/sub-react-spa',
    name: 'SubReactSpa',
    component: () => import('../views/SubAppContainer.vue'),
    props: { subApp: 'react-spa' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
