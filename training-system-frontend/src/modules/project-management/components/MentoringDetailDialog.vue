<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" title="师徒关系详情" width="800px">
    <div v-if="mentoringPair" class="detail-content">
      <!-- 基本信息 -->
      <div class="basic-info">
        <div class="mentor-info">
          <el-avatar :size="60" :src="mentoringPair.mentor?.avatar">
            {{ mentoringPair.mentor?.name?.[0] }}
          </el-avatar>
          <div>
            <h3>{{ mentoringPair.mentor?.name }}</h3>
            <p>{{ mentoringPair.mentor?.title }}</p>
            <p>{{ mentoringPair.mentor?.department }}</p>
          </div>
        </div>
        
        <div class="relationship-arrow">
          <el-icon><ArrowRight /></el-icon>
          <span>师徒关系</span>
        </div>
        
        <div class="mentee-info">
          <el-avatar :size="60" :src="mentoringPair.mentee?.avatar">
            {{ mentoringPair.mentee?.name?.[0] }}
          </el-avatar>
          <div>
            <h3>{{ mentoringPair.mentee?.name }}</h3>
            <p>{{ mentoringPair.mentee?.title }}</p>
            <p>{{ mentoringPair.mentee?.department }}</p>
          </div>
        </div>
      </div>

      <!-- 关系详情 -->
      <div class="relationship-details">
        <el-descriptions title="关系信息" :column="2" border>
          <el-descriptions-item label="开始时间">{{ mentoringPair.startDate }}</el-descriptions-item>
          <el-descriptions-item label="计划周期">{{ mentoringPair.duration }}个月</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(mentoringPair.status)">
              {{ getStatusText(mentoringPair.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进度">{{ mentoringPair.progress }}%</el-descriptions-item>
          <el-descriptions-item label="沟通频率">每周{{ mentoringPair.communicationFrequency }}次</el-descriptions-item>
          <el-descriptions-item label="下次评估">{{ mentoringPair.nextEvaluation }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 最近活动 -->
      <div class="recent-activities">
        <h4>最近活动</h4>
        <el-timeline>
          <el-timeline-item
            v-for="activity in mentoringPair.recentActivities"
            :key="activity.id"
            :timestamp="formatTime(activity.time)"
          >
            {{ activity.content }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'

const props = defineProps<{
  visible: boolean
  mentoringPair: any
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const getStatusType = (status: string) => {
  const types = {
    active: 'success',
    paused: 'warning',
    completed: 'primary',
    terminated: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    active: '进行中',
    paused: '已暂停',
    completed: '已完成',
    terminated: '已终止'
  }
  return texts[status] || status
}

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString('zh-CN')
}
</script>

<style scoped>
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.basic-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.mentor-info,
.mentee-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.mentor-info h3,
.mentee-info h3 {
  margin: 0 0 4px 0;
  color: #333;
}

.mentor-info p,
.mentee-info p {
  margin: 2px 0;
  color: #666;
  font-size: 13px;
}

.relationship-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-size: 14px;
}

.recent-activities h4 {
  margin: 0 0 12px 0;
  color: #333;
}
</style> 