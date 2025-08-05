<template>
  <div>
    <el-card v-if="task" shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>{{ task.title }}</span>
          <div>
            <span style="margin-right: 16px; color: #666; font-size: 14px;">
              待批阅：{{ task.submissions.length }} 份
            </span>
            <el-button size="small" @click="goBack">返回</el-button>
          </div>
        </div>
      </template>
      <el-table :data="task.submissions" style="width:100%">
        <el-table-column prop="userName" label="学员" />
        <el-table-column prop="content" label="提交内容" />
        <el-table-column label="批阅" width="200">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-input-number 
                v-model="row.score" 
                :min="0" 
                :max="100" 
                size="small"
                style="width: 100px;"
              />
              <el-button 
                type="primary" 
                size="small" 
                @click="saveScore(row)"
                :loading="row.grading"
              >
                保存
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card v-else shadow="never">
      <el-empty description="任务不存在或已被移除" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useCounselorTaskStore } from "../../../stores/counselorTasks"
import { useRoute, useRouter } from 'vue-router'
import { onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

const store = useCounselorTaskStore()
const route = useRoute()
const router = useRouter()

const taskId = route.params.taskId as string

onMounted(async ()=>{
  if(store.tasks.length===0){
    await store.fetchTasks()
  }
})

const task = computed(()=> store.tasks.find(t=>t.id===taskId))

function goBack(){
  router.back()
}

async function saveScore(sub:any){
  if(sub.score===undefined || sub.score === null){ 
    ElMessage.warning('请输入分数')
    return 
  }
  
  // 防止重复提交
  if (sub.grading) return
  sub.grading = true
  
  try {
    console.log('🔍 准备保存评分:', sub.userName, sub.score)
    
    // 调用store的批阅方法
    const result = await store.grade(taskId, sub.userId, sub.score)
    
    // 根据批阅结果决定后续操作
    if (result && result.remainingSubmissions === 0) {
      // 如果该任务的所有提交都已批阅完成，自动返回任务列表
      console.log('🎉 该任务所有提交已批阅完成，自动返回')
      setTimeout(() => {
        goBack()
      }, 1500) // 给用户时间看到成功消息
    }
    
  } catch (error) {
    console.error('❌ 保存评分失败:', error)
  } finally {
    sub.grading = false
  }
}
</script> 