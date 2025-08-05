import type { RouteRecordRaw } from 'vue-router';

const knowledgeSharingRoutes: RouteRecordRaw[] = [
  {
    path: '/training-management/knowledge-sharing',
    name: 'KnowledgeSharing',
    redirect: '/training-management/knowledge-sharing/square',
    meta: {
      title: '知识分享',
      icon: 'Document',
      order: 3
    },
    children: [
      {
        path: 'square',
        name: 'KnowledgeSquare',
        component: () => import('@/modules/knowledge-sharing/pages/KnowledgeSquare.vue'),
        meta: {
          title: '知识广场',
          icon: 'Grid',
          keepAlive: true
        }
      },
      {
        path: 'detail/:id',
        name: 'KnowledgeDetail',
        component: () => import('@/modules/knowledge-sharing/pages/KnowledgeDetail.vue'),
        meta: {
          title: '知识详情',
          hidden: true,
          keepAlive: false
        }
      },
      // 第三阶段：知识管理
      {
        path: 'create',
        name: 'KnowledgeCreate',
        component: () => import('@/modules/knowledge-sharing/pages/KnowledgeCreate.vue'),
        meta: {
          title: '创建知识',
          icon: 'Plus',
          keepAlive: false
        }
      },
      {
        path: 'edit/:id',
        name: 'KnowledgeEdit',
        component: () => import('@/modules/knowledge-sharing/pages/KnowledgeEdit.vue'),
        meta: {
          title: '编辑知识',
          hidden: true,
          keepAlive: false
        }
      },
      // 第三阶段：个人中心
      {
        path: 'personal',
        name: 'PersonalCenter',
        component: () => import('@/modules/knowledge-sharing/pages/PersonalCenter.vue'),
        meta: {
          title: '个人中心',
          icon: 'User',
          keepAlive: true
        }
      },
      // 活动相关路由
      {
        path: 'activities',
        name: 'ActivityCenter',
        component: () => import('@/modules/knowledge-sharing/pages/ActivityCenter.vue'),
        meta: {
          title: '活动中心',
          icon: 'Calendar',
          keepAlive: true
        }
      },
      {
        path: 'activities/:id',
        name: 'ActivityDetail',
        component: () => import('@/modules/knowledge-sharing/pages/ActivityDetail.vue'),
        meta: {
          title: '活动详情',
          hidden: true,
          keepAlive: false
        }
      },
      // 搜索结果页面
      {
        path: 'search',
        name: 'KnowledgeSearch',
        component: () => import('@/modules/knowledge-sharing/pages/KnowledgeSearch.vue'),
        meta: {
          title: '搜索结果',
          hidden: true,
          keepAlive: true
        }
      }
      // TODO: 其他路由将在后续阶段开发时添加
      // - 专家网络 (KnowledgeExperts)
      // - 知识分类 (KnowledgeCategories)
      // - 知识标签 (KnowledgeTags)
      // - 知识统计 (KnowledgeStatistics)
      // - 管理后台 (KnowledgeAdmin)
    ]
  }
];

export default knowledgeSharingRoutes; 