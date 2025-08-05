<template>
  <div 
    class="quick-function-card" 
    :style="{ '--card-color': color }"
    @click="handleClick"
  >
    <div class="card-content">
      <div class="icon-wrapper">
        <el-icon :size="32" :color="color">
          <component :is="icon" />
        </el-icon>
      </div>
      
      <div class="card-info">
        <h4 class="card-title">{{ title }}</h4>
        <div class="card-stats">
          <span class="count" v-if="count > 0">{{ count }}</span>
          <span class="count-label" v-if="count > 0">{{ getCountLabel() }}</span>
          <span class="empty-state" v-else>暂无内容</span>
        </div>
      </div>
      
      <div class="action-arrow">
        <el-icon :size="16" color="#c0c4cc">
          <ArrowRight />
        </el-icon>
      </div>
    </div>
    
    <div class="card-hover-effect"></div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { 
  ArrowRight,
  Document,
  Calendar,
  TrophyBase,
  Reading
} from '@element-plus/icons-vue'

interface Props {
  icon: string
  title: string
  count: number
  route: string
  color: string
}

const props = defineProps<Props>()
const router = useRouter()

function handleClick() {
  router.push(props.route)
}

function getCountLabel() {
  switch (props.title) {
    case '我的作业':
      return '待完成'
    case '我的课表':
      return '今日安排'
    case '我的成绩':
      return '总计'
    case '学习资源':
      return '可用资源'
    default:
      return '项目'
  }
}
</script>

<style scoped>
.quick-function-card {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #ebeef5;
  overflow: hidden;
  transition: all 0.3s ease;
}

.quick-function-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--card-color);
}

.quick-function-card:hover .card-hover-effect {
  opacity: 1;
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 2;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--card-color);
  border-radius: 12px;
  opacity: 0.9;
  transition: all 0.3s ease;
}

.quick-function-card:hover .icon-wrapper {
  opacity: 1;
  transform: scale(1.05);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  transition: color 0.3s ease;
}

.quick-function-card:hover .card-title {
  color: var(--card-color);
}

.card-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count {
  font-size: 20px;
  font-weight: bold;
  color: var(--card-color);
  line-height: 1;
}

.count-label {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-state {
  font-size: 12px;
  color: #c0c4cc;
  font-style: italic;
}

.action-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.quick-function-card:hover .action-arrow {
  opacity: 1;
  transform: translateX(4px);
}

.card-hover-effect {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(135deg, var(--card-color) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

/* 不同功能的特殊样式 */
.quick-function-card[style*="#409EFF"] .icon-wrapper {
  background: linear-gradient(135deg, #409EFF 0%, #79bbff 100%);
}

.quick-function-card[style*="#67C23A"] .icon-wrapper {
  background: linear-gradient(135deg, #67C23A 0%, #95d475 100%);
}

.quick-function-card[style*="#E6A23C"] .icon-wrapper {
  background: linear-gradient(135deg, #E6A23C 0%, #eebe77 100%);
}

.quick-function-card[style*="#F56C6C"] .icon-wrapper {
  background: linear-gradient(135deg, #F56C6C 0%, #f89898 100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quick-function-card {
    padding: 16px;
  }
  
  .card-content {
    gap: 12px;
  }
  
  .icon-wrapper {
    width: 48px;
    height: 48px;
  }
  
  .card-title {
    font-size: 14px;
  }
  
  .count {
    font-size: 18px;
  }
}
</style> 