<template>
  <div class="nine-grid-view">
    <div class="grid-header">
      <div class="header-info">
        <h3>九宫格人才盘点</h3>
        <span class="talent-count">{{ filteredTalents.length }} 人</span>
      </div>
      <div class="header-actions">
        <el-button-group>
          <el-button 
            :type="viewType === 'grid' ? 'primary' : 'default'"
            @click="viewType = 'grid'"
            size="small"
          >
            <el-icon><Grid /></el-icon>
            九宫格
          </el-button>
          <el-button 
            :type="viewType === 'scatter' ? 'primary' : 'default'"
            @click="viewType = 'scatter'"
            size="small"
          >
            <el-icon><ZoomIn /></el-icon>
            散点图
          </el-button>
        </el-button-group>
        
        <el-select v-model="selectedPeriod" size="small" style="width: 120px">
          <el-option label="2024年" value="2024" />
          <el-option label="2023年" value="2023" />
          <el-option label="2022年" value="2022" />
        </el-select>
        
        <el-button size="small" @click="exportMatrix">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <div class="grid-content">
      <!-- 九宫格视图 -->
      <div v-if="viewType === 'grid'" class="nine-grid-container">
        <!-- 轴标签 -->
        <div class="axis-labels">
          <div class="y-axis-label">
            <span class="axis-title">潜力</span>
            <div class="axis-values">
              <span class="axis-value high">高</span>
              <span class="axis-value medium">中</span>
              <span class="axis-value low">低</span>
            </div>
          </div>
          <div class="x-axis-label">
            <span class="axis-title">绩效</span>
            <div class="axis-values">
              <span class="axis-value low">低</span>
              <span class="axis-value medium">中</span>
              <span class="axis-value high">高</span>
            </div>
          </div>
        </div>

        <!-- 九宫格矩阵 -->
        <div class="grid-matrix">
          <div 
            v-for="(cell, index) in gridCells" 
            :key="index"
            class="grid-cell"
            :class="cell.className"
            @click="selectCell(cell)"
          >
            <div class="cell-header">
              <span class="cell-title">{{ cell.title }}</span>
              <span class="cell-count">{{ cell.employees.length }}</span>
            </div>
            <div class="cell-content">
              <div class="employee-avatars">
                <div 
                  v-for="(employee, empIndex) in cell.employees.slice(0, 6)" 
                  :key="employee.id"
                  class="employee-avatar"
                  :style="{ zIndex: 10 - empIndex }"
                  @click.stop="selectEmployee(employee)"
                >
                  <el-avatar :size="28" :src="employee.avatar">
                    {{ employee.name.charAt(0) }}
                  </el-avatar>
                  <el-tooltip :content="employee.name" placement="top">
                    <span class="employee-name">{{ employee.name }}</span>
                  </el-tooltip>
                </div>
                <div 
                  v-if="cell.employees.length > 6" 
                  class="more-employees"
                  @click.stop="viewMoreEmployees(cell)"
                >
                  +{{ cell.employees.length - 6 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 图例 -->
        <div class="grid-legend">
          <div class="legend-item">
            <div class="legend-color star"></div>
            <span>明星员工</span>
          </div>
          <div class="legend-item">
            <div class="legend-color potential"></div>
            <span>潜力股</span>
          </div>
          <div class="legend-item">
            <div class="legend-color performer"></div>
            <span>绩效明星</span>
          </div>
          <div class="legend-item">
            <div class="legend-color core"></div>
            <span>核心骨干</span>
          </div>
          <div class="legend-item">
            <div class="legend-color develop"></div>
            <span>待发展</span>
          </div>
          <div class="legend-item">
            <div class="legend-color risk"></div>
            <span>风险员工</span>
          </div>
        </div>
      </div>

      <!-- 散点图视图 -->
      <div v-else class="scatter-container">
        <div class="scatter-chart" ref="scatterChart">
          <svg class="scatter-svg" :width="chartWidth" :height="chartHeight">
            <!-- 网格线 -->
            <g class="grid-lines">
              <line 
                v-for="x in xGridLines" 
                :key="`x-${x}`"
                :x1="x" 
                :y1="0" 
                :x2="x" 
                :y2="chartHeight"
                stroke="#f0f0f0"
                stroke-width="1"
              />
              <line 
                v-for="y in yGridLines" 
                :key="`y-${y}`"
                :x1="0" 
                :y1="y" 
                :x2="chartWidth" 
                :y2="y"
                stroke="#f0f0f0"
                stroke-width="1"
              />
            </g>
            
            <!-- 象限分割线 -->
            <g class="quadrant-lines">
              <line 
                :x1="chartWidth / 3" 
                :y1="0" 
                :x2="chartWidth / 3" 
                :y2="chartHeight"
                stroke="#ddd"
                stroke-width="2"
              />
              <line 
                :x1="(chartWidth / 3) * 2" 
                :y1="0" 
                :x2="(chartWidth / 3) * 2" 
                :y2="chartHeight"
                stroke="#ddd"
                stroke-width="2"
              />
              <line 
                :x1="0" 
                :y1="chartHeight / 3" 
                :x2="chartWidth" 
                :y2="chartHeight / 3"
                stroke="#ddd"
                stroke-width="2"
              />
              <line 
                :x1="0" 
                :y1="(chartHeight / 3) * 2" 
                :x2="chartWidth" 
                :y2="(chartHeight / 3) * 2"
                stroke="#ddd"
                stroke-width="2"
              />
            </g>
            
            <!-- 员工点 -->
            <g class="employee-points">
              <circle
                v-for="employee in scatterEmployees"
                :key="employee.id"
                :cx="employee.x"
                :cy="employee.y"
                :r="getEmployeeRadius(employee)"
                :fill="getEmployeeColor(employee)"
                :stroke="employee.id === selectedEmployeeId ? '#409EFF' : '#fff'"
                :stroke-width="employee.id === selectedEmployeeId ? 3 : 1"
                class="employee-point"
                @click="selectEmployee(employee)"
                @mouseenter="showEmployeeTooltip(employee, $event)"
                @mouseleave="hideEmployeeTooltip"
              />
              
              <!-- 员工姓名标签 -->
              <text
                v-for="employee in scatterEmployees"
                :key="`label-${employee.id}`"
                :x="employee.x"
                :y="employee.y + getEmployeeRadius(employee) + 15"
                text-anchor="middle"
                class="employee-label"
                :fill="employee.id === selectedEmployeeId ? '#409EFF' : '#666'"
              >
                {{ employee.name }}
              </text>
            </g>
            
            <!-- 坐标轴 -->
            <g class="axes">
              <!-- X轴 -->
              <line 
                :x1="0" 
                :y1="chartHeight - 1" 
                :x2="chartWidth" 
                :y2="chartHeight - 1"
                stroke="#333"
                stroke-width="2"
              />
              <!-- Y轴 -->
              <line 
                :x1="1" 
                :y1="0" 
                :x2="1" 
                :y2="chartHeight"
                stroke="#333"
                stroke-width="2"
              />
            </g>
            
            <!-- 轴标签 -->
            <g class="axis-labels">
              <text :x="chartWidth / 2" :y="chartHeight - 10" text-anchor="middle" class="axis-label">
                绩效 →
              </text>
              <text :x="15" :y="chartHeight / 2" text-anchor="middle" class="axis-label" transform="rotate(-90, 15, 300)">
                潜力 →
              </text>
            </g>
          </svg>
        </div>
      </div>
    </div>

    <!-- 员工详情弹窗 -->
    <el-dialog
      v-model="employeeDetailVisible"
      :title="selectedEmployeeDetail?.name || '员工详情'"
      width="600px"
    >
      <div v-if="selectedEmployeeDetail" class="employee-detail">
        <div class="detail-header">
          <el-avatar :size="80" :src="selectedEmployeeDetail.avatar">
            {{ selectedEmployeeDetail.name }}
          </el-avatar>
          <div class="detail-info">
            <h3>{{ selectedEmployeeDetail.name }}</h3>
            <p class="position">{{ selectedEmployeeDetail.position }}</p>
            <p class="department">{{ selectedEmployeeDetail.department }}</p>
            <div class="performance-metrics">
              <el-tag :type="getPerformanceTagType(selectedEmployeeDetail.performance)">
                绩效: {{ selectedEmployeeDetail.performance }}
              </el-tag>
              <el-tag :type="getPotentialTagType(selectedEmployeeDetail.potential)">
                潜力: {{ selectedEmployeeDetail.potential }}
              </el-tag>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <div class="detail-content">
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-label">入职时间</div>
              <div class="metric-value">{{ selectedEmployeeDetail.joinDate }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">在岗时长</div>
              <div class="metric-value">{{ selectedEmployeeDetail.tenure }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">最近培训</div>
              <div class="metric-value">{{ selectedEmployeeDetail.lastTraining }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">关键技能</div>
              <div class="metric-value">{{ selectedEmployeeDetail.keySkills }}</div>
            </div>
          </div>
          
          <div class="development-suggestions">
            <h4>发展建议</h4>
            <ul>
              <li v-for="suggestion in selectedEmployeeDetail.suggestions" :key="suggestion">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="employeeDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="viewGrowthPath">查看成长路径</el-button>
      </template>
    </el-dialog>

    <!-- 员工列表弹窗 -->
    <el-dialog
      v-model="employeeListVisible"
      :title="`${selectedCellTitle} (${selectedCellEmployees.length}人)`"
      width="800px"
    >
      <div class="employee-list">
        <div 
          v-for="employee in selectedCellEmployees" 
          :key="employee.id"
          class="employee-list-item"
          @click="selectEmployee(employee)"
        >
          <el-avatar :size="40" :src="employee.avatar">
            {{ employee.name }}
          </el-avatar>
          <div class="employee-info">
            <div class="employee-name">{{ employee.name }}</div>
            <div class="employee-position">{{ employee.position }}</div>
            <div class="employee-department">{{ employee.department }}</div>
          </div>
          <div class="employee-metrics">
            <el-tag :type="getPerformanceTagType(employee.performance)" size="small">
              {{ employee.performance }}
            </el-tag>
            <el-tag :type="getPotentialTagType(employee.potential)" size="small">
              {{ employee.potential }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Grid, ZoomIn, Download } from '@element-plus/icons-vue'

interface Employee {
  id: string
  name: string
  position: string
  department: string
  avatar?: string
  performance: 'A' | 'B' | 'C'
  potential: '高' | '中' | '低'
  joinDate: string
  tenure: string
  lastTraining: string
  keySkills: string
  suggestions: string[]
}

interface Props {
  searchKeyword: string
  filterOptions: any
  selectedEmployee?: any
}

interface Emits {
  (e: 'employee-select', employee: Employee): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 基础状态
const viewType = ref<'grid' | 'scatter'>('grid')
const selectedPeriod = ref('2024')
const selectedEmployeeId = ref('')
const selectedEmployeeDetail = ref<Employee | null>(null)
const employeeDetailVisible = ref(false)
const employeeListVisible = ref(false)
const selectedCellTitle = ref('')
const selectedCellEmployees = ref<Employee[]>([])

// 图表尺寸
const chartWidth = ref(600)
const chartHeight = ref(400)

// 模拟员工数据
const employeeData = ref<Employee[]>([
  {
    id: '1',
    name: '张明',
    position: '前端开发工程师',
    department: '技术部',
    performance: 'A',
    potential: '高',
    joinDate: '2022-03-15',
    tenure: '2年8个月',
    lastTraining: 'React高级开发',
    keySkills: 'React, TypeScript',
    suggestions: ['推荐参与架构设计', '考虑晋升为高级工程师', '安排技术分享']
  },
  {
    id: '2',
    name: '李红',
    position: '产品经理',
    department: '产品部',
    performance: 'A',
    potential: '中',
    joinDate: '2021-08-20',
    tenure: '3年3个月',
    lastTraining: '产品战略规划',
    keySkills: '产品设计, 用户研究',
    suggestions: ['加强数据分析能力', '参与战略项目', '培养团队管理技能']
  },
  {
    id: '3',
    name: '王强',
    position: '销售代表',
    department: '销售部',
    performance: 'B',
    potential: '高',
    joinDate: '2023-01-10',
    tenure: '1年10个月',
    lastTraining: '销售技巧提升',
    keySkills: '客户开发, 谈判技巧',
    suggestions: ['提升销售技巧', '参与大客户项目', '培养领导能力']
  },
  {
    id: '4',
    name: '刘芳',
    position: '人事专员',
    department: '人事部',
    performance: 'B',
    potential: '中',
    joinDate: '2022-06-01',
    tenure: '2年5个月',
    lastTraining: '人力资源管理',
    keySkills: '招聘, 员工关系',
    suggestions: ['扩展业务知识', '提升沟通技能', '参与跨部门项目']
  },
  {
    id: '5',
    name: '陈伟',
    position: '财务分析师',
    department: '财务部',
    performance: 'C',
    potential: '低',
    joinDate: '2020-11-15',
    tenure: '4年',
    lastTraining: '财务分析基础',
    keySkills: '财务分析, Excel',
    suggestions: ['加强专业技能', '参与培训提升', '设定明确目标']
  }
])

// 计算属性
const filteredTalents = computed(() => {
  return employeeData.value.filter(employee => {
    if (props.searchKeyword) {
      const keyword = props.searchKeyword.toLowerCase()
      return employee.name.toLowerCase().includes(keyword) ||
             employee.position.toLowerCase().includes(keyword) ||
             employee.department.toLowerCase().includes(keyword)
    }
    return true
  })
})

// 九宫格单元格定义
const gridCells = computed(() => {
  const cells = [
    { title: '明星员工', className: 'star-cell', performance: 'A', potential: '高', employees: [] },
    { title: '潜力股', className: 'potential-cell', performance: 'B', potential: '高', employees: [] },
    { title: '待培养', className: 'develop-cell', performance: 'C', potential: '高', employees: [] },
    { title: '绩效明星', className: 'performer-cell', performance: 'A', potential: '中', employees: [] },
    { title: '核心骨干', className: 'core-cell', performance: 'B', potential: '中', employees: [] },
    { title: '待发展', className: 'improve-cell', performance: 'C', potential: '中', employees: [] },
    { title: '关键人员', className: 'key-cell', performance: 'A', potential: '低', employees: [] },
    { title: '稳定员工', className: 'stable-cell', performance: 'B', potential: '低', employees: [] },
    { title: '风险员工', className: 'risk-cell', performance: 'C', potential: '低', employees: [] }
  ]
  
  // 将员工分配到相应的单元格
  filteredTalents.value.forEach(employee => {
    const cell = cells.find(c => c.performance === employee.performance && c.potential === employee.potential)
    if (cell) {
      cell.employees.push(employee)
    }
  })
  
  return cells
})

// 散点图数据
const scatterEmployees = computed(() => {
  return filteredTalents.value.map(employee => {
    const performanceValue = employee.performance === 'A' ? 3 : employee.performance === 'B' ? 2 : 1
    const potentialValue = employee.potential === '高' ? 3 : employee.potential === '中' ? 2 : 1
    
    return {
      ...employee,
      x: (performanceValue - 1) * (chartWidth.value / 3) + (chartWidth.value / 6) + Math.random() * 40 - 20,
      y: chartHeight.value - (potentialValue - 1) * (chartHeight.value / 3) - (chartHeight.value / 6) + Math.random() * 40 - 20
    }
  })
})

// 网格线
const xGridLines = computed(() => {
  const lines = []
  for (let i = 0; i <= 3; i++) {
    lines.push(i * (chartWidth.value / 3))
  }
  return lines
})

const yGridLines = computed(() => {
  const lines = []
  for (let i = 0; i <= 3; i++) {
    lines.push(i * (chartHeight.value / 3))
  }
  return lines
})

// 方法定义
const selectCell = (cell: any) => {
  if (cell.employees.length > 0) {
    selectedCellTitle.value = cell.title
    selectedCellEmployees.value = cell.employees
    employeeListVisible.value = true
  }
}

const selectEmployee = (employee: Employee) => {
  selectedEmployeeId.value = employee.id
  selectedEmployeeDetail.value = employee
  employeeDetailVisible.value = true
  employeeListVisible.value = false
  emit('employee-select', employee)
}

const viewMoreEmployees = (cell: any) => {
  selectCell(cell)
}

const showEmployeeTooltip = (employee: Employee, event: MouseEvent) => {
  // 实现tooltip显示逻辑
}

const hideEmployeeTooltip = () => {
  // 实现tooltip隐藏逻辑
}

const getEmployeeRadius = (employee: Employee) => {
  if (employee.performance === 'A' && employee.potential === '高') return 8
  if (employee.performance === 'A' || employee.potential === '高') return 6
  return 4
}

const getEmployeeColor = (employee: Employee) => {
  if (employee.performance === 'A' && employee.potential === '高') return '#ff6b6b'
  if (employee.performance === 'A' && employee.potential === '中') return '#4ecdc4'
  if (employee.performance === 'B' && employee.potential === '高') return '#45b7d1'
  if (employee.performance === 'B' && employee.potential === '中') return '#f9ca24'
  if (employee.performance === 'C' && employee.potential === '高') return '#6c5ce7'
  return '#a0a0a0'
}

const getPerformanceTagType = (performance: string) => {
  const types = { 'A': 'success', 'B': 'warning', 'C': 'danger' }
  return types[performance] || 'info'
}

const getPotentialTagType = (potential: string) => {
  const types = { '高': 'success', '中': 'warning', '低': 'info' }
  return types[potential] || 'info'
}

const exportMatrix = () => {
  ElMessage.success('人才矩阵导出成功')
}

const viewGrowthPath = () => {
  ElMessage.info('跳转到成长路径')
  employeeDetailVisible.value = false
}

onMounted(() => {
  // 初始化图表尺寸
  chartWidth.value = 600
  chartHeight.value = 400
})
</script>

<style scoped>
.nine-grid-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.grid-header {
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

.talent-count {
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.grid-content {
  flex: 1;
  overflow: hidden;
}

.nine-grid-container {
  height: 100%;
  padding: 20px;
  position: relative;
}

.axis-labels {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.y-axis-label {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.axis-title {
  font-weight: 600;
  color: #303133;
  writing-mode: vertical-lr;
  text-orientation: mixed;
}

.axis-values {
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.axis-value {
  font-size: 12px;
  color: #606266;
  writing-mode: vertical-lr;
  text-orientation: mixed;
}

.x-axis-label {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.x-axis-label .axis-values {
  flex-direction: row;
  gap: 80px;
}

.x-axis-label .axis-value {
  writing-mode: initial;
  text-orientation: initial;
}

.grid-matrix {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
  height: calc(100% - 80px);
  margin: 40px;
}

.grid-cell {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.grid-cell:hover {
  border-color: #409EFF;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.grid-cell.star-cell {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
}

.grid-cell.potential-cell {
  background: linear-gradient(135deg, #45b7d1 0%, #2196F3 100%);
  color: white;
}

.grid-cell.develop-cell {
  background: linear-gradient(135deg, #6c5ce7 0%, #5a67d8 100%);
  color: white;
}

.grid-cell.performer-cell {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  color: white;
}

.grid-cell.core-cell {
  background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
  color: white;
}

.grid-cell.improve-cell {
  background: linear-gradient(135deg, #eb4d4b 0%, #c0392b 100%);
  color: white;
}

.grid-cell.key-cell {
  background: linear-gradient(135deg, #6c5ce7 0%, #a55eea 100%);
  color: white;
}

.grid-cell.stable-cell {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  color: white;
}

.grid-cell.risk-cell {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
}

.cell-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.cell-title {
  font-weight: 600;
  font-size: 14px;
}

.cell-count {
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

.cell-content {
  height: calc(100% - 30px);
  overflow: hidden;
}

.employee-avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: flex-start;
}

.employee-avatar {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
}

.employee-avatar:hover {
  transform: scale(1.1);
}

.employee-name {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.employee-avatar:hover .employee-name {
  opacity: 1;
}

.more-employees {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.more-employees:hover {
  background: rgba(255, 255, 255, 0.5);
}

.grid-legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.star {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
}

.legend-color.potential {
  background: linear-gradient(135deg, #45b7d1 0%, #2196F3 100%);
}

.legend-color.performer {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
}

.legend-color.core {
  background: linear-gradient(135deg, #f9ca24 0%, #f0932b 100%);
}

.legend-color.develop {
  background: linear-gradient(135deg, #eb4d4b 0%, #c0392b 100%);
}

.legend-color.risk {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.scatter-container {
  height: 100%;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.scatter-chart {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
}

.scatter-svg {
  display: block;
}

.employee-point {
  cursor: pointer;
  transition: all 0.2s;
}

.employee-point:hover {
  transform: scale(1.2);
}

.employee-label {
  font-size: 10px;
  pointer-events: none;
  user-select: none;
}

.axis-label {
  font-size: 12px;
  font-weight: 600;
  fill: #606266;
}

.employee-detail {
  padding: 0;
}

.detail-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-info {
  flex: 1;
}

.detail-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.detail-info p {
  margin: 4px 0;
  color: #606266;
}

.performance-metrics {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.detail-content {
  margin-top: 16px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.metric-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}

.development-suggestions h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.development-suggestions ul {
  margin: 0;
  padding-left: 20px;
}

.development-suggestions li {
  margin-bottom: 8px;
  color: #606266;
}

.employee-list {
  max-height: 400px;
  overflow-y: auto;
}

.employee-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
  transition: background 0.2s;
}

.employee-list-item:hover {
  background: #f8f9fa;
}

.employee-list-item:last-child {
  border-bottom: none;
}

.employee-info {
  flex: 1;
}

.employee-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.employee-position {
  color: #606266;
  font-size: 14px;
  margin-bottom: 2px;
}

.employee-department {
  color: #909399;
  font-size: 12px;
}

.employee-metrics {
  display: flex;
  gap: 6px;
}
</style> 