import type { MenuItem } from '../types'
import { Monitor } from '@element-plus/icons-vue'

export const workbenchMenu: MenuItem = {
  key: 'workbench',
  title: '工作台',
  path: '/training-management/workbench',
  icon: Monitor,
  children: [
    {
      key: 'workbench-mentor',
      title: '带教老师工作台',
      path: '/training-management/workbench/mentor',
    },
    {
      key: 'workbench-counselor',
      title: '辅导员工作台',
      path: '/training-management/workbench/counselor',
    },
  ],
} 