<template>
  <div class="tree-node-wrapper">
    <div class="tree-node" @click="handleNodeClick">
      <div class="node-content" :class="{ 'key-position': node.isKey, 'high-risk': showRiskOverlay && node.riskLevel === 'high' }">
        <div class="node-avatar">
          <el-avatar :size="getAvatarSize()" :src="node.avatar">
            {{ node.name }}
          </el-avatar>
          
          <!-- 风险指示器 -->
          <div v-if="showRiskOverlay && node.riskLevel === 'high'" class="risk-indicator">
            <el-icon><Warning /></el-icon>
          </div>
        </div>
        
        <div class="node-info">
          <div class="node-name">{{ node.name }}</div>
          <div class="node-title">{{ node.title }}</div>
          <div class="node-department">{{ node.department }}</div>
        </div>
        
        <div class="node-indicators">
          <el-tag v-if="node.isKey" type="danger" size="small">关键</el-tag>
          <el-tag :type="getRiskTagType(node.riskLevel)" size="small">
            {{ getRiskLevelText(node.riskLevel) }}
          </el-tag>
          <div v-if="node.directReports" class="reports-count">
            {{ node.directReports }} 人
          </div>
        </div>
      </div>
    </div>
    
    <!-- 子节点 -->
    <div class="tree-children" v-if="node.children && node.children.length > 0">
      <div class="children-connector"></div>
      <div class="children-container">
        <div 
          v-for="child in node.children" 
          :key="child.id"
          class="child-branch"
        >
          <div class="branch-connector"></div>
          <TreeNode 
            :node="child" 
            :level="level + 1"
            :show-risk-overlay="showRiskOverlay"
            @node-select="handleChildNodeSelect"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Warning } from '@element-plus/icons-vue'

interface Employee {
  id: string
  name: string
  title: string
  department: string
  avatar?: string
  isKey?: boolean
  riskLevel: 'high' | 'medium' | 'low'
  directReports?: number
  successors?: any[]
  children?: Employee[]
}

interface Props {
  node: Employee
  level: number
  showRiskOverlay?: boolean
}

interface Emits {
  (e: 'node-select', node: Employee): void
}

const props = withDefaults(defineProps<Props>(), {
  showRiskOverlay: false
})

const emit = defineEmits<Emits>()

const handleNodeClick = () => {
  emit('node-select', props.node)
}

const handleChildNodeSelect = (node: Employee) => {
  emit('node-select', node)
}

const getAvatarSize = () => {
  return Math.max(32, 50 - props.level * 6)
}

const getRiskTagType = (risk: string) => {
  const types = { 'high': 'danger', 'medium': 'warning', 'low': 'success' }
  return types[risk] || 'info'
}

const getRiskLevelText = (risk: string) => {
  const texts = { 'high': '高风险', 'medium': '中风险', 'low': '低风险' }
  return texts[risk] || '未知'
}
</script>

<style scoped>
.tree-node-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 10px;
}

.tree-node {
  position: relative;
  margin-bottom: 20px;
  z-index: 1;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  min-width: 220px;
}

.node-content:hover {
  border-color: #409EFF;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

.node-content.key-position {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  border-color: #ff6b6b;
}

.node-content.high-risk {
  animation: risk-pulse 2s infinite;
}

@keyframes risk-pulse {
  0% { 
    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.4);
  }
  70% { 
    box-shadow: 0 0 0 10px rgba(255, 71, 87, 0);
  }
  100% { 
    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0);
  }
}

.node-avatar {
  position: relative;
  flex-shrink: 0;
}

.risk-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  background: #ff4757;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  z-index: 2;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-department {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-indicators {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  flex-shrink: 0;
}

.reports-count {
  font-size: 11px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 10px;
}

.tree-children {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.children-connector {
  width: 2px;
  height: 30px;
  background: #ddd;
  margin-bottom: 10px;
}

.children-container {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.child-branch {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.branch-connector {
  width: 2px;
  height: 20px;
  background: #ddd;
  margin-bottom: 10px;
}

/* 连接线样式 */
.children-container::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  height: 2px;
  background: #ddd;
}

.child-branch::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 30px;
  background: #ddd;
}

.child-branch:first-child::before {
  border-top-left-radius: 8px;
}

.child-branch:last-child::before {
  border-top-right-radius: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .node-content {
    min-width: 180px;
    padding: 8px 12px;
  }
  
  .children-container {
    flex-direction: column;
    gap: 20px;
  }
  
  .children-container::before {
    display: none;
  }
  
  .child-branch::before {
    display: none;
  }
}
</style> 