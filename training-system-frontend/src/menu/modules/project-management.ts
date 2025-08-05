import type { MenuItem } from '../types'
import { Folder, List, Calendar, PieChart } from '@element-plus/icons-vue'

export const projectManagementMenu: MenuItem = {
  key: 'project-management',
  title: '项目管理',
  path: '/training-management/project-management',
  icon: Folder,
  children: [
    {
      key: 'project-list',
      title: '项目列表',
      path: '/training-management/project-management/list',
      icon: List,
    },
    {
      key: 'plan-management',
      title: '计划管理',
      path: '/training-management/project-management/plan',
      icon: Calendar,
    },
    {
      key: 'template-management',
      title: '模板管理',
      path: '/training-management/project-management/templates',
      icon: List,
    },
    {
      key: 'assessment-center',
      title: '测评中心',
      path: '/training-management/project-management/assessment-center',
      icon: PieChart,
      children: [
        {
          key: 'test-center',
          title: '测试中心',
          path: '/training-management/project-management/assessment-center/test',
          children: [
            {
              key: 'question-bank',
              title: '题库管理',
              path: '/training-management/project-management/assessment-center/test/question-bank',
            },
            {
              key: 'exam-paper',
              title: '试卷管理',
              path: '/training-management/project-management/assessment-center/test/exam-paper',
            },
            {
              key: 'exam-management',
              title: '考试管理',
              path: '/training-management/project-management/assessment-center/test/exam-management',
            },
          ],
        },
        {
          key: 'survey-center',
          title: '调查中心',
          path: '/training-management/project-management/assessment-center/survey',
          children: [
            {
              key: 'survey-management',
              title: '调查管理',
              path: '/training-management/project-management/assessment-center/survey/survey-management',
            },
            {
              key: 'questionnaire-template',
              title: '问卷模板',
              path: '/training-management/project-management/assessment-center/survey/questionnaire-template',
            },
          ],
        },
      ],
    },
  ],
} 