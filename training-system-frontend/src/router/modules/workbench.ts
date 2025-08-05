import type { RouteRecordRaw } from 'vue-router'

const workbenchRoutes: RouteRecordRaw[] = [
  {
    path: '/training-management/workbench',
    name: 'Workbench',
    redirect: '/training-management/workbench/admin',
    meta: {
      title: '工作台',
      icon: 'workbench',
      requiresAuth: true,
    },
    children: [
      // 管理员工作台
      {
        path: 'admin',
        name: 'AdminWorkbench',
        component: () => import('@/pages/workbench/AdminWorkbench.vue'),
        meta: {
          title: '管理工作台',
          icon: 'admin',
          requiresAuth: true,
          roles: ['admin', 'manager'],
        }
      },
      
      // 带教老师工作台
      {
        path: 'mentor',
        name: 'MentorWorkbench',
        component: () => import('@/pages/workbench/MentorWorkbench.vue'),
        meta: {
          title: '带教工作台',
          icon: 'mentor',
          requiresAuth: true,
          roles: ['mentor', 'teacher'],
        }
      },
      
      // TODO: 待实现的详情页面路由
      // {
      //   path: 'mentor/student/:studentId',
      //   name: 'MentorStudentDetail',
      //   component: () => import('@/pages/workbench/MentorStudentDetail.vue'),
      //   meta: {
      //     title: '学员详情',
      //     requiresAuth: true,
      //     roles: ['mentor', 'teacher'],
      //     hidden: true,
      //   }
      // },
      
      // 辅导员工作台
      {
        path: 'counselor',
        name: 'CounselorWorkbench',
        component: () => import('@/pages/workbench/CounselorWorkbench.vue'),
        meta: {
          title: '辅导员工作台',
          icon: 'counselor',
          requiresAuth: true,
          roles: ['counselor'],
        }
      }
    ]
  }
]

export default workbenchRoutes 