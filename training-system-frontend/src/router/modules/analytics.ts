import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: 'analytics',
    name: 'Analytics',
    component: () => import('@/pages/analytics/AnalyticsDashboard.vue'),
    meta: { title: '数据分析' },
  },
]

export default routes 