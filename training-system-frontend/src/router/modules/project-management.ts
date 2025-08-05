import type { RouteRecordRaw } from 'vue-router'
import { RouterView } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: 'project-management',
    component: RouterView,
    redirect: '/project-management/list',
    name: 'ProjectManagement',
    meta: { title: '项目管理', icon: 'Box' },
    children: [
      {
        path: 'list',
        name: 'ProjectList',
        component: () => import('@/modules/project-management/pages/ProjectList.vue'),
        meta: { title: '项目列表', icon: 'List' },
      },
      {
        path: 'create',
        name: 'ProjectCreate',
        component: () => import('@/modules/project-management/pages/ProjectCreateForm.vue'),
        meta: { title: '创建项目', activeMenu: '/project-management/list' },
      },
      {
        path: 'plan',
        name: 'PlanManagement',
        component: () => import('@/modules/project-management/pages/PlanManagement.vue'),
        meta: { title: '计划管理', icon: 'Calendar' },
      },
      {
        path: 'plan/:id',
        name: 'PlanDetail',
        component: () => import('@/modules/project-management/pages/PlanDetail.vue'),
        meta: { title: '计划详情', activeMenu: '/project-management/plan' },
      },
      {
        path: 'plan/create',
        name: 'PlanCreate',
        component: () => import('@/modules/project-management/pages/PlanCreate.vue'),
        meta: { title: '新建计划', activeMenu: '/project-management/plan' },
      },
      {
        path: 'detail/:id',
        name: 'ProjectDetail',
        component: () => import('@/modules/project-management/pages/ProjectDetail.vue'),
        meta: { title: '项目详情' },
      },
      // 在线考试页面（学员侧）
      {
        path: 'detail/:projectId/exam/:examId',
        name: 'ProjectExam',
        component: () => import('@/modules/project-management/execution/components/ExamPlayer.vue'),
        meta: { title: '在线考试' },
      },
      // 辅导员评分页面
      {
        path: 'detail/:projectId/counselor-task/:taskId',
        name: 'CounselorTaskReview',
        component: () => import('@/modules/project-management/components/CounselorTaskReview.vue'),
        meta: { title: '辅导员评分' },
      },
      {
        path: 'templates',
        name: 'TemplateManagement',
        component: () =>
          import('@/modules/project-management/pages/TemplateManagement.vue'),
        meta: { title: '模板管理' },
      },
      {
        path: 'templates/message/:id?',
        name: 'MessageTemplateEditor',
        component: () => import('@/modules/project-management/pages/MessageTemplateEditor.vue'),
        meta: { title: '消息模板', hidden: true },
      },
      {
        path: 'templates/group/:id?',
        name: 'GroupChatTemplateEditor',
        component: () => import('@/modules/project-management/pages/GroupChatTemplateEditor.vue'),
        meta: { title: '群聊模板', hidden: true },
      },
      // 测评中心路由
      {
        path: 'assessment-center',
        name: 'AssessmentCenterInProject',
        component: () => import('@/modules/assessment-center/pages/AssessmentCenterLayout.vue'),
        meta: { title: '测评中心', icon: 'PieChart' },
      },
    ],
  },
  {
    path: 'talent-recommendation',
    name: 'AdminRecommendation',
    component: () => import('@/modules/project-management/pages/AdminRecommendation.vue'),
    meta: {
      title: '人才推荐管理',
      icon: 'recommendation'
    }
  }
]

export default routes 