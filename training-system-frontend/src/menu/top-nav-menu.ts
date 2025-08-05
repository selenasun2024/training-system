import type { MenuItem } from './types'
import {
  DataAnalysis,
  User,
  Setting,
} from '@element-plus/icons-vue'
import { dashboardMenu } from './modules/dashboard'
import { projectManagementMenu } from './modules/project-management'
import { workbenchMenu } from './modules/workbench'
import { growthDevelopmentMenu } from './modules/growth-development'
import { knowledgeSharingMenu } from './modules/knowledge-sharing'
import { personalCenterMenu } from './modules/personal-center'


/**
 * 定义顶部导航栏的菜单结构。
 * 新增一级导航模块时，只需在此处添加一个对象即可。
 */
export const topNavMenu: MenuItem[] = [
  dashboardMenu,
  personalCenterMenu,
  workbenchMenu,
  projectManagementMenu,
  growthDevelopmentMenu,
  knowledgeSharingMenu,
  {
    key: 'analytics',
    title: '数据分析',
    path: '/training-management/analytics',
    icon: DataAnalysis,
  },
  {
    key: 'system-configuration',
    title: '系统配置',
    path: '/training-management/system-configuration',
    icon: Setting,
  },
] 