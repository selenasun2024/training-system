<template>
  <div class="api-test-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>前后端联调测试</span>
        </div>
      </template>
      
      <div class="test-section">
        <h3>API连接测试</h3>
        <el-space direction="vertical" :size="20" style="width: 100%">
          
          <!-- 健康检查测试 -->
          <el-card>
            <template #header>健康检查</template>
            <div class="test-item">
              <el-button type="primary" @click="testHealth" :loading="healthLoading">
                测试健康检查 API
              </el-button>
              <div class="result" v-if="healthResult">
                <pre>{{ JSON.stringify(healthResult, null, 2) }}</pre>
              </div>
              <div class="error" v-if="healthError">
                <el-alert type="error" :title="healthError" show-icon />
              </div>
            </div>
          </el-card>

          <!-- 用户登录测试 -->
          <el-card>
            <template #header>用户登录</template>
            <div class="test-item">
              <el-form :model="loginForm" label-width="80px">
                <el-form-item label="用户名">
                  <el-input v-model="loginForm.username" placeholder="admin" />
                </el-form-item>
                <el-form-item label="密码">
                  <el-input v-model="loginForm.password" type="password" placeholder="admin123456" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="testLogin" :loading="loginLoading">
                    测试登录 API
                  </el-button>
                </el-form-item>
              </el-form>
              <div class="result" v-if="loginResult">
                <pre>{{ JSON.stringify(loginResult, null, 2) }}</pre>
              </div>
              <div class="error" v-if="loginError">
                <el-alert type="error" :title="loginError" show-icon />
              </div>
            </div>
          </el-card>

          <!-- 项目列表测试 -->
          <el-card>
            <template #header>项目列表</template>
            <div class="test-item">
              <el-button type="primary" @click="testProjects" :loading="projectsLoading">
                测试项目列表 API
              </el-button>
              <div class="result" v-if="projectsResult">
                <pre>{{ JSON.stringify(projectsResult, null, 2) }}</pre>
              </div>
              <div class="error" v-if="projectsError">
                <el-alert type="error" :title="projectsError" show-icon />
              </div>
            </div>
          </el-card>

        </el-space>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import request from '@/utils/request'

// 健康检查测试
const healthLoading = ref(false)
const healthResult = ref(null)
const healthError = ref('')

const testHealth = async () => {
  healthLoading.value = true
  healthResult.value = null
  healthError.value = ''
  
  try {
    const result = await request.get('/health')
    healthResult.value = result
  } catch (error: any) {
    healthError.value = error.message || '请求失败'
    console.error('Health check error:', error)
  } finally {
    healthLoading.value = false
  }
}

// 登录测试
const loginLoading = ref(false)
const loginResult = ref(null)
const loginError = ref('')
const loginForm = reactive({
  username: 'admin',
  password: 'admin123456'
})

const testLogin = async () => {
  loginLoading.value = true
  loginResult.value = null
  loginError.value = ''
  
  try {
    const result = await request.post('/auth/login', loginForm)
    loginResult.value = result
    // 保存token到localStorage
    if (result && result.access_token) {
      localStorage.setItem('token', result.access_token)
    }
  } catch (error: any) {
    loginError.value = error.message || '登录失败'
    console.error('Login error:', error)
  } finally {
    loginLoading.value = false
  }
}

// 项目列表测试
const projectsLoading = ref(false)
const projectsResult = ref(null)
const projectsError = ref('')

const testProjects = async () => {
  projectsLoading.value = true
  projectsResult.value = null
  projectsError.value = ''
  
  try {
    const result = await request.get('/projects')
    projectsResult.value = result
  } catch (error: any) {
    projectsError.value = error.message || '请求失败'
    console.error('Projects error:', error)
  } finally {
    projectsLoading.value = false
  }
}
</script>

<style scoped>
.api-test-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-section {
  margin-top: 20px;
}

.test-item {
  margin-bottom: 20px;
}

.result {
  margin-top: 15px;
  padding: 10px;
  background-color: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 4px;
}

.result pre {
  margin: 0;
  font-size: 12px;
  color: #1e40af;
}

.error {
  margin-top: 15px;
}
</style> 