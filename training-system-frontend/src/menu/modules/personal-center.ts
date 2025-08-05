import type { MenuItem } from '../types'
import { User, Document, Clock, Trophy } from '@element-plus/icons-vue'

export const personalCenterMenu: MenuItem = {
  key: 'personal-center',
  title: '学习中心',
  path: '/training-management/personal-center/dashboard',
  icon: User,
  children: [
    {
      key: 'personal-dashboard',
      title: '学习首页',
      path: '/training-management/personal-center/dashboard',
      icon: User,
    },
    {
      key: 'my-tasks',
      title: '我的作业',
      path: '/training-management/personal-center/tasks',
      icon: Document,
    },
    {
      key: 'my-schedule',
      title: '我的课表',
      path: '/training-management/personal-center/schedule',
      icon: Clock,
    },
    {
      key: 'my-achievements',
      title: '我的成绩',
      path: '/training-management/personal-center/achievements',
      icon: Trophy,
    },
    {
      key: 'my-growth',
      title: '我的成长',
      path: '/training-management/growth-development/my-growth',
      icon: User,
    },
  ],
} 