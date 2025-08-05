<template>
  <div class="relationship-details">
    <div class="detail-header">
      <h3>师徒关系详情</h3>
    </div>
    
    <div class="detail-content">
      <div class="person-info">
        <div class="student-section">
          <h4>学员信息</h4>
          <div class="person-card">
            <el-avatar :size="60">{{ student?.name?.charAt(0) }}</el-avatar>
            <div class="info">
              <div class="name">{{ student?.name }}</div>
              <div class="department">{{ student?.department }}</div>
            </div>
          </div>
        </div>
        
        <div class="mentor-section">
          <h4>导师信息</h4>
          <div class="person-card">
            <el-avatar :size="60">{{ mentor?.name?.charAt(0) }}</el-avatar>
            <div class="info">
              <div class="name">{{ mentor?.name }}</div>
              <div class="department">{{ mentor?.department }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="relationship-info">
        <h4>关系信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">建立时间：</span>
            <span class="value">{{ formatDate(relationship?.establishedDate) }}</span>
          </div>
          <div class="info-item">
            <span class="label">关系状态：</span>
            <el-tag :type="getStatusType(relationship?.status)" size="small">
              {{ getStatusText(relationship?.status) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">匹配方式：</span>
            <span class="value">{{ relationship?.matchingType }}</span>
          </div>
          <div class="info-item" v-if="relationship?.matchingScore">
            <span class="label">匹配评分：</span>
            <span class="value">{{ relationship?.matchingScore }}分</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="dialog-footer">
      <el-button @click="$emit('close')">关闭</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/dateUtils'

interface Props {
  relationship: any
  mentor: any
  student: any
}

defineProps<Props>()

defineEmits<{
  close: []
}>()

// 状态处理函数 - 与列表保持一致
const getStatusText = (status: string) => {
  // 简化状态：只有未出师和已出师
  if (status === 'graduated') {
    return '已出师'
  }
  return '未出师'  // 所有其他状态都显示为未出师
}

const getStatusType = (status: string) => {
  // 简化状态类型：只有两种颜色
  if (status === 'graduated') {
    return 'success'  // 已出师 - 绿色
  }
  return 'warning'    // 未出师 - 橙色
}
</script>

<style scoped>
.relationship-details {
  padding: 20px;
}

.detail-header h3 {
  margin: 0 0 20px 0;
  color: #303133;
}

.person-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.person-section h4,
.relationship-info h4 {
  margin: 0 0 16px 0;
  color: #606266;
  font-size: 16px;
}

.person-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.person-card .info {
  flex: 1;
}

.person-card .name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.person-card .department {
  color: #606266;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  width: 100px;
  flex-shrink: 0;
}

.info-item .value {
  color: #303133;
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 30px;
}
</style> 