import type { MenuItem } from '../types'
import { User, DataAnalysis, Monitor } from '@element-plus/icons-vue'

export const growthDevelopmentMenu: MenuItem = {
  key: 'growth-development',
  title: '成长发展',
  path: '/training-management/growth-development',
  icon: User,
  children: [
    {
      key: 'growth-management',
      title: '成长管理',
      path: '/training-management/workbench/admin',
      icon: Monitor,
    },
    {
      key: 'talent-map',
      title: '人力地图',
      path: '/training-management/growth-development/talent-map',
      icon: User,
    },
    {
      key: 'growth-profile-sub',
      title: '成长档案',
      path: '/training-management/growth-profile',
      icon: User,
    },
    {
      key: 'growth-dashboard',
      title: '成长数据看板',
      path: '/training-management/growth-development/dashboard',
      icon: DataAnalysis,
    },
  ],
} 