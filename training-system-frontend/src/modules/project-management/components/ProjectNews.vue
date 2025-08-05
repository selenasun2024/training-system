<template>
  <div class="project-news">
    <div class="toolbar mb-2">
      <publish-status-tag :status="form.status" />
      <el-button size="small" @click="openAiDraft">AI 生成稿</el-button>
      <el-button size="small" @click="openTemplatePicker">选择模板</el-button>
      <el-button size="small" type="warning" @click="submitApproval" v-if="form.status==='draft'">提交审批</el-button>
      <el-button size="small" type="success" :disabled="form.status!=='draft' && form.status!=='approved'" @click="publish">发布</el-button>
      <stats-mini-card :read="stats.read" :share="stats.share" v-if="form.status==='published'" class="ml-3" />
    </div>

    <el-form :model="form" label-width="80px" class="news-form">
      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="请输入新闻标题" />
      </el-form-item>
      <el-form-item label="内容">
        <news-editor v-model="form.content" />
      </el-form-item>
    </el-form>

    <!-- Dialogs -->
    <ai-draft-dialog v-model="aiDialogVisible" @confirm="applyAiDraft" />
    <news-template-picker v-model="templateDialogVisible" @apply="applyTemplate" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import NewsEditor from './news/NewsEditor.vue'
import AiDraftDialog from './news/AiDraftDialog.vue'
import NewsTemplatePicker from './news/NewsTemplatePicker.vue'
import PublishStatusTag from './news/PublishStatusTag.vue'
import StatsMiniCard from './news/StatsMiniCard.vue'

interface NewsForm {
  title: string
  content: string
  status: 'draft' | 'pending' | 'approved' | 'published'
}

const form = reactive<NewsForm>({
  title: '',
  content: '',
  status: 'draft',
})

const stats = reactive({ read: 0, share: 0 })

// dialog visibility
const aiDialogVisible = ref(false)
const templateDialogVisible = ref(false)

function openAiDraft() {
  aiDialogVisible.value = true
}
function applyAiDraft(draftContent: string) {
  form.content = draftContent
  ElMessage.success('已插入 AI 生成稿')
}

function openTemplatePicker() {
  templateDialogVisible.value = true
}
function applyTemplate(templateHtml: string) {
  form.content = templateHtml
  ElMessage.success('已应用新闻模板')
}

function submitApproval() {
  form.status = 'pending'
  ElMessage.success('已提交审批（Mock）')
  // Mock: 3s 后自动审批通过
  setTimeout(()=>{
    form.status = 'approved'
    ElMessage.success('审批已通过（Mock）')
  },3000)
}

function saveDraft() {
  // TODO: 接 API 保存草稿
  console.log('news save draft', form)
  ElMessage.success('新闻草稿已保存（Mock）')
}

function publish() {
  if(form.status==='pending'){
    ElMessage.warning('审批中，无法发布')
    return
  }
  form.status = 'published'
  stats.read = Math.floor(Math.random()*100+10)
  stats.share = Math.floor(Math.random()*20)
  ElMessage.success('新闻已发布（Mock）')
}
</script>

<style scoped>
.project-news {
  padding: 16px;
}
.news-form {
  max-width: 800px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mb-2 { margin-bottom: 12px; }
.ml-3 { margin-left: 16px; }
</style> 