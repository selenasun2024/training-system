<template>
  <div class="growth-path-map">
    <div class="path-controls">
      <div class="channel-selector">
        <el-radio-group v-model="selectedChannel" @change="updatePathDisplay">
          <el-radio-button label="normal">🔵 普通通道</el-radio-button>
          <el-radio-button label="elite">🟡 精英通道</el-radio-button>
          <el-radio-button label="successor">🔴 继任者计划</el-radio-button>
        </el-radio-group>
      </div>
      <div class="path-actions">
        <el-button size="small" @click="resetZoom">重置视图</el-button>
        <el-button size="small" @click="showPathLegend = true">图例说明</el-button>
      </div>
    </div>

    <div class="path-container" ref="pathContainer">
      <svg 
        class="path-svg" 
        :width="svgWidth" 
        :height="svgHeight"
        @click="handleSvgClick"
      >
        <!-- 背景网格 -->
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f2f5" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <!-- 连接线 -->
        <g class="connections">
          <path 
            v-for="connection in pathConnections" 
            :key="connection.id"
            :d="connection.path"
            :class="['connection-line', connection.type]"
            :stroke-dasharray="connection.isDashed ? '5,5' : 'none'"
          />
        </g>

        <!-- 职位节点 -->
        <g class="positions">
          <g 
            v-for="position in pathPositions" 
            :key="position.id"
            :transform="`translate(${position.x}, ${position.y})`"
            :class="['position-node', position.type, { 'current': position.isCurrent, 'target': position.isTarget }]"
            @click="selectPosition(position)"
          >
            <!-- 节点圆圈 -->
            <circle 
              :r="position.radius"
              :class="['node-circle', position.status]"
            />
            
            <!-- 当前位置标识 -->
            <circle 
              v-if="position.isCurrent"
              r="8"
              class="current-indicator"
            />
            
            <!-- 目标位置标识 -->
            <polygon 
              v-if="position.isTarget"
              points="-8,-12 0,-20 8,-12"
              class="target-indicator"
            />
            
            <!-- 职位文本 -->
            <text 
              :y="position.radius + 20"
              class="position-text"
              text-anchor="middle"
            >
              {{ position.title }}
            </text>
            
            <!-- 级别文本 -->
            <text 
              :y="position.radius + 35"
              class="level-text"
              text-anchor="middle"
            >
              {{ position.level }}
            </text>
          </g>
        </g>

        <!-- 通道标识 -->
        <g class="channel-labels">
          <text 
            v-for="label in channelLabels" 
            :key="label.id"
            :x="label.x"
            :y="label.y"
            :class="['channel-label', label.type]"
            text-anchor="middle"
          >
            {{ label.text }}
          </text>
        </g>
      </svg>
    </div>

    <!-- 位置详情面板 -->
    <div 
      v-if="selectedPosition" 
      class="position-detail-panel"
      :style="{ left: detailPanelPosition.x + 'px', top: detailPanelPosition.y + 'px' }"
    >
      <div class="panel-header">
        <h4>{{ selectedPosition.title }}</h4>
        <el-button size="small" text @click="selectedPosition = null">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      
      <div class="panel-content">
        <div class="position-info">
          <div class="info-item">
            <span class="label">职级：</span>
            <span class="value">{{ selectedPosition.level }}</span>
          </div>
          <div class="info-item">
            <span class="label">所需经验：</span>
            <span class="value">{{ selectedPosition.experience }}</span>
          </div>
          <div class="info-item">
            <span class="label">核心技能：</span>
            <div class="skills">
              <el-tag 
                v-for="skill in selectedPosition.skills" 
                :key="skill"
                size="small"
                class="skill-tag"
              >
                {{ skill }}
              </el-tag>
            </div>
          </div>
        </div>
        
        <div class="panel-actions">
          <el-button 
            v-if="!selectedPosition.isCurrent && !selectedPosition.isTarget"
            type="primary" 
            size="small"
            @click="setAsTarget(selectedPosition)"
          >
            设为目标
          </el-button>
          <el-button 
            v-if="selectedPosition.isTarget"
            type="warning" 
            size="small"
            @click="removeTarget(selectedPosition)"
          >
            取消目标
          </el-button>
          <el-button 
            size="small"
            @click="viewPositionDetails(selectedPosition)"
          >
            查看详情
          </el-button>
        </div>
      </div>
    </div>

    <!-- 图例说明对话框 -->
    <el-dialog v-model="showPathLegend" title="路径图说明" width="600px">
      <div class="legend-content">
        <div class="legend-section">
          <h4>节点类型</h4>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-symbol">
                <div class="node-sample current"></div>
              </div>
              <span>当前位置</span>
            </div>
            <div class="legend-item">
              <div class="legend-symbol">
                <div class="node-sample target"></div>
              </div>
              <span>目标位置</span>
            </div>
            <div class="legend-item">
              <div class="legend-symbol">
                <div class="node-sample available"></div>
              </div>
              <span>可达成位置</span>
            </div>
            <div class="legend-item">
              <div class="legend-symbol">
                <div class="node-sample locked"></div>
              </div>
              <span>条件不足</span>
            </div>
          </div>
        </div>
        
        <div class="legend-section">
          <h4>发展通道</h4>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-symbol">
                <div class="line-sample normal"></div>
              </div>
              <span>🔵 普通发展通道</span>
            </div>
            <div class="legend-item">
              <div class="legend-symbol">
                <div class="line-sample elite"></div>
              </div>
              <span>🟡 精英通道</span>
            </div>
            <div class="legend-item">
              <div class="legend-symbol">
                <div class="line-sample successor"></div>
              </div>
              <span>🔴 继任者计划</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const pathContainer = ref<HTMLElement>()
const selectedChannel = ref('normal')
const selectedPosition = ref<any>(null)
const showPathLegend = ref(false)
const svgWidth = ref(800)
const svgHeight = ref(600)

// 职位数据
const positions = ref([
  // 普通通道
  {
    id: 'junior-dev',
    title: '初级开发工程师',
    level: 'P5',
    x: 100,
    y: 500,
    radius: 25,
    type: 'normal',
    status: 'completed',
    isCurrent: false,
    isTarget: false,
    experience: '0-2年',
    skills: ['基础编程', '代码规范', '团队协作'],
    channel: 'normal'
  },
  {
    id: 'mid-dev',
    title: '中级开发工程师',
    level: 'P6',
    x: 300,
    y: 450,
    radius: 25,
    type: 'normal',
    status: 'completed',
    isCurrent: false,
    isTarget: false,
    experience: '2-4年',
    skills: ['系统设计', '技术选型', '代码审查'],
    channel: 'normal'
  },
  {
    id: 'senior-dev',
    title: '高级开发工程师',
    level: 'P7',
    x: 500,
    y: 400,
    radius: 30,
    type: 'normal',
    status: 'current',
    isCurrent: true,
    isTarget: false,
    experience: '4-6年',
    skills: ['架构设计', '性能优化', '团队指导'],
    channel: 'normal'
  },
  {
    id: 'tech-lead',
    title: '技术负责人',
    level: 'P8',
    x: 700,
    y: 350,
    radius: 30,
    type: 'normal',
    status: 'available',
    isCurrent: false,
    isTarget: true,
    experience: '6-8年',
    skills: ['技术管理', '项目管理', '团队建设'],
    channel: 'normal'
  },
  // 精英通道
  {
    id: 'elite-senior',
    title: '精英高级工程师',
    level: 'P7+',
    x: 450,
    y: 250,
    radius: 35,
    type: 'elite',
    status: 'available',
    isCurrent: false,
    isTarget: false,
    experience: '3-5年',
    skills: ['创新能力', '跨领域技能', '影响力'],
    channel: 'elite'
  },
  {
    id: 'elite-architect',
    title: '首席架构师',
    level: 'P9',
    x: 650,
    y: 200,
    radius: 35,
    type: 'elite',
    status: 'locked',
    isCurrent: false,
    isTarget: false,
    experience: '8-10年',
    skills: ['系统架构', '技术战略', '团队领导'],
    channel: 'elite'
  },
  // 继任者计划
  {
    id: 'successor-manager',
    title: '部门经理候选人',
    level: 'M1',
    x: 600,
    y: 100,
    radius: 40,
    type: 'successor',
    status: 'locked',
    isCurrent: false,
    isTarget: false,
    experience: '5-8年',
    skills: ['管理能力', '战略思维', '业务理解'],
    channel: 'successor'
  }
])

// 连接线数据
const pathConnections = ref([
  {
    id: 'junior-mid',
    path: 'M 125 500 Q 200 475 275 450',
    type: 'normal',
    isDashed: false
  },
  {
    id: 'mid-senior',
    path: 'M 325 450 Q 400 425 475 400',
    type: 'normal',
    isDashed: false
  },
  {
    id: 'senior-lead',
    path: 'M 530 400 Q 600 375 670 350',
    type: 'normal',
    isDashed: false
  },
  {
    id: 'senior-elite',
    path: 'M 500 370 Q 475 310 450 280',
    type: 'elite',
    isDashed: true
  },
  {
    id: 'elite-architect',
    path: 'M 485 250 Q 550 225 615 200',
    type: 'elite',
    isDashed: false
  },
  {
    id: 'lead-successor',
    path: 'M 700 320 Q 650 210 600 140',
    type: 'successor',
    isDashed: true
  }
])

// 通道标签
const channelLabels = ref([
  {
    id: 'normal-label',
    text: '普通发展通道',
    x: 400,
    y: 550,
    type: 'normal'
  },
  {
    id: 'elite-label',
    text: '精英通道',
    x: 550,
    y: 150,
    type: 'elite'
  },
  {
    id: 'successor-label',
    text: '继任者计划',
    x: 600,
    y: 50,
    type: 'successor'
  }
])

// 计算属性
const pathPositions = computed(() => {
  return positions.value.filter(pos => 
    selectedChannel.value === 'normal' || pos.channel === selectedChannel.value
  )
})

const detailPanelPosition = computed(() => {
  if (!selectedPosition.value) return { x: 0, y: 0 }
  
  return {
    x: selectedPosition.value.x + 50,
    y: selectedPosition.value.y - 100
  }
})

// 方法
const selectPosition = (position: any) => {
  selectedPosition.value = position
  console.log('Selected position:', position)
}

const setAsTarget = (position: any) => {
  // 清除其他目标
  positions.value.forEach(pos => {
    pos.isTarget = false
  })
  
  // 设置新目标
  position.isTarget = true
  selectedPosition.value = null
  
  ElMessage.success(`已将"${position.title}"设为发展目标`)
}

const removeTarget = (position: any) => {
  position.isTarget = false
  selectedPosition.value = null
  
  ElMessage.info(`已取消"${position.title}"的目标设定`)
}

const viewPositionDetails = (position: any) => {
  // 这里可以打开详细的职位描述对话框
  console.log('View details for:', position)
  ElMessage.info('查看职位详情功能开发中...')
}

const updatePathDisplay = () => {
  selectedPosition.value = null
  console.log('Channel changed to:', selectedChannel.value)
}

const resetZoom = () => {
  // 重置视图到初始状态
  console.log('Reset zoom')
}

const handleSvgClick = (event: MouseEvent) => {
  // 点击空白区域时取消选择
  if (event.target === event.currentTarget) {
    selectedPosition.value = null
  }
}

// 组件挂载
onMounted(() => {
  // 初始化SVG尺寸
  if (pathContainer.value) {
    svgWidth.value = pathContainer.value.clientWidth
    svgHeight.value = Math.max(600, pathContainer.value.clientHeight)
  }
})
</script>

<style scoped>
.growth-path-map {
  position: relative;
  height: 100%;
}

.path-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.channel-selector {
  display: flex;
  gap: 8px;
}

.path-actions {
  display: flex;
  gap: 8px;
}

.path-container {
  position: relative;
  width: 100%;
  height: 600px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.path-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.path-svg:active {
  cursor: grabbing;
}

/* 连接线样式 */
.connection-line {
  fill: none;
  stroke-width: 3;
  opacity: 0.7;
}

.connection-line.normal {
  stroke: #409eff;
}

.connection-line.elite {
  stroke: #e6a23c;
}

.connection-line.successor {
  stroke: #f56c6c;
}

/* 职位节点样式 */
.position-node {
  cursor: pointer;
  transition: all 0.3s;
}

.position-node:hover {
  transform: scale(1.1);
}

.node-circle {
  fill: #fff;
  stroke-width: 3;
}

.node-circle.completed {
  fill: #67c23a;
  stroke: #67c23a;
}

.node-circle.current {
  fill: #409eff;
  stroke: #409eff;
  animation: pulse 2s infinite;
}

.node-circle.available {
  fill: #e6a23c;
  stroke: #e6a23c;
}

.node-circle.locked {
  fill: #c0c4cc;
  stroke: #c0c4cc;
}

.current-indicator {
  fill: #fff;
  stroke: #409eff;
  stroke-width: 2;
  animation: pulse 2s infinite;
}

.target-indicator {
  fill: #f56c6c;
  stroke: #f56c6c;
  stroke-width: 2;
}

.position-text {
  font-size: 14px;
  font-weight: 600;
  fill: #303133;
}

.level-text {
  font-size: 12px;
  fill: #909399;
}

/* 通道标签 */
.channel-label {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.6;
}

.channel-label.normal {
  fill: #409eff;
}

.channel-label.elite {
  fill: #e6a23c;
}

.channel-label.successor {
  fill: #f56c6c;
}

/* 详情面板 */
.position-detail-panel {
  position: absolute;
  width: 300px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.panel-content {
  padding: 16px;
}

.position-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
}

.info-item .label {
  width: 80px;
  font-size: 14px;
  color: #909399;
  flex-shrink: 0;
}

.info-item .value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.skill-tag {
  font-size: 12px;
}

.panel-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 图例样式 */
.legend-content {
  padding: 20px 0;
}

.legend-section {
  margin-bottom: 24px;
}

.legend-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
}

.legend-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-symbol {
  width: 40px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-sample {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid;
}

.node-sample.current {
  background: #409eff;
  border-color: #409eff;
}

.node-sample.target {
  background: #f56c6c;
  border-color: #f56c6c;
}

.node-sample.available {
  background: #e6a23c;
  border-color: #e6a23c;
}

.node-sample.locked {
  background: #c0c4cc;
  border-color: #c0c4cc;
}

.line-sample {
  width: 30px;
  height: 3px;
  border-radius: 2px;
}

.line-sample.normal {
  background: #409eff;
}

.line-sample.elite {
  background: #e6a23c;
}

.line-sample.successor {
  background: #f56c6c;
}

/* 动画 */
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .path-controls {
    flex-direction: column;
    gap: 12px;
  }
  
  .channel-selector {
    flex-direction: column;
  }
  
  .path-container {
    height: 400px;
  }
  
  .position-detail-panel {
    width: 250px;
  }
}
</style> 