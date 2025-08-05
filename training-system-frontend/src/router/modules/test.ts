export default [
  {
    path: '/training-management/api-test',
    name: 'ApiTest',
    component: () => import('@/pages/test/ApiTest.vue'),
    meta: {
      title: 'API联调测试',
      icon: 'Tools',
      hidden: false
    }
  },
  {
    path: '/training-management/fix-validation-test',
    name: 'FixValidationTest',
    component: () => import('@/pages/test/FixValidationTest.vue'),
    meta: {
      title: '修复验证测试',
      icon: 'Tools',
      hidden: false
    }
  }
] 