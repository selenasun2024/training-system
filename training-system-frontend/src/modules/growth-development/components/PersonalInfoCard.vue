<template>
  <div class="personal-info-card">
    <div class="card-header">
      <div class="avatar-section">
        <el-avatar :size="80" :src="userInfo.avatar" class="user-avatar">
          <el-icon><User /></el-icon>
        </el-avatar>
      </div>
      <div class="info-section">
        <h3 class="user-name">{{ userInfo.name }}</h3>
        <div class="user-details">
          <div class="detail-item">
            <span class="label">工号：</span>
            <span class="value">{{ userInfo.employeeId }}</span>
          </div>
          <div class="detail-item">
            <span class="label">职位：</span>
            <span class="value">{{ userInfo.position }}</span>
          </div>
          <div class="detail-item">
            <span class="label">部门：</span>
            <span class="value">{{ userInfo.department }}</span>
          </div>
          <div class="detail-item">
            <span class="label">入职时间：</span>
            <span class="value">{{ formatDate(userInfo.joinDate) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <div class="stat-item">
        <div class="stat-value">{{ userInfo.completedTrainings }}</div>
        <div class="stat-label">完成培训</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ userInfo.menteeCount }}</div>
        <div class="stat-label">带教学员</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ userInfo.activeGoals }}</div>
        <div class="stat-label">成长目标</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { User } from '@element-plus/icons-vue'

// 模拟用户数据
const userInfo = ref({
  name: '张三',
  employeeId: 'E001234',
  position: '高级软件工程师',
  department: '技术研发部',
  joinDate: new Date('2020-03-15'),
  avatar: '',
  completedTrainings: 25,
  menteeCount: 3,
  activeGoals: 5
})

// 格式化日期
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 计算工作年限
const workYears = computed(() => {
  const now = new Date()
  const joinDate = userInfo.value.joinDate
  const years = now.getFullYear() - joinDate.getFullYear()
  const months = now.getMonth() - joinDate.getMonth()
  
  if (months < 0) {
    return `${years - 1}年${12 + months}个月`
  } else {
    return `${years}年${months}个月`
  }
})
</script>

<style scoped>
.personal-info-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.card-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.avatar-section {
  flex-shrink: 0;
}

.user-avatar {
  border: 3px solid #f0f2f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-section {
  flex: 1;
}

.user-name {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.user-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.detail-item {
  display: flex;
  font-size: 14px;
}

.label {
  color: #909399;
  width: 80px;
  flex-shrink: 0;
}

.value {
  color: #303133;
  font-weight: 500;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .user-details {
    grid-template-columns: 1fr;
  }
  
  .stats-section {
    flex-direction: column;
    gap: 16px;
  }
}
</style> 