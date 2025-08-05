import type { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: 'system-configuration',
    name: 'SystemConfiguration',
    component: () => import('@/modules/system-configuration/pages/SystemConfiguration.vue'),
    meta: {
      title: '系统配置',
      requiresAuth: true,
    },
  },
];

export default routes; 