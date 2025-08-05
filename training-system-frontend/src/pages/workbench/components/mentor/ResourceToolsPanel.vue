<template>
  <div class="resource-tools-panel">
    <el-tabs v-model="activeTab" class="tools-tabs">
      <!-- 带教材料 -->
      <el-tab-pane label="带教材料" name="materials">
        <template #label>
          <div class="tab-label">
            <el-icon><Document /></el-icon>
            <span>带教材料</span>
          </div>
        </template>
        
        <div class="materials-section">
          <div class="section-header">
            <h3>带教材料库</h3>
            <el-button type="primary" @click="showUploadDialog = true">
              <el-icon><Upload /></el-icon>
              上传材料
            </el-button>
          </div>
          
          <div class="materials-filters">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-select v-model="materialFilter.category" placeholder="材料分类" clearable>
                  <el-option label="全部分类" value="" />
                  <el-option label="培训文档" value="training-docs" />
                  <el-option label="指导手册" value="guidance" />
                  <el-option label="案例分析" value="case-study" />
                  <el-option label="课件资料" value="courseware" />
                  <el-option label="视频资源" value="video" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="materialFilter.level" placeholder="适用层级" clearable>
                  <el-option label="全部层级" value="" />
                  <el-option label="新员工" value="junior" />
                  <el-option label="中级员工" value="intermediate" />
                  <el-option label="高级员工" value="senior" />
                </el-select>
              </el-col>
              <el-col :span="12">
                <el-input v-model="materialFilter.search" placeholder="搜索材料" clearable>
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-col>
            </el-row>
          </div>
          
          <div class="materials-grid">
            <div 
              v-for="material in filteredMaterials" 
              :key="material.id"
              class="material-card"
            >
              <div class="material-preview">
                <div class="file-icon">
                  <el-icon :size="40" :color="getFileIconColor(material.type)">
                    <component :is="getFileIcon(material.type)" />
                  </el-icon>
                </div>
                <div class="material-tags">
                  <el-tag size="small" :type="getCategoryType(material.category)">
                    {{ getCategoryLabel(material.category) }}
                  </el-tag>
                </div>
              </div>
              
              <div class="material-info">
                <h4 class="material-title">{{ material.title }}</h4>
                <p class="material-description">{{ material.description }}</p>
                <div class="material-meta">
                  <span class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(material.uploadedAt) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Download /></el-icon>
                    {{ material.downloadCount }}次
                  </span>
                  <span class="meta-item">
                    <el-icon><View /></el-icon>
                    {{ material.viewCount }}次
                  </span>
                </div>
              </div>
              
              <div class="material-actions">
                <el-button size="small" @click="previewMaterial(material.id)">预览</el-button>
                <el-button size="small" type="primary" @click="downloadMaterial(material.id)">下载</el-button>
                <el-button size="small" @click="shareMaterial(material.id)">分享</el-button>
              </div>
            </div>
          </div>
          
          <el-empty v-if="filteredMaterials.length === 0" description="暂无匹配的材料" />
        </div>
      </el-tab-pane>

      <!-- 模板工具 -->
      <el-tab-pane label="模板工具" name="templates">
        <template #label>
          <div class="tab-label">
            <el-icon><Grid /></el-icon>
            <span>模板工具</span>
          </div>
        </template>
        
        <div class="templates-section">
          <div class="section-header">
            <h3>常用模板</h3>
            <el-button type="primary" @click="showCreateTemplateDialog = true">
              <el-icon><Plus /></el-icon>
              创建模板
            </el-button>
          </div>
          
          <div class="templates-categories">
            <el-row :gutter="20">
              <el-col :span="8" v-for="category in templateCategories" :key="category.key">
                <div class="category-card">
                  <div class="category-header">
                    <div class="category-icon">
                      <el-icon :size="24" :color="category.color">
                        <component :is="category.icon" />
                      </el-icon>
                    </div>
                    <h4>{{ category.title }}</h4>
                  </div>
                  
                  <div class="templates-list">
                    <div 
                      v-for="template in category.templates" 
                      :key="template.id"
                      class="template-item"
                      @click="useTemplate(template.id)"
                    >
                      <div class="template-info">
                        <span class="template-name">{{ template.name }}</span>
                        <span class="template-usage">使用{{ template.usageCount }}次</span>
                      </div>
                      <el-icon class="template-arrow"><ArrowRight /></el-icon>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-tab-pane>

      <!-- 经验分享 -->
      <el-tab-pane label="经验分享" name="experience">
        <template #label>
          <div class="tab-label">
            <el-icon><ChatDotRound /></el-icon>
            <span>经验分享</span>
          </div>
        </template>
        
        <div class="experience-section">
          <div class="section-header">
            <h3>带教经验分享</h3>
            <el-button type="primary" @click="showShareDialog = true">
              <el-icon><Edit /></el-icon>
              分享经验
            </el-button>
          </div>
          
          <div class="experience-filters">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-select v-model="experienceFilter.topic" placeholder="主题分类" clearable>
                  <el-option label="全部主题" value="" />
                  <el-option label="新人引导" value="onboarding" />
                  <el-option label="技能培养" value="skill-development" />
                  <el-option label="沟通技巧" value="communication" />
                  <el-option label="问题解决" value="problem-solving" />
                  <el-option label="职业发展" value="career-development" />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-select v-model="experienceFilter.sort" placeholder="排序方式">
                  <el-option label="最新发布" value="latest" />
                  <el-option label="最多点赞" value="most-liked" />
                  <el-option label="最多收藏" value="most-saved" />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-input v-model="experienceFilter.search" placeholder="搜索经验" clearable>
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-col>
            </el-row>
          </div>
          
          <div class="experience-list">
            <div 
              v-for="experience in filteredExperiences" 
              :key="experience.id"
              class="experience-card"
            >
              <div class="experience-header">
                <div class="author-info">
                  <el-avatar :size="40" :src="experience.author.avatar" />
                  <div class="author-details">
                    <h4 class="author-name">{{ experience.author.name }}</h4>
                    <span class="author-title">{{ experience.author.title }}</span>
                  </div>
                </div>
                <div class="experience-meta">
                  <el-tag size="small" :type="getTopicType(experience.topic)">
                    {{ getTopicLabel(experience.topic) }}
                  </el-tag>
                  <span class="publish-time">{{ formatDate(experience.publishedAt) }}</span>
                </div>
              </div>
              
              <div class="experience-content">
                <h3 class="experience-title">{{ experience.title }}</h3>
                <p class="experience-summary">{{ experience.summary }}</p>
                
                <div class="experience-highlights" v-if="experience.highlights">
                  <div class="highlight-item" v-for="highlight in experience.highlights" :key="highlight">
                    <el-icon><Check /></el-icon>
                    <span>{{ highlight }}</span>
                  </div>
                </div>
              </div>
              
              <div class="experience-footer">
                <div class="experience-stats">
                  <span class="stat-item">
                    <el-icon><View /></el-icon>
                    {{ experience.viewCount }}阅读
                  </span>
                  <span class="stat-item">
                    <el-icon><Star /></el-icon>
                    {{ experience.likeCount }}点赞
                  </span>
                  <span class="stat-item">
                    <el-icon><Collection /></el-icon>
                    {{ experience.saveCount }}收藏
                  </span>
                </div>
                
                <div class="experience-actions">
                  <el-button size="small" @click="readExperience(experience.id)">阅读全文</el-button>
                  <el-button 
                    size="small" 
                    :type="experience.isLiked ? 'primary' : 'default'"
                    @click="toggleLike(experience.id)"
                  >
                    <el-icon><Star /></el-icon>
                    {{ experience.isLiked ? '已点赞' : '点赞' }}
                  </el-button>
                  <el-button 
                    size="small"
                    :type="experience.isSaved ? 'warning' : 'default'"
                    @click="toggleSave(experience.id)"
                  >
                    <el-icon><Collection /></el-icon>
                    {{ experience.isSaved ? '已收藏' : '收藏' }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          
          <el-empty v-if="filteredExperiences.length === 0" description="暂无经验分享" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 上传材料对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传带教材料" width="500px">
      <!-- 上传表单 -->
      <div>上传材料表单 - 待完善</div>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary">确定上传</el-button>
      </template>
    </el-dialog>

    <!-- 创建模板对话框 -->
    <el-dialog v-model="showCreateTemplateDialog" title="创建模板" width="600px">
      <!-- 模板创建表单 -->
      <div>模板创建表单 - 待完善</div>
      <template #footer>
        <el-button @click="showCreateTemplateDialog = false">取消</el-button>
        <el-button type="primary">创建模板</el-button>
      </template>
    </el-dialog>

    <!-- 分享经验对话框 -->
    <el-dialog v-model="showShareDialog" title="分享带教经验" width="700px">
      <!-- 经验分享表单 -->
      <div>经验分享表单 - 待完善</div>
      <template #footer>
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button type="primary">发布分享</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Document, 
  Grid, 
  ChatDotRound, 
  Upload, 
  Plus, 
  Search, 
  Calendar,
  Download,
  View,
  ArrowRight,
  Edit,
  Check,
  Star,
  Collection
} from '@element-plus/icons-vue'

// 响应式数据
const activeTab = ref('materials')
const showUploadDialog = ref(false)
const showCreateTemplateDialog = ref(false)
const showShareDialog = ref(false)

const materialFilter = ref({
  category: '',
  level: '',
  search: ''
})

const experienceFilter = ref({
  topic: '',
  sort: 'latest',
  search: ''
})

// 模拟数据
const materials = ref([
  {
    id: '1',
    title: '新员工入职引导手册',
    description: '详细的新员工入职流程和注意事项',
    category: 'guidance',
    level: 'junior',
    type: 'pdf',
    uploadedAt: '2024-01-15',
    downloadCount: 45,
    viewCount: 128
  },
  {
    id: '2',
    title: '技能评估模板',
    description: '用于定期评估学员技能发展的模板',
    category: 'training-docs',
    level: 'intermediate',
    type: 'excel',
    uploadedAt: '2024-01-10',
    downloadCount: 32,
    viewCount: 89
  }
])

const templateCategories = ref([
  {
    key: 'evaluation',
    title: '评价模板',
    icon: 'Star',
    color: '#409EFF',
    templates: [
      { id: '1', name: '月度评价表', usageCount: 15 },
      { id: '2', name: '技能考核表', usageCount: 23 },
      { id: '3', name: '综合评估表', usageCount: 8 }
    ]
  },
  {
    key: 'plan',
    title: '计划模板',
    icon: 'Calendar',
    color: '#67C23A',
    templates: [
      { id: '4', name: '带教计划模板', usageCount: 35 },
      { id: '5', name: '学习计划模板', usageCount: 28 },
      { id: '6', name: '项目计划模板', usageCount: 19 }
    ]
  },
  {
    key: 'communication',
    title: '沟通模板',
    icon: 'ChatDotRound',
    color: '#E6A23C',
    templates: [
      { id: '7', name: '沟通记录表', usageCount: 42 },
      { id: '8', name: '反馈表模板', usageCount: 31 },
      { id: '9', name: '问题跟踪表', usageCount: 25 }
    ]
  }
])

const experiences = ref([
  {
    id: '1',
    title: '如何帮助新员工快速融入团队',
    summary: '分享我在带教新员工时发现的有效方法，包括破冰活动、mentor配对、定期check-in等实用技巧...',
    topic: 'onboarding',
    author: {
      name: '张导师',
      title: '高级工程师 | 资深导师',
      avatar: '/avatar1.jpg'
    },
    publishedAt: '2024-01-20',
    viewCount: 156,
    likeCount: 24,
    saveCount: 18,
    isLiked: false,
    isSaved: true,
    highlights: [
      '建立轻松的沟通氛围',
      '制定明确的学习目标',
      '定期反馈和调整'
    ]
  },
  {
    id: '2',
    title: '技术人员软技能培养心得',
    summary: '技术人员往往专注于硬技能，但软技能同样重要。分享我在培养学员沟通能力、团队协作等方面的经验...',
    topic: 'skill-development',
    author: {
      name: '李老师',
      title: '项目经理 | 认证导师',
      avatar: '/avatar2.jpg'
    },
    publishedAt: '2024-01-18',
    viewCount: 203,
    likeCount: 31,
    saveCount: 27,
    isLiked: true,
    isSaved: false,
    highlights: [
      '通过项目实践培养沟通能力',
      '创造展示机会',
      '鼓励主动分享和提问'
    ]
  }
])

// 计算属性
const filteredMaterials = computed(() => {
  let filtered = materials.value
  
  if (materialFilter.value.category) {
    filtered = filtered.filter(m => m.category === materialFilter.value.category)
  }
  
  if (materialFilter.value.level) {
    filtered = filtered.filter(m => m.level === materialFilter.value.level)
  }
  
  if (materialFilter.value.search) {
    const search = materialFilter.value.search.toLowerCase()
    filtered = filtered.filter(m => 
      m.title.toLowerCase().includes(search) ||
      m.description.toLowerCase().includes(search)
    )
  }
  
  return filtered
})

const filteredExperiences = computed(() => {
  let filtered = experiences.value
  
  if (experienceFilter.value.topic) {
    filtered = filtered.filter(e => e.topic === experienceFilter.value.topic)
  }
  
  if (experienceFilter.value.search) {
    const search = experienceFilter.value.search.toLowerCase()
    filtered = filtered.filter(e => 
      e.title.toLowerCase().includes(search) ||
      e.summary.toLowerCase().includes(search)
    )
  }
  
  // 排序
  if (experienceFilter.value.sort === 'most-liked') {
    filtered = filtered.sort((a, b) => b.likeCount - a.likeCount)
  } else if (experienceFilter.value.sort === 'most-saved') {
    filtered = filtered.sort((a, b) => b.saveCount - a.saveCount)
  } else {
    filtered = filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  }
  
  return filtered
})

// 方法
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function getFileIcon(type: string): string {
  const icons = {
    pdf: 'Document',
    excel: 'Grid',
    word: 'Document',
    ppt: 'Grid',
    video: 'VideoPlay',
    image: 'Picture'
  }
  return icons[type] || 'Document'
}

function getFileIconColor(type: string): string {
  const colors = {
    pdf: '#f56c6c',
    excel: '#67c23a',
    word: '#409eff',
    ppt: '#e6a23c',
    video: '#909399',
    image: '#f56c6c'
  }
  return colors[type] || '#909399'
}

function getCategoryType(category: string): string {
  const types = {
    'training-docs': 'primary',
    'guidance': 'success',
    'case-study': 'warning',
    'courseware': 'info',
    'video': 'danger'
  }
  return types[category] || 'info'
}

function getCategoryLabel(category: string): string {
  const labels = {
    'training-docs': '培训文档',
    'guidance': '指导手册',
    'case-study': '案例分析',
    'courseware': '课件资料',
    'video': '视频资源'
  }
  return labels[category] || category
}

function getTopicType(topic: string): string {
  const types = {
    'onboarding': 'primary',
    'skill-development': 'success',
    'communication': 'warning',
    'problem-solving': 'danger',
    'career-development': 'info'
  }
  return types[topic] || 'info'
}

function getTopicLabel(topic: string): string {
  const labels = {
    'onboarding': '新人引导',
    'skill-development': '技能培养',
    'communication': '沟通技巧',
    'problem-solving': '问题解决',
    'career-development': '职业发展'
  }
  return labels[topic] || topic
}

// 事件处理
function previewMaterial(materialId: string) {
  console.log('预览材料:', materialId)
}

function downloadMaterial(materialId: string) {
  console.log('下载材料:', materialId)
}

function shareMaterial(materialId: string) {
  console.log('分享材料:', materialId)
}

function useTemplate(templateId: string) {
  console.log('使用模板:', templateId)
}

function readExperience(experienceId: string) {
  console.log('阅读经验:', experienceId)
}

function toggleLike(experienceId: string) {
  const experience = experiences.value.find(e => e.id === experienceId)
  if (experience) {
    experience.isLiked = !experience.isLiked
    experience.likeCount += experience.isLiked ? 1 : -1
  }
}

function toggleSave(experienceId: string) {
  const experience = experiences.value.find(e => e.id === experienceId)
  if (experience) {
    experience.isSaved = !experience.isSaved
    experience.saveCount += experience.isSaved ? 1 : -1
  }
}
</script>

<style scoped>
.resource-tools-panel {
  height: 100%;
  padding: 20px;
}

.tools-tabs {
  height: 100%;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* 材料管理样式 */
.materials-filters {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.material-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #ebeef5;
  transition: box-shadow 0.3s ease;
}

.material-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.material-preview {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.file-icon {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.material-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.material-description {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.material-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.material-actions {
  display: flex;
  gap: 8px;
}

/* 模板工具样式 */
.templates-categories {
  margin-top: 20px;
}

.category-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #ebeef5;
  height: 100%;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.category-icon {
  padding: 8px;
  background: #f5f7fa;
  border-radius: 6px;
}

.category-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f7fa;
  cursor: pointer;
  transition: background 0.3s ease;
}

.template-item:hover {
  background: #f5f7fa;
  border-radius: 6px;
  padding-left: 8px;
  padding-right: 8px;
}

.template-item:last-child {
  border-bottom: none;
}

.template-name {
  font-weight: 500;
  color: #303133;
  display: block;
}

.template-usage {
  font-size: 12px;
  color: #909399;
}

.template-arrow {
  color: #c0c4cc;
}

/* 经验分享样式 */
.experience-filters {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.experience-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.experience-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.experience-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.author-title {
  font-size: 12px;
  color: #909399;
}

.experience-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.publish-time {
  font-size: 12px;
  color: #909399;
}

.experience-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.experience-summary {
  margin: 0 0 16px 0;
  color: #606266;
  line-height: 1.6;
}

.experience-highlights {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.highlight-item:last-child {
  margin-bottom: 0;
}

.experience-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.experience-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.experience-actions {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .resource-tools-panel {
    padding: 16px;
  }
  
  .materials-grid {
    grid-template-columns: 1fr;
  }
  
  .templates-categories .el-row {
    flex-direction: column;
  }
  
  .experience-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .experience-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .experience-stats {
    justify-content: center;
  }
}
</style> 