import type { RouteRecordRaw } from 'vue-router'
import { RouterView } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: 'growth-profile',
    component: RouterView,
    meta: { title: '个人成长档案' },
    children: [
        {
            path: '', // Default child route at /growth-profile
            name: 'GrowthProfileList',
            component: () => import('@/pages/growth-profile/GrowthProfileList.vue'),
            // The title from the parent is fine
        },
        {
            path: ':id', // Matches /growth-profile/:id
            name: 'GrowthProfileDetail',
            component: () => import('@/pages/growth-profile/GrowthProfileDetail.vue'),
            meta: { title: '档案详情' }, // More specific title
        }
    ]
  },
]

export default routes 