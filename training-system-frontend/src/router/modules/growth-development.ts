import type { RouteRecordRaw } from 'vue-router'

const growthDevelopmentRoutes: RouteRecordRaw = {
  path: 'growth-development',
  name: 'GrowthDevelopment',
  component: () => import('@/modules/growth-development/pages/GrowthDevelopmentLayout.vue'),
  redirect: { name: 'GrowthWelcome' },
  children: [
    {
      path: '',
      name: 'GrowthWelcome',
      component: () => import('@/modules/growth-development/pages/Welcome.vue'),
    },
    {
      path: 'my-growth',
      name: 'MyGrowth',
      component: () => import('@/modules/growth-development/pages/MyGrowth.vue'),
    },
    {
      path: 'talent-map',
      name: 'TalentMap',
      component: () => import('@/modules/growth-development/pages/TalentMap.vue'),
    },
    {
      path: 'mentorship',
      name: 'Mentorship',
      component: () => import('@/modules/growth-development/pages/Mentorship.vue'),
    },
    {
      path: 'dashboard',
      name: 'GrowthDashboard',
      component: () => import('@/modules/growth-development/pages/GrowthDashboard.vue'),
    },
    {
      path: 'profile/:userId',
      name: 'GrowthProfile',
      component: () => import('@/modules/growth-development/pages/GrowthProfilePage.vue'),
      meta: {
        title: '成长档案',
        requiresAuth: true
      }
    },
    // 系统集成相关路由 - 平铺结构
    {
      path: 'integration',
      name: 'IntegrationDashboard',
      component: () => import('@/modules/integration/pages/IntegrationDashboard.vue'),
      meta: {
        title: '系统集成概览',
        requiresAuth: true,
        roles: ['admin', 'manager']
      }
    },
    {
      path: 'integration/management',
      name: 'IntegrationManagementPage',
      component: () => import('@/modules/integration/components/IntegrationManagement.vue'),
      meta: {
        title: '集成管理',
        requiresAuth: true,
        roles: ['admin', 'manager']
      }
    },
    {
      path: 'integration/rules',
      name: 'IntegrationRules',
      component: () => import('@/modules/integration/pages/IntegrationRules.vue'),
      meta: {
        title: '集成规则',
        requiresAuth: true,
        roles: ['admin', 'manager']
      }
    },
    {
      path: 'integration/tasks',
      name: 'SyncTasks',
      component: () => import('@/modules/integration/pages/SyncTasks.vue'),
      meta: {
        title: '同步任务',
        requiresAuth: true,
        roles: ['admin', 'manager']
      }
    },
    {
      path: 'integration/matching',
      name: 'MentorMatchingPage',
      component: () => import('@/modules/integration/pages/MentorMatching.vue'),
      meta: {
        title: '导师匹配',
        requiresAuth: true,
        roles: ['admin', 'manager']
      }
    },
    {
      path: 'integration/notifications',
      name: 'IntegrationNotifications',
      component: () => import('@/modules/integration/pages/IntegrationNotifications.vue'),
      meta: {
        title: '通知管理',
        requiresAuth: true,
        roles: ['admin', 'manager']
      }
    },
    {
      path: 'integration/logs',
      name: 'IntegrationLogs',
      component: () => import('@/modules/integration/pages/IntegrationLogs.vue'),
      meta: {
        title: '系统日志',
        requiresAuth: true,
        roles: ['admin', 'manager']
      }
    },
  ],
}

export default growthDevelopmentRoutes 