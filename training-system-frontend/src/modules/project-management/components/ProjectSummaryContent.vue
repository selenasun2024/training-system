<template>
  <div class="project-summary-content">
    <!-- 总结正文区域 -->
    <div class="summary-section">
      <div class="section-header">
        <h3>总结正文</h3>
      </div>
      <div class="section-content">
        <summary-editor v-model="htmlContent" :disabled="!editMode" />
        <attachment-uploader v-model="attachments" class="mt-2" :disabled="!editMode" />
      </div>
    </div>

    <!-- 图片链接区域 -->
    <div class="summary-section">
      <div class="section-header">
        <h3>图片链接</h3>
        <el-button 
          v-if="editMode" 
          type="primary" 
          size="small" 
          @click="showImageForm = true"
        >
          添加图片
        </el-button>
      </div>
      <div class="section-content">
        <!-- 图片链接表格 -->
        <el-table :data="imageLinks" size="small" v-if="imageLinks.length > 0">
          <el-table-column prop="url" label="URL" />
          <el-table-column prop="desc" label="描述" />
          <el-table-column width="80" v-if="editMode">
            <template #default="scope">
              <el-button type="text" @click="removeImage(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 空状态 -->
        <el-empty 
          v-if="imageLinks.length === 0" 
          description="暂无图片链接" 
          :image-size="80"
        />
      </div>
    </div>

    <!-- 培训视频区域 -->
    <div class="summary-section">
      <div class="section-header">
        <h3>培训视频</h3>
      </div>
      <div class="section-content">
        <course-picker v-model="selectedVideos" :disabled="!editMode" />
      </div>
    </div>

    <!-- 图片添加弹窗 -->
    <el-dialog v-model="showImageForm" title="添加图片链接" width="400px">
      <image-link-form @insert="handleInsertImage" @cancel="showImageForm = false" />
    </el-dialog>
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

// 响应式数据
const htmlContent = ref('')
const attachments = ref<any[]>([])
const selectedVideos = ref<any[]>([])
const imageLinks = ref<{ url: string; desc: string }[]>([])
const showImageForm = ref(false)

// 处理图片插入
function handleInsertImage(link: { url: string; desc: string }) {
  if (!props.editMode) return
  
  imageLinks.value.push(link)
  // 在正文中插入图片
  htmlContent.value += `<p><img src="${link.url}" alt="${link.desc}" style="max-width: 100%; height: auto;"/></p>`
  
  showImageForm.value = false
  ElMessage.success('图片链接已添加')
}

// 移除图片
function removeImage(index: number) {
  if (!props.editMode) return
  imageLinks.value.splice(index, 1)
  ElMessage.success('图片链接已删除')
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
    
    // 保存到localStorage
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
  // 优先从localStorage加载数据
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
.project-summary-content {
  padding: 20px;
}

.summary-section {
  margin-bottom: 32px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-content {
  padding: 20px;
}

.mt-2 {
  margin-top: 12px;
}

/* 确保表格在小屏幕上的响应性 */
@media (max-width: 768px) {
  .project-summary-content {
    padding: 12px;
  }
  
  .summary-section {
    margin-bottom: 20px;
  }
  
  .section-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .section-content {
    padding: 16px;
  }
}
</style>