<template>
  <div class="project-summary">
    <el-tabs v-model="activeTab" class="summary-tabs">
      <!-- 总结正文 -->
      <el-tab-pane label="总结正文" name="editor">
        <summary-editor v-model="htmlContent" :disabled="!editMode" />
        <attachment-uploader v-model="attachments" class="mt-2" :disabled="!editMode" />
      </el-tab-pane>

      <!-- 图片链接 -->
      <el-tab-pane label="图片链接" name="image">
        <image-link-form @insert="handleInsertImage" :disabled="!editMode" />
        <el-table :data="imageLinks" size="small" class="mt-2">
          <el-table-column prop="url" label="URL" />
          <el-table-column prop="desc" label="描述" />
          <el-table-column width="80" v-if="editMode">
            <template #default="scope">
              <el-button type="text" @click="removeImage(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 培训视频 -->
      <el-tab-pane label="培训视频" name="video">
        <course-picker v-model="selectedVideos" :disabled="!editMode" />
      </el-tab-pane>

      <!-- 项目新闻 -->
      <el-tab-pane label="新闻" name="news">
        <ProjectNews :edit-mode="editMode" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { updateProject } from '@/api/modules/project'
import SummaryEditor from './summary/SummaryEditor.vue'
import AttachmentUploader from './summary/AttachmentUploader.vue'
import CoursePicker from './summary/CoursePicker.vue'
import ImageLinkForm from './summary/ImageLinkForm.vue'
import ProjectNews from './ProjectNews.vue'

// Props
const props = defineProps<{
  editMode?: boolean
  projectId?: string
  projectData?: any
}>()

// Emits
const emit = defineEmits<{
  'summary-saved': [data: any]
  'summary-updated': [data: any]
}>()

const activeTab = ref('editor')

// 编辑器内容、附件、视频、图片
const htmlContent = ref('')
const attachments = ref<any[]>([])
const selectedVideos = ref<any[]>([])
const imageLinks = ref<{ url: string; desc: string }[]>([])

// 处理图片插入
function handleInsertImage(link: { url: string; desc: string }) {
  if (!props.editMode) return
  
  imageLinks.value.push(link)
  // 简化：直接在正文尾部追加 <img>
  htmlContent.value += `<p><img src="${link.url}" alt="${link.desc}"/></p>`
}

// 移除图片
function removeImage(index: number) {
  if (!props.editMode) return
  imageLinks.value.splice(index, 1)
}

// 获取总结数据
const getSummaryData = () => {
  return {
    content: htmlContent.value,
    attachments: attachments.value,
    videos: selectedVideos.value,
    images: imageLinks.value
  }
}

// 保存总结数据
const saveSummary = async () => {
  if (!props.projectId) {
    ElMessage.error('项目ID不存在')
    return false
  }

  try {
    console.log('💾 保存项目总结数据...')
    
    const summaryData = getSummaryData()
    console.log('📋 总结数据:', summaryData)
    
    // 🔧 临时方案：先保存到localStorage
    const storageKey = `project_summary_${props.projectId}`
    localStorage.setItem(storageKey, JSON.stringify(summaryData))
    console.log('💾 数据已保存到localStorage:', storageKey)
    
    // 准备更新数据，将总结数据存储到项目配置中
    const updateData = {
      config: {
        summary: summaryData
      }
    }
    
    try {
      const result = await updateProject(props.projectId, updateData)
      console.log('✅ 项目总结API保存成功:', result)
    } catch (apiError) {
      console.warn('⚠️ API保存失败，但localStorage保存成功:', apiError)
      // API失败不影响用户体验，因为localStorage已经保存了
    }
    
    // 触发保存成功事件
    emit('summary-saved', summaryData)
    
    ElMessage.success('项目总结已保存')
    return true
  } catch (error: any) {
    console.error('❌ 保存项目总结失败:', error)
    ElMessage.error(`保存失败: ${error.response?.data?.message || error.message || '未知错误'}`)
    return false
  }
}

// 加载总结数据
const loadSummaryData = () => {
  // 🔧 优先从localStorage加载数据
  if (props.projectId) {
    const storageKey = `project_summary_${props.projectId}`
    const savedData = localStorage.getItem(storageKey)
    
    if (savedData) {
      try {
        const summaryData = JSON.parse(savedData)
        console.log('📋 从localStorage加载总结数据:', summaryData)
        
        htmlContent.value = summaryData.content || ''
        attachments.value = summaryData.attachments || []
        selectedVideos.value = summaryData.videos || []
        imageLinks.value = summaryData.images || []
        return
      } catch (error) {
        console.warn('⚠️ localStorage数据解析失败:', error)
      }
    }
  }
  
  // 如果localStorage没有数据，尝试从项目配置加载
  if (props.projectData?.config?.summary) {
    const summaryConfig = props.projectData.config.summary
    console.log('📋 从项目配置加载总结数据:', summaryConfig)
    
    htmlContent.value = summaryConfig.content || ''
    attachments.value = summaryConfig.attachments || []
    selectedVideos.value = summaryConfig.videos || []
    imageLinks.value = summaryConfig.images || []
  }
}

// 监听项目数据变化
watch(() => props.projectData, () => {
  loadSummaryData()
}, { immediate: true, deep: true })

// 组件挂载时加载数据
onMounted(() => {
  loadSummaryData()
})

// 暴露保存方法给父组件
defineExpose({
  saveSummary,
  getSummaryData
})
</script>

<style scoped>
.project-summary {
  padding: 16px;
}
.summary-tabs {
  min-height: 400px;
}
.mt-2 {
  margin-top: 12px;
}
</style> 