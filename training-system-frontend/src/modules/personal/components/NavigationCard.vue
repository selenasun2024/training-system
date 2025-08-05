<template>
  <div 
    class="navigation-card" 
    :style="{ '--card-color': color }"
    @click="handleClick"
  >
    <div class="card-header">
      <div class="icon-wrapper">
        <el-icon :size="24" :color="color">
          <component :is="icon" />
        </el-icon>
      </div>
      
      <div class="badge-wrapper" v-if="badge">
        <el-badge 
          :value="badge.count" 
          :type="badge.type" 
          :hidden="badge.count === 0"
        >
          <div class="badge-placeholder"></div>
        </el-badge>
      </div>
    </div>
    
    <div class="card-body">
      <h4 class="card-title">{{ title }}</h4>
      <p class="card-description">{{ description }}</p>
    </div>
    
    <div class="card-footer">
      <div class="smart-tag" v-if="isPersonalized">
        <el-icon :size="12">
          <Star />
        </el-icon>
        <span>智能推荐</span>
      </div>
      
      <div class="action-button">
        <el-button type="primary" size="small" :color="color">
          立即访问
        </el-button>
      </div>
    </div>
    
    <div class="card-background"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star } from '@element-plus/icons-vue'

interface Badge {
  count: number
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

interface Props {
  title: string
  description: string
  icon: string
  route: string
  badge?: Badge
  color: string
  priority?: number
}

const props = defineProps<Props>()
const router = useRouter()

// 判断是否为个性化推荐
const isPersonalized = computed(() => {
  return props.priority && props.priority > 0.7
})

function handleClick() {
  router.push(props.route)
}
</script>

<style scoped>
.navigation-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.navigation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border-color: var(--card-color);
}

.navigation-card:hover .card-background {
  opacity: 1;
  transform: scale(1.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
  z-index: 2;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--card-color);
  border-radius: 12px;
  opacity: 0.9;
  transition: all 0.3s ease;
}

.navigation-card:hover .icon-wrapper {
  opacity: 1;
  transform: rotate(5deg) scale(1.1);
}

.badge-wrapper {
  position: relative;
}

.badge-placeholder {
  width: 20px;
  height: 20px;
}

.card-body {
  flex: 1;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
}

.card-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.navigation-card:hover .card-title {
  color: var(--card-color);
}

.card-description {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.smart-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #b8860b;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
}

.action-button {
  transition: all 0.3s ease;
}

.navigation-card:hover .action-button {
  transform: translateX(4px);
}

.card-background {
  position: absolute;
  top: -20%;
  right: -20%;
  width: 120%;
  height: 120%;
  background: radial-gradient(
    circle at center,
    var(--card-color) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: all 0.6s ease;
  z-index: 1;
  transform: scale(0.8);
}

/* 不同颜色的特殊样式 */
.navigation-card[style*="#409EFF"] .icon-wrapper {
  background: linear-gradient(135deg, #409EFF 0%, #79bbff 100%);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.navigation-card[style*="#67C23A"] .icon-wrapper {
  background: linear-gradient(135deg, #67C23A 0%, #95d475 100%);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.navigation-card[style*="#E6A23C"] .icon-wrapper {
  background: linear-gradient(135deg, #E6A23C 0%, #eebe77 100%);
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
}

.navigation-card[style*="#F56C6C"] .icon-wrapper {
  background: linear-gradient(135deg, #F56C6C 0%, #f89898 100%);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

.navigation-card[style*="#909399"] .icon-wrapper {
  background: linear-gradient(135deg, #909399 0%, #b3b7c4 100%);
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navigation-card {
    padding: 20px;
    min-height: 180px;
  }
  
  .icon-wrapper {
    width: 40px;
    height: 40px;
  }
  
  .card-title {
    font-size: 16px;
  }
  
  .card-description {
    font-size: 13px;
    -webkit-line-clamp: 2;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .action-button {
    width: 100%;
  }
  
  .action-button .el-button {
    width: 100%;
  }
}

/* 动画效果 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 var(--card-color);
  }
  70% {
    box-shadow: 0 0 0 10px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

.navigation-card:hover .icon-wrapper {
  animation: pulse 2s infinite;
}
</style> 