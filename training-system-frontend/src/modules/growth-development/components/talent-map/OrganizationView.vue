<template>
  <div class="organization-view">
    <div class="organization-header">
      <div class="header-info">
        <h3>组织架构图</h3>
        <span class="employee-count">{{ filteredEmployees.length }} 人</span>
      </div>
      <div class="header-actions">
        <el-button-group>
          <el-button 
            :type="viewMode === 'tree' ? 'primary' : 'default'"
            @click="viewMode = 'tree'"
            size="small"
          >
            <el-icon><List /></el-icon>
            树形图
          </el-button>
          <el-button 
            :type="viewMode === 'network' ? 'primary' : 'default'"
            @click="viewMode = 'network'"
            size="small"
          >
            <el-icon><Share /></el-icon>
            网络图
          </el-button>
        </el-button-group>
        
        <el-button 
          :type="showRiskOverlay ? 'warning' : 'default'"
          @click="toggleRiskOverlay"
          size="small"
        >
          <el-icon><Warning /></el-icon>
          风险预警
        </el-button>
      </div>
    </div>

    <div class="organization-content">
      <!-- 树形组织架构 -->
      <div v-if="viewMode === 'tree'" class="tree-view">
        <div class="org-tree" ref="orgTreeContainer">
          <div class="tree-node root-node" @click="selectNode(organizationData)">
            <div class="node-content">
              <div class="node-avatar">
                <el-avatar :size="50" :src="organizationData.avatar">
                  {{ organizationData.name }}
                </el-avatar>
              </div>
              <div class="node-info">
                <div class="node-name">{{ organizationData.name }}</div>
                <div class="node-title">{{ organizationData.title }}</div>
                <div class="node-department">{{ organizationData.department }}</div>
              </div>
              <div class="node-indicators">
                <el-tag v-if="organizationData.isKey" type="danger" size="small">关键</el-tag>
                <el-tag :type="getRiskTagType(organizationData.riskLevel)" size="small">
                  {{ getRiskLevelText(organizationData.riskLevel) }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <div class="tree-children" v-if="organizationData.children">
            <div 
              v-for="child in organizationData.children" 
              :key="child.id"
              class="tree-branch"
            >
              <div class="branch-line"></div>
              <TreeNode 
                :node="child" 
                :level="1"
                :show-risk-overlay="showRiskOverlay"
                @node-select="handleNodeSelect"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 网络组织架构 -->
      <div v-else class="network-view">
        <div class="network-container" ref="networkContainer">
          <svg class="network-svg" :width="networkWidth" :height="networkHeight">
            <!-- 连接线 -->
            <g class="links">
              <line
                v-for="link in networkLinks"
                :key="`${link.source}-${link.target}`"
                :x1="link.x1"
                :y1="link.y1"
                :x2="link.x2"
                :y2="link.y2"
                stroke="#ddd"
                stroke-width="2"
              />
            </g>
            
            <!-- 节点 -->
            <g class="nodes">
              <g
                v-for="node in networkNodes"
                :key="node.id"
                class="network-node"
                :transform="`translate(${node.x}, ${node.y})`"
                @click="selectNode(node)"
              >
                <circle
                  :r="getNodeRadius(node)"
                  :fill="getNodeColor(node)"
                  :stroke="node.id === selectedNodeId ? '#409EFF' : '#ddd'"
                  :stroke-width="node.id === selectedNodeId ? 3 : 1"
                />
                <text
                  :y="getNodeRadius(node) + 20"
                  text-anchor="middle"
                  class="node-label"
                  :fill="node.id === selectedNodeId ? '#409EFF' : '#333'"
                >
                  {{ node.name }}
                </text>
                <text
                  :y="getNodeRadius(node) + 35"
                  text-anchor="middle"
                  class="node-title"
                  fill="#666"
                >
                  {{ node.title }}
                </text>
                
                <!-- 风险指示器 -->
                <circle
                  v-if="showRiskOverlay && node.riskLevel === 'high'"
                  :r="getNodeRadius(node) + 5"
                  fill="none"
                  stroke="#ff4757"
                  stroke-width="3"
                  stroke-dasharray="5,5"
                  class="risk-indicator"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>

    <!-- 节点详情浮层 -->
    <el-popover
      v-if="selectedNode"
      :visible="showNodePopover"
      placement="right"
      :width="300"
      trigger="manual"
    >
      <template #reference>
        <div class="popover-reference" :style="popoverStyle"></div>
      </template>
      
      <div class="node-detail-popover">
        <div class="popover-header">
          <el-avatar :size="40" :src="selectedNode.avatar">
            {{ selectedNode.name }}
          </el-avatar>
          <div class="popover-info">
            <div class="popover-name">{{ selectedNode.name }}</div>
            <div class="popover-title">{{ selectedNode.title }}</div>
          </div>
        </div>
        
        <div class="popover-content">
          <div class="info-row">
            <span class="label">部门：</span>
            <span class="value">{{ selectedNode.department }}</span>
          </div>
          <div class="info-row">
            <span class="label">直属下级：</span>
            <span class="value">{{ selectedNode.directReports || 0 }} 人</span>
          </div>
          <div class="info-row">
            <span class="label">风险等级：</span>
            <el-tag :type="getRiskTagType(selectedNode.riskLevel)" size="small">
              {{ getRiskLevelText(selectedNode.riskLevel) }}
            </el-tag>
          </div>
          <div class="info-row" v-if="selectedNode.successors">
            <span class="label">继任者：</span>
            <span class="value">{{ selectedNode.successors.length }} 人</span>
          </div>
        </div>
        
        <div class="popover-actions">
          <el-button size="small" @click="viewEmployeeDetail">查看详情</el-button>
          <el-button size="small" type="primary" @click="manageSuccessors">管理继任者</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { List, Share, Warning } from '@element-plus/icons-vue'
import TreeNode from './TreeNode.vue'

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
  searchKeyword: string
  filterOptions: any
  selectedEmployee?: any
}

interface Emits {
  (e: 'employee-select', employee: any): void
  (e: 'position-select', position: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 视图模式
const viewMode = ref<'tree' | 'network'>('tree')
const showRiskOverlay = ref(false)

// 选中节点
const selectedNode = ref<Employee | null>(null)
const selectedNodeId = ref('')
const showNodePopover = ref(false)
const popoverStyle = ref({})

// 组织架构数据
const organizationData = ref<Employee>({
  id: 'ceo',
  name: '张总',
  title: '首席执行官',
  department: '董事会',
  avatar: '',
  isKey: true,
  riskLevel: 'low',
  directReports: 5,
  successors: [],
  children: [
    {
      id: 'cto',
      name: '李技术',
      title: '技术总监',
      department: '技术部',
      isKey: true,
      riskLevel: 'medium',
      directReports: 12,
      successors: [
        { id: 'dev1', name: '王开发', readiness: '6个月内' },
        { id: 'dev2', name: '刘架构', readiness: '1年内' }
      ],
      children: [
        {
          id: 'frontend-lead',
          name: '前端主管',
          title: '前端开发主管',
          department: '技术部',
          riskLevel: 'low',
          directReports: 6,
          successors: []
        },
        {
          id: 'backend-lead',
          name: '后端主管',
          title: '后端开发主管',
          department: '技术部',
          riskLevel: 'high',
          directReports: 8,
          successors: []
        }
      ]
    },
    {
      id: 'sales-director',
      name: '赵销售',
      title: '销售总监',
      department: '销售部',
      isKey: true,
      riskLevel: 'high',
      directReports: 15,
      successors: [],
      children: [
        {
          id: 'sales-manager-1',
          name: '销售经理A',
          title: '区域销售经理',
          department: '销售部',
          riskLevel: 'medium',
          directReports: 8,
          successors: []
        },
        {
          id: 'sales-manager-2',
          name: '销售经理B',
          title: '区域销售经理',
          department: '销售部',
          riskLevel: 'low',
          directReports: 7,
          successors: []
        }
      ]
    },
    {
      id: 'hr-director',
      name: '钱人事',
      title: '人事总监',
      department: '人事部',
      isKey: true,
      riskLevel: 'low',
      directReports: 8,
      successors: [
        { id: 'hr1', name: '孙招聘', readiness: '立即' }
      ],
      children: []
    }
  ]
})

// 网络视图相关
const networkContainer = ref<HTMLElement>()
const networkWidth = ref(800)
const networkHeight = ref(600)
const networkNodes = ref<any[]>([])
const networkLinks = ref<any[]>([])

// 过滤后的员工数据
const filteredEmployees = computed(() => {
  // 这里实现过滤逻辑
  return flattenEmployees(organizationData.value)
})

// 方法定义
const toggleRiskOverlay = () => {
  showRiskOverlay.value = !showRiskOverlay.value
}

const selectNode = (node: Employee) => {
  selectedNode.value = node
  selectedNodeId.value = node.id
  showNodePopover.value = true
  
  // 发送选中事件
  emit('employee-select', node)
}

const handleNodeSelect = (node: Employee) => {
  selectNode(node)
}

const viewEmployeeDetail = () => {
  if (selectedNode.value) {
    emit('employee-select', selectedNode.value)
    showNodePopover.value = false
  }
}

const manageSuccessors = () => {
  if (selectedNode.value) {
    ElMessage.info(`管理 ${selectedNode.value.name} 的继任者`)
    showNodePopover.value = false
  }
}

const getRiskTagType = (risk: string) => {
  const types = { 'high': 'danger', 'medium': 'warning', 'low': 'success' }
  return types[risk] || 'info'
}

const getRiskLevelText = (risk: string) => {
  const texts = { 'high': '高风险', 'medium': '中风险', 'low': '低风险' }
  return texts[risk] || '未知'
}

const flattenEmployees = (node: Employee): Employee[] => {
  const result = [node]
  if (node.children) {
    node.children.forEach(child => {
      result.push(...flattenEmployees(child))
    })
  }
  return result
}

// 网络视图相关方法
const initNetworkView = () => {
  networkNodes.value = []
  networkLinks.value = []
  
  const allNodes = flattenEmployees(organizationData.value)
  
  // 计算节点位置
  allNodes.forEach((node, index) => {
    const angle = (index * 2 * Math.PI) / allNodes.length
    const radius = Math.min(networkWidth.value, networkHeight.value) / 3
    const centerX = networkWidth.value / 2
    const centerY = networkHeight.value / 2
    
    networkNodes.value.push({
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    })
  })
  
  // 计算连接线
  const buildLinks = (parent: Employee, parentIndex: number) => {
    if (parent.children) {
      parent.children.forEach(child => {
        const childIndex = allNodes.findIndex(n => n.id === child.id)
        if (childIndex !== -1) {
          const parentNode = networkNodes.value[parentIndex]
          const childNode = networkNodes.value[childIndex]
          
          networkLinks.value.push({
            source: parent.id,
            target: child.id,
            x1: parentNode.x,
            y1: parentNode.y,
            x2: childNode.x,
            y2: childNode.y
          })
          
          buildLinks(child, childIndex)
        }
      })
    }
  }
  
  buildLinks(organizationData.value, 0)
}

const getNodeRadius = (node: any) => {
  if (node.id === 'ceo') return 30
  if (node.isKey) return 25
  return 20
}

const getNodeColor = (node: any) => {
  if (node.riskLevel === 'high') return '#ff4757'
  if (node.riskLevel === 'medium') return '#ffa502'
  return '#2ed573'
}

// 监听视图模式变化
watch(viewMode, (newMode) => {
  if (newMode === 'network') {
    nextTick(() => {
      initNetworkView()
    })
  }
})

onMounted(() => {
  if (viewMode.value === 'network') {
    initNetworkView()
  }
})
</script>

<style scoped>
.organization-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.organization-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-info h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.employee-count {
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.organization-content {
  flex: 1;
  overflow: hidden;
}

.tree-view {
  height: 100%;
  overflow: auto;
  padding: 20px;
}

.org-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tree-node {
  position: relative;
  margin-bottom: 20px;
}

.root-node .node-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.2s;
}

.root-node .node-content:hover {
  transform: translateY(-2px);
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
}

.node-content:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.node-info {
  flex: 1;
}

.node-name {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.node-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 2px;
}

.node-department {
  font-size: 12px;
  color: #909399;
}

.node-indicators {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.tree-children {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
}

.tree-branch {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.branch-line {
  width: 2px;
  height: 20px;
  background: #ddd;
  margin-bottom: 10px;
}

.branch-line::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #ddd;
}

.network-view {
  height: 100%;
  overflow: hidden;
}

.network-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.network-svg {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.network-node {
  cursor: pointer;
  transition: all 0.2s;
}

.network-node:hover {
  transform: scale(1.1);
}

.node-label {
  font-size: 12px;
  font-weight: 600;
}

.node-title {
  font-size: 10px;
}

.risk-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
}

.popover-reference {
  position: absolute;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.node-detail-popover {
  padding: 0;
}

.popover-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.popover-info {
  flex: 1;
}

.popover-name {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.popover-title {
  font-size: 14px;
  color: #606266;
  margin-top: 2px;
}

.popover-content {
  padding: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 14px;
  color: #606266;
  width: 80px;
  flex-shrink: 0;
}

.value {
  font-size: 14px;
  color: #303133;
}

.popover-actions {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 8px;
}

.popover-actions .el-button {
  flex: 1;
}
</style> 