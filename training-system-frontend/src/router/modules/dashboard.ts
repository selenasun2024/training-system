import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: 'dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/dashboard/Dashboard.vue'),
    meta: { title: '培训首页' },
  },
]

export default routes 