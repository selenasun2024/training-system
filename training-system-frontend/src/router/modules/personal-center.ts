import type { RouteRecordRaw } from 'vue-router'
import { RouterView } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: 'personal-center',
    component: RouterView,
    redirect: '/training-management/personal-center/dashboard',
    name: 'PersonalCenter',
    meta: { title: '学习中心', icon: 'User' },
    children: [
      // 学习中心首页（总览页）
      {
        path: 'dashboard',
        name: 'PersonalCenterDashboard',
        component: () => import('@/pages/personal/PersonalCenter.vue'),
        meta: { title: '学习中心', hideInBreadcrumb: true },
      },
      // 具体功能页面
      {
        path: 'tasks',
        name: 'MyTasks',
        component: () => import('@/modules/personal-center/pages/MyTasks.vue'),
        meta: { title: '我的作业' },
      },
      {
        path: 'schedule',
        name: 'MySchedule',
        component: () => import('@/modules/personal-center/pages/MySchedule.vue'),
        meta: { title: '我的课表' },
      },
      {
        path: 'achievements',
        name: 'MyAchievements',
        component: () => import('@/modules/personal-center/pages/MyAchievements.vue'),
        meta: { title: '我的成绩' },
      },
      {
        path: 'todos',
        name: 'MyTodos',
        component: () => import('@/modules/personal-center/pages/MyTodos.vue'),
        meta: { title: '我的待办' },
      },
    ],
  },
]

export default routes 