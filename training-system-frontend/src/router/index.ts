import { createRouter, createWebHistory } from 'vue-router'
import TrainingLayout from '@/layouts/TrainingLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'
// import { useUserStore } from '@/stores/user'  // 暂时注释掉

// 自动导入所有路由模块
const modules = import.meta.glob('./modules/*.ts', { eager: true })
const appRoutes = Object.values(modules).flatMap((module: any) => module.default || [])

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/training-management/dashboard',  // 直接跳转到主页面
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/training-management',
      name: 'TrainingManagement',
      component: TrainingLayout,
      redirect: '/training-management/dashboard',
      meta: { requiresAuth: false },  // 暂时不需要认证
      children: appRoutes,
    },
  ],
})

// 路由守卫 - 暂时注释掉，专注于核心功能调试
/*
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = localStorage.getItem('token')
  
  // 检查是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth !== false)) {
    if (!token || !userStore.isLoggedIn) {
      // 如果没有token或未登录，跳转到登录页
      next('/login')
    } else {
      next()
    }
  } else {
    // 如果已登录但访问登录页，重定向到主页
    if (to.path === '/login' && token && userStore.isLoggedIn) {
      next('/training-management/dashboard')
    } else {
      next()
    }
  }
})
*/

export default router 