import type { MenuItem } from '../types'
import { PieChart } from '@element-plus/icons-vue'

export const assessmentCenterMenu: MenuItem = {
  key: 'assessment-center',
  title: '测评中心',
  path: '/training-management/assessment-center',
  icon: PieChart,
  children: [
    {
      key: 'test-center',
      title: '测试中心',
      path: '/training-management/assessment-center/test',
      children: [
        {
          key: 'question-bank',
          title: '题库管理',
          path: '/training-management/assessment-center/test/question-bank',
        },
        {
          key: 'exam-paper',
          title: '试卷管理',
          path: '/training-management/assessment-center/test/exam-paper',
        },
        {
          key: 'exam-management',
          title: '考试管理',
          path: '/training-management/assessment-center/test/exam-management',
        },
      ],
    },
    {
      key: 'survey-center',
      title: '调查中心',
      path: '/training-management/assessment-center/survey',
      children: [
        {
          key: 'survey-management',
          title: '调查管理',
          path: '/training-management/assessment-center/survey/survey-management',
        },
        {
          key: 'questionnaire-template',
          title: '问卷模板',
          path: '/training-management/assessment-center/survey/questionnaire-template',
        },
      ],
    },
  ],
} 