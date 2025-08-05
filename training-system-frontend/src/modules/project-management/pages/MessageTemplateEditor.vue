<template>
  <div class="msg-editor-page">
    <!-- Toolbar -->
    <div class="toolbar">
      <el-button size="small" type="primary" @click="save">保存</el-button>
      <el-button size="small" @click="back">返回</el-button>
    </div>

    <div class="body">
      <!-- Stage Tree -->
      <div class="stage-tree-column">
        <stage-tree :model-value="stage" @update:modelValue="stage=$event" />
      </div>

      <!-- Editor -->
      <div class="edit-column">
        <el-input v-model="title" placeholder="消息标题" class="mb-2" />
        <message-editor v-model="content" />
      </div>

      <!-- Preview Column -->
      <div class="preview-column">
        <div class="style-select">
          <span>话术风格：</span>
          <el-radio-group v-model="style" size="small">
            <el-radio label="friendly">亲切</el-radio>
            <el-radio label="formal">正式</el-radio>
            <el-radio label="concise">简洁</el-radio>
          </el-radio-group>
          <el-button size="small" @click="openVarPicker" class="ml-1">{ } 变量</el-button>
        </div>
        <phone-preview :style-type="style" :title="title" :content="content" />
      </div>
    </div>

    <!-- Variable Picker Dialog -->
    <variable-picker v-model="varPickerVisible" @insert="insertVar" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import StageTree from '../components/template/message/StageTree.vue'
import MessageEditor from '../components/template/message/MessageEditor.vue'
import PhonePreview from '../components/template/message/PhonePreview.vue'
import VariablePicker from '../components/template/message/VariablePicker.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const stage = ref('pre.opening')
const style = ref<'friendly'|'formal'|'concise'>('friendly')
const title = ref('')
const content = ref('')

const varPickerVisible = ref(false)
function openVarPicker(){ varPickerVisible.value=true }
function insertVar(v:string){ content.value += `{{${v}}}` }
function save(){ ElMessage.success('已保存（Mock）') }
function back(){ router.back() }
</script>

<style scoped>
.msg-editor-page { padding:16px; }
.toolbar { display:flex; gap:8px; margin-bottom:8px; }
.body { display:flex; gap:16px; }

/* 左侧环节树列 */
.stage-tree-column{
  width:220px;
  background:#fafafa;
  border-right:1px solid #ebeef5;
  padding:8px 12px;
  overflow:auto;
  border-radius:4px;
}

/* 中间编辑列 */
.edit-column { flex:1; display:flex; flex-direction:column; gap:12px; }
.mb-2{ margin-bottom:8px; }

/* 右侧预览列 */
.preview-column { width: 280px; border-left:1px solid #ebeef5; padding-left:16px; }

.style-select{ margin-bottom:8px; font-size:14px; display:flex; align-items:center; gap:8px; }
.ml-1{ margin-left:4px; }
</style> 