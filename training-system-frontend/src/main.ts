import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import UserSelector from './components/common/UserSelector.vue'
import GroupSelector from './components/common/GroupSelector.vue'
import SafeDialog from './components/common/SafeDialog.vue'
import SubsidyDetailDialog from './components/common/SubsidyDetailDialog.vue'
import PerformanceDetailDialog from './components/common/PerformanceDetailDialog.vue'
import EditCriteriaDialog from './components/common/EditCriteriaDialog.vue'
import { useUserStore } from './stores/user'
import { initConfig } from './utils/config'
import logger from './utils/logger'

// 初始化应用配置
try {
  initConfig()
  logger.info('应用配置初始化成功')
} catch (error) {
  logger.error('应用配置初始化失败，无法启动应用', error)
  throw error
}

const app = createApp(App)

// 安装 Pinia
const pinia = createPinia()
app.use(pinia)

app.use(router)

// 注册全局组件
app.component('UserSelector', UserSelector)
app.component('GroupSelector', GroupSelector)
app.component('SafeDialog', SafeDialog)
app.component('SubsidyDetailDialog', SubsidyDetailDialog)
app.component('PerformanceDetailDialog', PerformanceDetailDialog)
app.component('EditCriteriaDialog', EditCriteriaDialog)

// 初始化用户信息
const userStore = useUserStore()
userStore.initUser()

app.mount('#app')

// 记录应用启动
logger.info('Vue应用启动完成', {
  mode: import.meta.env.MODE,
  version: import.meta.env.PACKAGE_VERSION
})
