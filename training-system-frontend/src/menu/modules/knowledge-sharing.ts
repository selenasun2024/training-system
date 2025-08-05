import type { MenuItem } from '../types'
import { Document, Grid, Calendar, User, Plus } from '@element-plus/icons-vue'

/**
 * 知识分享模块菜单配置
 */
export const knowledgeSharingMenu: MenuItem = {
  key: 'knowledge-sharing',
  title: '知识分享',
  path: '/training-management/knowledge-sharing',
  icon: Document,
  children: [
    {
      key: 'knowledge-square',
      title: '知识广场',
      path: '/training-management/knowledge-sharing/square',
      icon: Grid,
    },
    {
      key: 'knowledge-create',
      title: '创建知识',
      path: '/training-management/knowledge-sharing/create',
      icon: Plus,
    },
    {
      key: 'personal-center',
      title: '个人中心',
      path: '/training-management/knowledge-sharing/personal',
      icon: User,
    },
    {
      key: 'activity-center',
      title: '活动中心',
      path: '/training-management/knowledge-sharing/activities',
      icon: Calendar,
    },
    // TODO: 后续阶段开发的菜单项
    // {
    //   key: 'my-knowledge',
    //   title: '我的知识',
    //   path: '/training-management/knowledge-sharing/my',
    //   icon: User,
    // },
    // {
    //   key: 'knowledge-collections',
    //   title: '我的收藏',
    //   path: '/training-management/knowledge-sharing/collections',
    //   icon: Star,
    // },
    // {
    //   key: 'expert-network',
    //   title: '专家网络',
    //   path: '/training-management/knowledge-sharing/experts',
    //   icon: UserFilled,
    // },
  ],
} 