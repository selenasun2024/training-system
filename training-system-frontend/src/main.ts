import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import UserSelector from './components/common/UserSelector.vue'
import GroupSelector from './components/common/GroupSelector.vue'
import { useUserStore } from './stores/user'

const app = createApp(App)

// 安装 Pinia
const pinia = createPinia()
app.use(pinia)

app.use(router)

app.component('UserSelector', UserSelector)
app.component('GroupSelector', GroupSelector)

// 初始化用户信息
const userStore = useUserStore()
userStore.initUser()

app.mount('#app')
