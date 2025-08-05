<template>
  <div class="group-editor-page">
    <!-- Toolbar -->
    <div class="toolbar">
      <el-button size="small" type="primary" @click="save">保存</el-button>
      <el-button size="small" @click="back">返回</el-button>
    </div>

    <div class="body">
      <!-- Group Type Sidebar -->
      <el-menu class="group-type-sidebar" :default-active="groupType" @select="groupType=$event">
        <el-menu-item v-for="t in groupTypes" :key="t.key" :index="t.key">{{ t.label }}</el-menu-item>
        <el-menu-item index="add" disabled>
          <span style="color:#409EFF">➕ 新增群类型</span>
        </el-menu-item>
      </el-menu>

      <!-- Stage & Message Tree -->
      <div class="stage-tree-column">
        <el-tree :data="treeData" node-key="key" :default-expand-all="true" :highlight-current="true" :current-node-key="stageKey" @node-click="onStageClick" />
      </div>

      <!-- Detail Editor -->
      <div class="edit-column">
        <el-form label-position="top" label-width="100px">
          <el-form-item label="群名称格式">
            <el-input v-model="detail.nameFormat" placeholder="{培训项目}+{群类型}" />
          </el-form-item>
          <el-form-item label="群公告">
            <el-input type="textarea" :rows="3" v-model="detail.announcement" />
          </el-form-item>
          <el-form-item label="群规则">
            <el-input type="textarea" :rows="3" v-model="detail.rules" />
          </el-form-item>
          <el-form-item label="群介绍">
            <el-input type="textarea" :rows="3" v-model="detail.description" />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

/* ------------ 数据 ------------- */

const treeData=[
  { label:'培训前', key:'pre', children:[
    { label:'组群通知', key:'pre.group'},
    { label:'准备通知', key:'pre.prepare'}
  ]},
  { label:'培训中', key:'mid', children:[
    { label:'作业下发通知', key:'mid.task'},
    { label:'成绩发布通知', key:'mid.score'},
    { label:'活动通知', key:'mid.activity'},
    { label:'进度提醒', key:'mid.progress'},
  ]},
  { label:'培训后', key:'post', children:[
    { label:'总结通知', key:'post.summary'},
    { label:'推荐通知', key:'post.recommend'},
    { label:'结营通知', key:'post.finish'},
  ]},
]

function onStageClick(node:any){ stageKey.value=node.key }

/* ------------ 主组件逻辑 ------------- */
const router = useRouter()

const groupTypes=[
  { key:'studentGroup', label:'小组学员群' },
  { key:'allStudent', label:'学员大群' },
  { key:'staffGroup', label:'工作人员群' },
  { key:'tutorGroup', label:'辅导员群' },
]

const groupType = ref('studentGroup')
const stageKey = ref('pre.group')

const detail = reactive({
  nameFormat:'{培训项目}+{群类型}',
  announcement:'',
  rules:'',
  description:''
})

function save(){ ElMessage.success('已保存（Mock）') }
function back(){ router.back() }
</script>

<style scoped>
.group-editor-page{ padding:16px; }
.toolbar{ display:flex; gap:8px; margin-bottom:8px; }
.body{ display:flex; gap:16px; }

/* 左侧群类型栏 */
.group-type-sidebar{ width:180px; background:#fafafa; border-right:1px solid #ebeef5; min-height:calc(100vh - 120px); box-sizing:border-box; }

/* 中间树 */
.stage-tree-column{ width:220px; background:#fafafa; border-right:1px solid #ebeef5; padding:8px 12px; border-radius:4px; overflow:auto; }

/* 编辑区 */
.edit-column{ flex:1; padding-left:16px; }
</style> 