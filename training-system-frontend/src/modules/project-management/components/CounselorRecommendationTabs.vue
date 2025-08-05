<template>
  <div>
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="projects.length === 0" class="empty-container">
      <el-empty description="暂无参与的项目" />
    </div>
    <el-tabs v-else v-model="active" @tab-change="handleTabChange">
      <el-tab-pane
        v-for="proj in projects"
        :key="proj.id"
        :label="proj.name"
        :name="proj.id"
      >
        <CounselorRecommendation 
          :project-id="proj.id" 
          :key="`${proj.id}-${active}`"
          :active="active === proj.id"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElSkeleton, ElEmpty } from 'element-plus'
import CounselorRecommendation from './CounselorRecommendation.vue'
import request from '@/utils/request'

interface Project {
  id: string
  name: string
  projectNo: string
  status: string
  currentStage: string
}

const projects = ref<Project[]>([])
const active = ref('')
const loading = ref(true)

// 获取辅导员参与的项目列表
const fetchProjects = async () => {
  try {
    loading.value = true
    console.log('🔍 开始获取辅导员参与的项目列表...')
    
    // 获取当前用户ID
    const currentUserId = localStorage.getItem('userId')
    
    // 添加详细的调试信息
    console.log('🔍 请求URL: /api/workbench/projects')
    console.log('🔍 localStorage token:', localStorage.getItem('token'))
    console.log('🔍 localStorage userId:', currentUserId)
    
    // 通过查询参数传递用户ID
    const response = await request.get('/api/workbench/projects', {
      params: {
        userId: currentUserId
      }
    })
    console.log('🔍 获取项目列表响应:', response)
    
    if (response) {
      // 检查响应数据的结构
      console.log('🔍 响应数据类型:', typeof response)
      console.log('🔍 响应数据内容:', response)
      
      // 响应拦截器已经解包了标准格式，直接使用response
      let projectsData = response
      
      // 兼容处理：如果还是有data字段的包装格式
      if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        console.log('🔍 检测到包装格式，使用data字段')
        projectsData = response.data
      }
      
      // 确保 projectsData 是数组
      if (Array.isArray(projectsData)) {
        projects.value = projectsData.filter((project: Project) => 
          project.status === 'ACTIVE' || project.status === 'APPROVED'
        )
        console.log('🔍 过滤后的活跃项目:', projects.value)
        console.log('🔍 第一个项目的ID:', projects.value[0]?.id)
        
        // 设置默认选中的项目
        if (projects.value.length > 0) {
          active.value = projects.value[0].id
          console.log('🔍 设置默认选中项目ID:', active.value)
        }
      } else {
        console.warn('🔍 项目数据不是数组格式:', projectsData)
        console.warn('🔍 原始响应:', response)
        projects.value = []
      }
    } else {
      console.warn('🔍 获取项目列表失败: 响应为空')
      ElMessage.warning('获取项目列表失败')
    }
  } catch (error) {
    console.error('🔍 获取项目列表异常:', error)
    console.error('🔍 错误详情:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data
    })
    ElMessage.error('获取项目列表失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 处理标签页切换
const handleTabChange = (activeName: string) => {
  console.log('🔍 标签页切换到:', activeName)
  active.value = activeName
  
  // 找到对应的项目
  const project = projects.value.find(p => p.id === activeName)
  if (project) {
    console.log('🔍 切换到项目:', project.name)
  }
}

// 监听active变化，确保响应性
watch(() => active.value, (newActive, oldActive) => {
  if (newActive !== oldActive) {
    console.log('🔍 激活的项目ID变化:', { oldActive, newActive })
  }
})

onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.loading-container {
  padding: 20px;
}

.empty-container {
  padding: 40px 20px;
}
</style> 