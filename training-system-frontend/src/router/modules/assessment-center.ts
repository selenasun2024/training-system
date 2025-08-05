import type { RouteRecordRaw } from 'vue-router'
import { RouterView } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: 'assessment-center',
    component: RouterView,
    redirect: '/training-management/assessment-center/survey/questionnaire-template',
    name: 'AssessmentCenter',
    meta: { title: '测评中心', icon: 'PieChart' },
    children: [
      // 测试中心
      {
        path: 'test',
        component: RouterView,
        redirect: '/training-management/assessment-center/test/question-bank',
        name: 'TestCenter',
        meta: { title: '测试中心', icon: 'Document' },
        children: [
          {
            path: 'question-bank',
            name: 'QuestionBank',
            component: () => import('@/modules/assessment-center/pages/test/QuestionBank.vue'),
            meta: { title: '题库管理', icon: 'Edit' },
          },
          {
            path: 'exam-paper',
            name: 'ExamPaper',
            component: () => import('@/modules/assessment-center/pages/test/ExamPaper.vue'),
            meta: { title: '试卷管理', icon: 'Document' },
          },
          {
            path: 'exam-management',
            name: 'ExamManagement',
            component: () => import('@/modules/assessment-center/pages/test/ExamManagement.vue'),
            meta: { title: '考试管理', icon: 'Calendar' },
          },
        ]
      },
      // 调查中心
      {
        path: 'survey',
        component: RouterView,
        redirect: '/training-management/assessment-center/survey/questionnaire-template',
        name: 'SurveyCenter',
        meta: { title: '调查中心', icon: 'DataLine' },
        children: [
          {
            path: 'survey-management',
            name: 'SurveyManagement',
            component: () => import('@/modules/assessment-center/pages/survey/SurveyManagement.vue'),
            meta: { title: '调查管理', icon: 'TrendCharts' },
          },
          {
            path: 'questionnaire-template',
            name: 'QuestionnaireTemplate',
            component: () => import('@/modules/assessment-center/pages/survey/QuestionnaireTemplate.vue'),
            meta: { title: '问卷模板', icon: 'Document' },
          },
        ]
      }
    ]
  }
]

export default routes 