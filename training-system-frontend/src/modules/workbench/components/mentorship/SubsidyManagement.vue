<template>
  <div class="subsidy-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-date-picker
          v-model="dateRange"
          type="monthrange"
          range-separator="至"
          start-placeholder="开始月份"
          end-placeholder="结束月份"
          format="YYYY-MM"
          value-format="YYYY-MM"
          style="width: 240px"
        />
        <el-select v-model="filterStatus" placeholder="状态" style="width: 140px" clearable>
          <el-option label="全部" value="" />
          <el-option label="待部门审批" value="pending_dept" />
          <el-option label="待上级审批" value="pending_leader" />
          <el-option label="已通过" value="approved" />
          <el-option label="已发放" value="paid" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-select v-model="filterDepartment" placeholder="部门" style="width: 120px" clearable>
          <el-option label="全部部门" value="" />
          <el-option label="技术部" value="技术部" />
          <el-option label="产品部" value="产品部" />
          <el-option label="市场部" value="市场部" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button 
          type="primary" 
          @click="batchReview"
          :disabled="selectedRows.length === 0"
        >
          带教审核
        </el-button>
        <el-button 
          type="success" 
          @click="deptConfirm"
          :disabled="selectedRows.length === 0"
        >
          部门确认
        </el-button>
        <el-button 
          type="warning" 
          @click="publicizeSubsidy"
          :disabled="selectedRows.length === 0"
        >
          带教公示
        </el-button>
        <el-button 
          type="info" 
          @click="leaderApproval"
          :disabled="selectedRows.length === 0"
        >
          上级审批
        </el-button>
        <el-button @click="exportData">导出数据</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 补贴申请表格 -->
    <el-table
      :data="expandedTableData"
      :span-method="objectSpanMethod"
      v-loading="loading"
      style="width: 100%"
      border
    >
      <!-- 选择列 - 只在导师第一行显示 -->
      <el-table-column label="" width="55">
        <template #default="{ row }">
          <el-checkbox 
            v-if="row.isFirstStudentRow && row.status === 'pending_review'"
            :model-value="selectedRows.includes(row)"
            @change="handleRowSelection(row, $event)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="导师信息" width="140">
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="32">{{ row.mentorName.charAt(0) }}</el-avatar>
            <div class="user-info">
              <div class="name">{{ row.mentorName }}</div>
              <div class="department">{{ row.department }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="认证类型" width="140">
        <template #default="{ row }">
          <div class="certification-type">
            <el-tag 
              :type="getCertificationTypeTagType(row.mentorLevel)" 
              size="small"
            >
              {{ getCertificationTypeText(row.mentorLevel) }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 带教老师考核指标 - 嵌套表头 -->
      <el-table-column label="带教老师考核指标" align="center">
        <template #header>
          <div class="header-with-tooltip">
            <span>带教老师考核指标</span>
            <el-tooltip
              effect="dark"
              placement="top"
              popper-class="mentor-criteria-tooltip"
              raw-content
            >
              <template #content>
                <div class="criteria-explanation">
                  <h4>👨‍🏫 带教老师考核指标说明</h4>
                  <div class="criteria-rules">
                    <p><strong>A. 带教成功率：</strong>满一年在职学员人数÷带教学员总数（X%），取数：人力资源+师徒关系系统</p>
                    <p><strong>B. 教案记录：</strong>两年内有教案分享至"知识分享"并经书院审核（有/无），取数：知识分享+审核记录</p>
                    <p><strong>C. 投诉事故：</strong>安全部门事故流程数据（有/无），取数范围：入职日到申请日</p>
                  </div>
                </div>
              </template>
              <el-icon class="header-info-icon">?</el-icon>
            </el-tooltip>
          </div>
        </template>
        
        <el-table-column label="带教成功率" width="90" align="center">
        <template #default="{ row }">
            <span :class="getSuccessRateClass(row.mentorSuccessRate)">
              {{ row.mentorSuccessRate }}%
            </span>
        </template>
      </el-table-column>

        <el-table-column label="教案记录" width="80" align="center">
        <template #default="{ row }">
            <span :class="getPassFailClass(row.mentorHasTeachingMaterials)">
              {{ row.mentorHasTeachingMaterials ? '有' : '无' }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="投诉事故" width="80" align="center">
          <template #default="{ row }">
            <span :class="getPassFailClass(!row.mentorHasComplaints)">
              {{ row.mentorHasComplaints ? '有' : '无' }}
            </span>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="带教学员" width="120">
        <template #default="{ row }">
          <div class="student-info-row">
            <el-tag size="small" type="info">{{ row.studentName }}</el-tag>
            <span class="sequence-info">({{ getSequenceText(row.studentSequence) }})</span>
            </div>
        </template>
      </el-table-column>

      <!-- 学员考核指标 - 嵌套表头 -->
      <el-table-column label="学员考核指标" align="center">
        <template #header>
          <div class="header-with-tooltip">
            <span>学员考核指标</span>
            <el-tooltip
              effect="dark"
              placement="top"
              popper-class="student-criteria-tooltip"
              raw-content
            >
              <template #content>
                <div class="criteria-explanation">
                  <h4>📊 学员考核指标说明</h4>
                  <div class="criteria-rules">
                    <p><strong>A. 在职考核：</strong>指学员是否在职（在职/离职），取数：人力资源系统</p>
                    <p><strong>B. 评价分数：</strong>《带教老师带教质量》学员评价分数（0-100分），取数：评价系统</p>
                    <p><strong>C. 投诉事故：</strong>安全部门事故流程数据（有/无），取数范围：入职日到申请日</p>
                    <p><strong>D. 带教时长：</strong>指派日到出师日时长（X个月），取数：师徒关系系统</p>
            </div>
            </div>
              </template>
              <el-icon class="header-info-icon">?</el-icon>
            </el-tooltip>
            </div>
        </template>
        
        <el-table-column label="在职考核" width="80" align="center">
          <template #default="{ row }">
            <span :class="getPassFailClass(row.studentCriteria.employment)">
              {{ row.studentCriteria.employment ? '在职' : '离职' }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="评价分数" width="80" align="center">
          <template #default="{ row }">
            <span :class="getScorePassClass(row.studentCriteria.evaluationScore)">
              {{ row.studentCriteria.evaluationScore }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="投诉事故" width="80" align="center">
          <template #default="{ row }">
            <span :class="getPassFailClass(!row.studentCriteria.hasComplaints)">
              {{ row.studentCriteria.hasComplaints ? '有' : '无' }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="带教时长" width="80" align="center">
          <template #default="{ row }">
            <span :class="getDurationClass(row.studentCriteria.duration)">
              {{ row.studentCriteria.duration }}月
            </span>
          </template>
        </el-table-column>
      </el-table-column>

      <el-table-column label="补贴标准" width="120">
        <template #header>
          <div class="header-with-tooltip">
            <span>补贴标准</span>
            <el-tooltip
              effect="dark"
              placement="top"
              popper-class="subsidy-standard-tooltip"
              raw-content
            >
              <template #content>
                <div class="subsidy-standard-table">
                  <h4>💰 分级分序列补贴标准</h4>
                  <table class="standard-table">
                    <thead>
                      <tr>
                        <th>导师级别</th>
                        <th>工人序列补贴</th>
                        <th>文员序列补贴</th>
                        <th>适用说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>部门指定带教老师</strong></td>
                        <td>¥500/人·期</td>
                        <td>¥1,000/人·期</td>
                        <td>工人序列：仓管员、叉车工、清洗工、污水工、维修工、现场工等岗位</td>
                      </tr>
                      <tr>
                        <td><strong>书院认证带教老师</strong></td>
                        <td>¥1,000/人·期</td>
                        <td>¥3,000/人·期</td>
                        <td>书院认证带教老师：带教期间老师是书院认证并公示的带教老师</td>
                      </tr>
                    </tbody>
                  </table>
            </div>
              </template>
              <el-icon class="header-info-icon">?</el-icon>
            </el-tooltip>
            </div>
        </template>
        <template #default="{ row }">
          <div class="subsidy-standard-row">
            <span class="amount">¥{{ getStandardAmount(row.mentorLevel, row.studentSequence) }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="补贴金额" width="120">
        <template #header>
          <div class="header-with-tooltip">
            <span>补贴金额</span>
            <el-tooltip
              effect="dark"
              placement="top"
              popper-class="criteria-calculation-tooltip"
              raw-content
            >
              <template #content>
                <div class="criteria-calculation-explanation">
                  <h4>📊 考核指标说明</h4>
                  <div class="calculation-rules">
                    <p><strong>学员考核指标：</strong></p>
                    <p>• 在职考核：指学员是否在职（在职/离职）</p>
                    <p>• 评价分数：学员对带教老师的评价得分（0-100分）</p>
                    <p>• 投诉事故：带教期间是否有投诉或安全事故（有/无）</p>
                    <p>• 带教时长：实际带教时间长度（月）</p>
                    
                    <p><strong>导师考核指标：</strong></p>
                    <p>• 带教成功率：带教学员成功转正比例（百分比）</p>
                    <p>• 教案记录：是否有完整的带教教案和记录（有/无）</p>
                  </div>
                  <div class="calculation-note">
                    <p><em>📝 注：学员指标按每个师徒对独立计算，导师指标按整体表现计算</em></p>
                  </div>
                </div>
              </template>
              <el-icon class="header-info-icon">?</el-icon>
            </el-tooltip>
          </div>
        </template>
        <template #default="{ row }">
          <div class="subsidy-amount-row">
            <span class="amount">¥{{ row.studentSubsidyAmount }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="补贴总金额" width="120">
        <template #default="{ row }">
          <div class="total-subsidy">
            <span class="amount">¥{{ row.totalSubsidy }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="审批状态" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <div class="operation-buttons">
            <!-- 基础操作 -->
          <el-button 
            type="primary" 
            size="small" 
              @click="viewSubsidyDetails(row)"
          >
            详情
          </el-button>
            
            <!-- 编辑按钮 -->
          <el-button 
              v-if="row.isFirstStudentRow"
              type="info" 
            size="small" 
              @click="editAllStudentsCriteria(row)"
          >
            编辑
          </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 安全对话框组件 -->
    <SubsidyDetailDialog
      v-model="showSubsidyDetailDialog"
      title="补贴详情"
      :mentor-data="subsidyDetailData.mentorData"
      :students-data="subsidyDetailData.studentsData"
      :summary-data="subsidyDetailData.summaryData"
    />

    <PerformanceDetailDialog
      v-model="showPerformanceDetailDialog"
      :mentor-pairs="performanceDetailData"
    />

    <EditCriteriaDialog
      v-model="showEditCriteriaDialog"
      title="编辑考核指标"
      :initial-data="editCriteriaData"
      @confirm="handleEditCriteriaConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  UserFilled, 
  StarFilled 
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const dateRange = ref(['2024-01', '2024-03'])
const filterStatus = ref('')
const filterDepartment = ref('')
const selectedRows = ref([])
const showEditDialog = ref(false)

// 安全对话框相关数据
const showSubsidyDetailDialog = ref(false)
const showPerformanceDetailDialog = ref(false)
const showEditCriteriaDialog = ref(false)
const subsidyDetailData = ref({
  mentorData: {},
  studentsData: [],
  summaryData: {}
})
const performanceDetailData = ref([])
const editCriteriaData = ref({
  mentorSuccessRate: 0,
  mentorHasTeachingMaterials: false,
  mentorHasComplaints: false,
  students: []
})
const showRemindDialog = ref(false)
const selectedSubsidy = ref<any>(null)

// 分页数据
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 模拟补贴申请数据
const subsidies = ref([
  {
    id: 'sub1',
    mentorName: '王导师',
    department: '技术部',
    month: '2024-01',
    studentCount: 3,
    mentorLevel: 'college_certified', // 书院认证
    studentsSequence: 'clerk', // 学员的序列：文员序列
    mentoredStudents: [
      { 
        name: '张小明', 
        sequence: 'clerk',
        criteria: {
          employment: true,
          evaluationScore: 95,
          successRate: 100,
          hasComplaints: false,
          hasTeachingMaterials: true,
          duration: 3
        }
      },
      { 
        name: '李小红', 
        sequence: 'clerk',
        criteria: {
          employment: true,
          evaluationScore: 92,
          successRate: 100,
          hasComplaints: false,
          hasTeachingMaterials: true,
          duration: 3
        }
      },
      { 
        name: '王小强', 
        sequence: 'worker',
        criteria: {
          employment: true,
          evaluationScore: 88,
          successRate: 100,
          hasComplaints: false,
          hasTeachingMaterials: true,
          duration: 2
        }
      }
    ],
    criteria: {
      employment: true,
      evaluationScore: 95,
      successRate: 98,
      hasComplaints: false,
      hasTeachingMaterials: true,
      duration: 3
    },
    overallGrade: 'A',
    calculation: {
      baseAmount: 3000,
      successRateMultiplier: 1.2,
      durationMultiplier: 1.1,
      materialMultiplier: 1.1,
      finalMultiplier: 1.1
    },
    subsidyAmount: 3300,
    status: 'pending_review',
    appliedAt: new Date('2024-02-01'),
    deptApproval: {
      status: 'pending',
      approver: '张部长',
      approvedAt: null,
      comments: ''
    },
    leaderApproval: {
      status: 'waiting',
      approver: '李总监',
      approvedAt: null,
      comments: ''
    }
  },
  {
    id: 'sub2',
    mentorName: '李导师',
    department: '产品部',
    month: '2024-01',
    studentCount: 2,
    mentorLevel: 'department_certified', // 部门认证
    studentsSequence: 'worker', // 学员的序列：工人序列
    mentoredStudents: [
      { 
        name: '陈小华', 
        sequence: 'worker',
        criteria: {
          employment: true,
          evaluationScore: 88,
          successRate: 100,
          hasComplaints: false,
          hasTeachingMaterials: true,
          duration: 2
        }
      },
      { 
        name: '刘小美', 
        sequence: 'worker',
        criteria: {
          employment: true,
          evaluationScore: 90,
          successRate: 100,
          hasComplaints: false,
          hasTeachingMaterials: true,
          duration: 2
        }
      }
    ],
    criteria: {
      employment: true,
      evaluationScore: 88,
      successRate: 92,
      hasComplaints: false,
      hasTeachingMaterials: true,
      duration: 2
    },
    overallGrade: 'B',
    calculation: {
      baseAmount: 2000,
      successRateMultiplier: 1.1,
      durationMultiplier: 1.0,
      materialMultiplier: 1.0,
      finalMultiplier: 1.0
    },
    subsidyAmount: 2000,
    status: 'pending_review',
    appliedAt: new Date('2024-02-01'),
    deptApproval: {
      status: 'approved',
      approver: '王部长',
      approvedAt: new Date('2024-02-03'),
      comments: '表现优秀，同意发放补贴'
    },
    leaderApproval: {
      status: 'approved',
      approver: '刘总监',
      approvedAt: new Date('2024-02-05'),
      comments: '同意部门意见'
    }
  },
  {
    id: 'sub3',
    mentorName: '陈导师',
    department: '技术部',
    month: '2024-02',
    studentCount: 1,
    mentorLevel: 'not_certified', // 未认证
    studentsSequence: 'clerk',
    mentoredStudents: [
      { 
        name: '赵小刚', 
        sequence: 'clerk',
        criteria: {
          employment: false,
          evaluationScore: 70,
          successRate: 0,
          hasComplaints: true,
          hasTeachingMaterials: false,
          duration: 1
        }
      }
    ],
    criteria: {
      employment: false,
      evaluationScore: 70,
      successRate: 85,
      hasComplaints: true,
      hasTeachingMaterials: false,
      duration: 1
    },
    overallGrade: 'C',
    calculation: {
      baseAmount: 1000,
      successRateMultiplier: 0.9,
      durationMultiplier: 0.8,
      materialMultiplier: 0.8,
      finalMultiplier: 0.8
    },
    subsidyAmount: 800,
    status: 'rejected',
    appliedAt: new Date('2024-03-01'),
    deptApproval: {
      status: 'rejected',
      approver: '张部长',
      approvedAt: new Date('2024-03-03'),
      comments: '得分未达标准，不予通过'
    },
    leaderApproval: {
      status: 'waiting',
      approver: '李总监',
      approvedAt: null,
      comments: ''
    }
  },
  {
    id: 'sub4',
    mentorName: '赵导师',
    department: '市场部',
    month: '2024-02',
    studentCount: 2,
    mentorLevel: 'college_certified',
    studentsSequence: 'mixed', // 混合序列
    mentoredStudents: [
      { 
        name: '孙小丽', 
        sequence: 'clerk',
        criteria: {
          employment: true,
          evaluationScore: 90,
          successRate: 100,
          hasComplaints: false,
          hasTeachingMaterials: true,
          duration: 3
        }
      },
      { 
        name: '周小勇', 
        sequence: 'worker',
        criteria: {
          employment: true,
          evaluationScore: 93,
          successRate: 100,
          hasComplaints: false,
          hasTeachingMaterials: true,
          duration: 3
        }
      }
    ],
    criteria: {
      employment: true,
      evaluationScore: 90,
      successRate: 95,
      hasComplaints: false,
      hasTeachingMaterials: true,
      duration: 3
    },
    overallGrade: 'A',
    calculation: {
      baseAmount: 2500,
      successRateMultiplier: 1.3,
      durationMultiplier: 1.2,
      materialMultiplier: 1.2,
      finalMultiplier: 1.2
    },
    subsidyAmount: 3000,
    status: 'pending_review',
    appliedAt: new Date('2024-03-01'),
    deptApproval: {
      status: 'approved',
      approver: '孙部长',
      approvedAt: new Date('2024-03-02'),
      comments: '优秀表现，推荐通过'
    },
    leaderApproval: {
      status: 'pending',
      approver: '周总监',
      approvedAt: null,
      comments: ''
    }
  }
])

// 计算属性
const filteredSubsidies = computed(() => {
  let filtered = subsidies.value

  if (filterStatus.value) {
    filtered = filtered.filter(sub => sub.status === filterStatus.value)
  }

  if (filterDepartment.value) {
    filtered = filtered.filter(sub => sub.department === filterDepartment.value)
  }

  return filtered
})

// 扩展表格数据（将每个学员展开为单独的行）
const expandedTableData = computed(() => {
  const expanded: any[] = []
  
  filteredSubsidies.value.forEach(subsidy => {
    // 计算导师级别的考核指标
    const mentorSuccessRate = getMentorSuccessRate(subsidy.mentoredStudents)
    const mentorHasTeachingMaterials = getMentorTeachingMaterials(subsidy.mentoredStudents)
    const mentorHasComplaints = getMentorComplaints(subsidy.mentoredStudents)
    
    subsidy.mentoredStudents.forEach((student: any, studentIndex: number) => {
      const studentSubsidyAmount = getStandardAmount(subsidy.mentorLevel, student.sequence)
      expanded.push({
        // 原有导师信息
        ...subsidy,
        // 学员特定信息
        studentName: student.name,
        studentSequence: student.sequence,
        studentCriteria: student.criteria,
        studentSubsidyAmount,
        isFirstStudentRow: studentIndex === 0,
        studentRowSpan: studentIndex === 0 ? subsidy.mentoredStudents.length : 0,
        // 师徒对级别状态
        studentPaid: student.paid || false, // 该学员补贴是否已发放
        studentId: student.id || `${subsidy.id}-${studentIndex}`, // 师徒对唯一标识
        relationshipStatus: student.relationshipStatus || 'active', // 师徒关系状态
        // 导师级别考核指标
        mentorSuccessRate,
        mentorHasTeachingMaterials,
        mentorHasComplaints,
        // 汇总信息
        totalSubsidy: subsidy.mentoredStudents.reduce((sum: number, s: any) => 
          sum + getStandardAmount(subsidy.mentorLevel, s.sequence), 0),
        averageScore: getAverageScore(subsidy.mentoredStudents)
      })
    })
  })
  
  return expanded
})

// 合并单元格方法
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: any) => {
  // 调试：打印列信息
  if (column.label === '投诉事故') {
    console.log('投诉事故列信息：', {
      label: column.label,
      columnIndex,
      parent: column.parent,
      property: column.property
    })
  }
  
  // 需要合并的列（导师级别信息，一个导师显示一次）
  const mergeColumnLabels = [
    '', // 选择列（没有label）
    '导师信息',
    '认证类型', 
    '补贴总金额',
    '审批状态',
    '操作'
  ]
  
  // 带教老师考核指标的子列也需要合并（包括所有三个子列）
  const mentorCriteriaColumns = ['带教成功率', '教案记录']
  
  // 更直接的方法：根据列索引范围判断带教老师的投诉事故列
  // 带教老师考核指标应该在索引3-5的位置
  const isMentorComplaintsColumn = column.label === '投诉事故' && columnIndex === 5
  
  if (mergeColumnLabels.includes(column.label) || 
      mentorCriteriaColumns.includes(column.label) || 
      isMentorComplaintsColumn) {
    if (row.isFirstStudentRow) {
      return {
        rowspan: row.studentRowSpan,
        colspan: 1
      }
    } else {
      return {
        rowspan: 0,
        colspan: 0
      }
    }
  }
}

// 方法
const getScoreClass = (score: number) => {
  if (score >= 85) return 'score-excellent'
  if (score >= 70) return 'score-good'
  return 'score-poor'
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending_review: 'info',
    academic_reviewed: 'primary',
    pending_dept: 'warning',
    pending_leader: 'info', 
    approved: 'success',
    paid: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending_review: '待带教审核',
    academic_reviewed: '教务已审核',
    pending_dept: '待部门审批',
    pending_leader: '待上级审批',
    approved: '已通过',
    paid: '已发放',
    rejected: '已拒绝'
  }
  return textMap[status] || status
}

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending_review: '#909399',
    academic_reviewed: '#409eff',
    pending_dept: '#e6a23c',
    pending_leader: '#909399',
    approved: '#67c23a',
    paid: '#67c23a',
    rejected: '#f56c6c'
  }
  return colorMap[status] || '#909399'
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const getPassFailClass = (value: boolean) => {
  return value ? 'pass' : 'fail'
}

const getScorePassClass = (score: number) => {
  if (score >= 85) return 'pass'
  return 'fail'
}

const getSuccessRateClass = (rate: number) => {
  if (rate >= 90) return 'excellent'
  if (rate >= 80) return 'good'
  return 'poor'
}

const getDurationClass = (duration: number) => {
  if (duration >= 3) return 'excellent'
  if (duration >= 2) return 'good'
  return 'poor'
}

const getOverallGradeType = (grade: string) => {
  const typeMap: Record<string, string> = {
    A: 'success',
    B: 'info',
    C: 'warning',
    D: 'danger'
  }
  return typeMap[grade] || 'info'
}

const getOverallGradeText = (grade: string) => {
  const textMap: Record<string, string> = {
    A: '优秀',
    B: '良好',
    C: '一般',
    D: '较差'
  }
  return textMap[grade] || grade
}


const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

// 处理单个行的选择
const handleRowSelection = (row: any, checked: boolean) => {
  if (checked) {
    // 添加到选中列表
    if (!selectedRows.value.find(r => r.id === row.id)) {
      selectedRows.value.push(row)
    }
  } else {
    // 从选中列表移除
    selectedRows.value = selectedRows.value.filter(r => r.id !== row.id)
  }
}

// 控制哪些行可以被选择（保留备用）
const selectableRow = (row: any) => {
  return row.status === 'pending_review' && row.isFirstStudentRow
}

// 补贴操作相关方法 - 使用安全组件
const viewSubsidyDetails = (row: any) => {
  // 获取该导师的原始数据，包含所有学员
  const originalData = subsidies.value.find(s => s.id === row.id)
  if (!originalData) return
  
  // 准备安全的数据结构
  const studentsData = originalData.mentoredStudents.map((student: any) => ({
    name: student.name,
    department: student.department || '未知部门',
    criteria: {
      evaluationScore: student.criteria.evaluationScore,
      employment: student.criteria.employment,
      duration: student.criteria.duration,
      hasComplaints: student.criteria.hasComplaints
    },
    paid: student.paid
  }))
  
  subsidyDetailData.value = {
    mentorData: {
      mentorName: originalData.mentorName,
      department: originalData.department,
      mentorLevel: originalData.mentorLevel,
      studentCount: originalData.studentCount,
      month: originalData.month,
      status: originalData.status
    },
    studentsData,
    summaryData: {
      totalSubsidy: row.totalSubsidy,
      averageScore: row.averageScore,
      mentorSuccessRate: row.mentorSuccessRate,
      mentorHasTeachingMaterials: row.mentorHasTeachingMaterials
    }
  }
  
  showSubsidyDetailDialog.value = true
}

// 部门审批
const approveByDept = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要部门审批通过 ${row.mentorName} 的 ${row.studentName} 学员补贴申请吗？`,
      '部门审批确认',
      {
        confirmButtonText: '通过审批',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    // 更新状态
    const originalData = subsidies.value.find(s => s.id === row.id)
    if (originalData) {
      originalData.status = 'pending_leader'
      originalData.deptApproval = {
        status: 'approved',
        approver: '当前部门负责人',
        approvedAt: new Date(),
        comments: '部门审批通过'
      }
    }
    
    ElMessage.success(`${row.mentorName} 的 ${row.studentName} 学员补贴已通过部门审批`)
  } catch {
    ElMessage.info('已取消部门审批')
  }
}

// 上级审批
const approveByLeader = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要上级审批通过 ${row.mentorName} 的 ${row.studentName} 学员补贴申请吗？`,
      '上级审批确认',
      {
        confirmButtonText: '通过审批',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 更新状态
    const originalData = subsidies.value.find(s => s.id === row.id)
    if (originalData) {
      originalData.status = 'approved'
      originalData.leaderApproval = {
        status: 'approved',
        approver: '当前上级领导',
        approvedAt: new Date(),
        comments: '上级审批通过'
      }
    }
    
    ElMessage.success(`${row.mentorName} 的 ${row.studentName} 学员补贴已通过上级审批`)
  } catch {
    ElMessage.info('已取消上级审批')
  }
}

// 发放单个学员补贴
const payStudentSubsidy = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要发放 ${row.mentorName} 的 ${row.studentName} 补贴 ¥${row.studentSubsidyAmount} 吗？`,
      '发放师徒对补贴确认',
      {
        confirmButtonText: '确认发放',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新该师徒对的发放状态
    const originalData = subsidies.value.find(s => s.id === row.id)
    if (originalData) {
      const student = originalData.mentoredStudents.find((s: any) => s.name === row.studentName)
      if (student) {
        student.paid = true
        student.paidAt = new Date()
        student.paidAmount = row.studentSubsidyAmount
      }
      
      // 检查是否所有学员都已发放，如果是则更新整体状态
      const allPaid = originalData.mentoredStudents.every((s: any) => s.paid)
      if (allPaid) {
        originalData.status = 'paid'
      }
    }
    
    ElMessage.success(`已成功发放 ${row.mentorName} 的 ${row.studentName} 补贴 ¥${row.studentSubsidyAmount}`)
  } catch {
    ElMessage.info('已取消发放补贴')
  }
}

// 查看师徒对考核详情 - 使用安全组件
const viewStudentPerformance = (row: any) => {
  // 准备师徒对数据
  const mentorPair = {
    mentorName: row.mentorName,
    mentorDepartment: row.department || '未知部门',
    studentName: row.studentName,
    studentDepartment: row.studentDepartment || '未知部门',
    employment: row.studentCriteria?.employment || false,
    evaluationScore: row.studentCriteria?.evaluationScore || 0,
    duration: row.studentCriteria?.duration || 0,
    hasComplaints: row.studentCriteria?.hasComplaints || false,
    subsidyAmount: row.studentSubsidyAmount || 0,
    paid: row.studentPaid || false,
    overallScore: Math.round(
      (row.studentCriteria?.evaluationScore || 0) + 
      (row.studentCriteria?.employment ? 10 : 0) + 
      (row.studentCriteria?.hasComplaints ? -10 : 10)
    ),
    grade: getPerformanceGrade(
      row.studentCriteria?.evaluationScore || 0, 
      row.studentCriteria?.employment || false, 
      row.studentCriteria?.hasComplaints || false
    ),
    effect: getPerformanceEffect(
      row.studentCriteria?.evaluationScore || 0, 
      row.studentCriteria?.employment || false
    )
  }
  
  performanceDetailData.value = [mentorPair]
  showPerformanceDetailDialog.value = true
}

// 性能评估辅助函数
const getPerformanceGrade = (score: number, employment: boolean, hasComplaints: boolean): string => {
  let totalScore = score
  if (employment) totalScore += 10
  if (hasComplaints) totalScore -= 15
  
  if (totalScore >= 90) return 'A'
  if (totalScore >= 80) return 'B'
  if (totalScore >= 70) return 'C'
  return 'D'
}

const getPerformanceEffect = (score: number, employment: boolean): string => {
  if (score >= 85 && employment) return 'excellent'
  if (score >= 75 && employment) return 'good'
  if (score >= 65) return 'fair'
  return 'poor'
}

// 编辑所有学员的考核指标 - 使用安全组件
const editAllStudentsCriteria = (row: any) => {
  // 获取该导师的原始数据，包含所有学员
  const originalData = subsidies.value.find(s => s.id === row.id)
  if (!originalData) return
  
  // 准备学员数据
  const studentsData = originalData.mentoredStudents.map((student: any) => ({
    name: student.name,
    department: student.department || '未知部门',
    employment: student.criteria?.employment || false,
    evaluationScore: student.criteria?.evaluationScore || 0,
    hasComplaints: student.criteria?.hasComplaints || false,
    duration: student.criteria?.duration || 1
  }))
  
  // 准备初始数据
  editCriteriaData.value = {
    mentorSuccessRate: row.mentorSuccessRate || 0,
    mentorHasTeachingMaterials: row.mentorHasTeachingMaterials || false,
    mentorHasComplaints: row.mentorHasComplaints || false,
    students: studentsData
  }
  
  showEditCriteriaDialog.value = true
}

// 处理编辑表单提交
const handleEditCriteriaConfirm = (data: any) => {
  try {
    // 获取原始数据进行更新
    const originalData = subsidies.value.find(s => 
      s.mentoredStudents.some((student: any) => 
        data.students.some((editStudent: any) => editStudent.name === student.name)
      )
    )
    
    if (originalData) {
      // 更新所有学员的考核指标
      originalData.mentoredStudents.forEach((student: any) => {
        const editStudentData = data.students.find((s: any) => s.name === student.name)
        if (student.criteria && editStudentData) {
          student.criteria.employment = editStudentData.employment
          student.criteria.evaluationScore = editStudentData.evaluationScore
          student.criteria.hasComplaints = editStudentData.hasComplaints
          student.criteria.duration = editStudentData.duration
          student.criteria.lastModified = new Date()
          student.criteria.modifiedBy = '当前用户'
          
          // 同时更新导师考核指标
          student.criteria.mentorSuccessRate = data.mentorSuccessRate
          student.criteria.mentorHasTeachingMaterials = data.mentorHasTeachingMaterials
          student.criteria.mentorHasComplaints = data.mentorHasComplaints
        }
      })
      
      ElMessage.success(`已更新 ${originalData.mentorName} 及其 ${originalData.studentCount} 名学员的考核指标`)
    }
  } catch (error) {
    ElMessage.error('保存数据时出现错误，请重试')
  }
}











// 带教审核
const batchReview = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要审核的记录')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要进行带教审核选中的 ${selectedRows.value.length} 条补贴申请吗？`,
      '带教审核确认',
      {
        confirmButtonText: '确定审核',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 带教审核操作：将状态更新为"教务已审核"
    selectedRows.value.forEach(row => {
      const index = subsidies.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        subsidies.value[index].status = 'academic_reviewed'
        subsidies.value[index].academicReviewedAt = new Date()
        subsidies.value[index].academicReviewedBy = '当前教务人员' // 实际应用中从用户会话获取
      }
    })
    
    ElMessage.success(`已成功完成带教审核 ${selectedRows.value.length} 条记录`)
    selectedRows.value = []
  } catch {
    ElMessage.info('已取消带教审核')
  }
}

// 部门确认
const deptConfirm = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要确认的记录')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要部门确认选中的 ${selectedRows.value.length} 条补贴申请吗？`,
      '部门确认',
      {
        confirmButtonText: '确定确认',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    // 模拟部门确认操作
    selectedRows.value.forEach(row => {
      const index = subsidies.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        subsidies.value[index].status = 'pending_leader'
        subsidies.value[index].deptApproval = {
          status: 'approved',
          approver: '当前部门负责人',
          approvedAt: new Date(),
          comments: '部门批量确认'
        }
      }
    })
    
    ElMessage.success(`已成功确认 ${selectedRows.value.length} 条记录`)
    selectedRows.value = []
  } catch {
    ElMessage.info('已取消部门确认')
  }
}

// 带教公示
const publicizeSubsidy = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要公示的记录')
    return
  }
  
  // 筛选出已经部门确认的记录
  const confirmedRecords = selectedRows.value.filter(row => 
    row.status === 'pending_leader' || row.status === 'approved'
  )
  
  if (confirmedRecords.length === 0) {
    ElMessage.warning('所选记录中没有已通过部门确认的补贴，无法进行公示')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要将 ${confirmedRecords.length} 条已确认的补贴信息推送到企业微信带教老师群进行公示吗？`,
      '带教公示确认',
      {
        confirmButtonText: '确定公示',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟推送到企业微信
    const publicizeData = confirmedRecords.map(row => ({
      mentorName: row.mentorName,
      department: row.department,
      month: row.month,
      subsidyAmount: row.subsidyAmount,
      totalScore: row.totalScore,
      studentCount: row.studentCount
    }))
    
    console.log('推送到企业微信的数据:', publicizeData)
    
    ElMessage.success(`已成功将 ${confirmedRecords.length} 条补贴信息推送到企业微信带教老师群`)
    selectedRows.value = []
  } catch {
    ElMessage.info('已取消带教公示')
  }
}

// 上级审批
const leaderApproval = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要审批的记录')
    return
  }
  
  // 筛选出等待上级审批的记录
  const pendingRecords = selectedRows.value.filter(row => 
    row.status === 'pending_leader'
  )
  
  if (pendingRecords.length === 0) {
    ElMessage.warning('所选记录中没有等待上级审批的补贴')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要批量审批选中的 ${pendingRecords.length} 条补贴申请吗？`,
      '上级审批确认',
      {
        confirmButtonText: '确定审批',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 模拟上级审批操作
    pendingRecords.forEach(row => {
      const index = subsidies.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        subsidies.value[index].status = 'approved'
        subsidies.value[index].leaderApproval = {
          status: 'approved',
          approver: '当前上级领导',
          approvedAt: new Date(),
          comments: '上级批量审批通过'
        }
      }
    })
    
    ElMessage.success(`已成功审批 ${pendingRecords.length} 条记录`)
    selectedRows.value = []
  } catch {
    ElMessage.info('已取消上级审批')
  }
}

const exportData = () => {
  ElMessage.success('补贴数据导出功能开发中...')
}

const refreshData = () => {
  ElMessage.success('数据已刷新')
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
}

// 生命周期
onMounted(() => {
  pagination.value.total = subsidies.value.length
})

// 添加缺失的辅助函数
const getMentorLevelType = (level: string) => {
  const typeMap: Record<string, string> = {
    college_certified: 'success',
    department_certified: 'warning',
    not_certified: 'info'
  }
  return typeMap[level] || 'info'
}

const getMentorLevelText = (level: string) => {
  const textMap: Record<string, string> = {
    college_certified: '书院认证',
    department_certified: '部门指定',
    not_certified: '未认证'
  }
  return textMap[level] || level
}

const getSequenceText = (sequence: string) => {
  const textMap: Record<string, string> = {
    clerk: '文员序列',
    worker: '工人序列',
    mixed: '混合序列'
  }
  return textMap[sequence] || sequence
}

const getStandardAmount = (mentorLevel: string, studentsSequence: string) => {
  // 根据新的分级分序列补贴标准
  const standardMap: Record<string, Record<string, number>> = {
    college_certified: {
      clerk: 3000,  // 书院认证带教老师 - 文员序列
      worker: 1000, // 书院认证带教老师 - 工人序列
      mixed: 2000   // 混合取平均
    },
    department_certified: {
      clerk: 1000,  // 部门指定带教老师 - 文员序列
      worker: 500,  // 部门指定带教老师 - 工人序列
      mixed: 750    // 混合取平均
    },
    not_certified: {
      clerk: 0,     // 未认证不发放补贴
      worker: 0,
      mixed: 0
    }
  }
  
  return standardMap[mentorLevel]?.[studentsSequence] || 0
}

// 认证类型相关函数
const getCertificationTypeText = (mentorLevel: string) => {
  const textMap: Record<string, string> = {
    college_certified: '书院认证带教老师',
    department_certified: '部门指定带教老师',
    not_certified: '未认证'
  }
  return textMap[mentorLevel] || '未知'
}

const getCertificationTypeTagType = (mentorLevel: string) => {
  const typeMap: Record<string, string> = {
    college_certified: 'success',
    department_certified: 'warning', 
    not_certified: 'info'
  }
  return typeMap[mentorLevel] || 'info'
}

// 汇总计算函数
const getAverageScore = (students: any[]) => {
  if (!students || students.length === 0) return '0'
  const total = students.reduce((sum, student) => sum + (student.criteria?.evaluationScore || 0), 0)
  return Math.round(total / students.length)
}

const getOverallSuccessRate = (students: any[]) => {
  if (!students || students.length === 0) return 0
  const successCount = students.filter(student => student.criteria?.successRate === 100).length
  return Math.round((successCount / students.length) * 100)
}

// 导师级别考核指标计算
const getMentorSuccessRate = (students: any[]) => {
  if (!students || students.length === 0) return 0
  const successCount = students.filter(student => student.criteria?.successRate === 100).length
  return Math.round((successCount / students.length) * 100)
}

const getMentorTeachingMaterials = (students: any[]) => {
  if (!students || students.length === 0) return false
  // 导师的教案记录：如果所有学员都有教案记录，则认为导师有完整教案
  return students.every(student => student.criteria?.hasTeachingMaterials === true)
}

const getMentorComplaints = (students: any[]) => {
  if (!students || students.length === 0) return false
  // 导师的投诉事故：如果任何一个学员有投诉，则认为导师有投诉事故
  // 这里模拟数据，实际应该从安全部门"事故流程"获取该带教老师的数据
  return Math.random() > 0.8 // 模拟20%的概率有投诉事故
}
</script>

<style scoped>
.subsidy-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info .name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.user-info .department {
  font-size: 12px;
  color: #909399;
}

.student-count {
  font-weight: 500;
  color: #409eff;
}

.criteria-score {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  font-size: 12px;
}

.criteria-item {
  display: flex;
  justify-content: space-between;
  padding: 2px 4px;
  background: #f5f7fa;
  border-radius: 3px;
}

.criteria-item .label {
  color: #606266;
}

.criteria-item .score {
  color: #409eff;
  font-weight: 500;
}

.pass {
  color: #67c23a;
}

.fail {
  color: #f56c6c;
}

.excellent {
  color: #67c23a;
}

.good {
  color: #e6a23c;
}

.poor {
  color: #f56c6c;
}

.subsidy-amount-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.amount {
  font-weight: 500;
  color: #409eff;
}

.calculation-icon {
  color: #909399;
  font-size: 14px;
  cursor: pointer;
  margin-left: 4px;
  padding: 2px;
  border-radius: 50%;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
}

.calculation-icon:hover {
  color: #409eff;
  background: #ecf5ff;
  border-color: #b3d8ff;
}

:deep(.calculation-tooltip) {
  max-width: 350px;
}

:deep(.calculation-tooltip .calculation-explanation) {
  font-size: 13px;
  line-height: 1.6;
}

:deep(.calculation-tooltip h4) {
  margin: 0 0 10px 0;
  color: #409eff;
  font-size: 14px;
}

:deep(.calculation-tooltip .formula) {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  margin: 8px 0;
  color: #303133;
  font-family: monospace;
}

:deep(.calculation-tooltip .calculation-details p) {
  margin: 4px 0;
  color: #606266;
}

:deep(.calculation-tooltip .calculation-result) {
  background: #ecf5ff;
  padding: 8px;
  border-radius: 4px;
  margin: 8px 0;
}

:deep(.calculation-tooltip .calculation-note) {
  margin-top: 8px;
  font-style: italic;
  color: #909399;
}

.subsidy-standard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.mentor-level {
  width: 100%;
  text-align: center;
}

.standard-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.sequence {
  font-weight: 500;
  color: #303133;
}

.amount {
  font-weight: 500;
  color: #409eff;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 16px;
}

:deep(.el-table) {
  flex: 1;
}

/* 下拉菜单样式 */
:deep(.danger-item) {
  color: #ff4d4f !important;
}

:deep(.danger-item:hover) {
  background: #fff2f0 !important;
  color: #ff4d4f !important;
}

.subsidy-standard-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label-with-tooltip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.info-icon {
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  padding: 1px;
  border-radius: 50%;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-icon:hover {
  color: #409eff;
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.students-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sequence-info {
  font-size: 11px;
  color: #909399;
}

.certification-type {
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-with-tooltip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.header-info-icon {
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  padding: 1px;
  border-radius: 50%;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-info-icon:hover {
  color: #409eff;
  background: #ecf5ff;
  border-color: #b3d8ff;
}

:deep(.subsidy-standard-tooltip) {
  max-width: 600px;
}

:deep(.subsidy-standard-tooltip .subsidy-standard-table) {
  font-size: 13px;
  line-height: 1.6;
}

:deep(.subsidy-standard-tooltip h4) {
  margin: 0 0 12px 0;
  color: #409eff;
  font-size: 14px;
  text-align: center;
}

:deep(.subsidy-standard-tooltip .standard-table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}

:deep(.subsidy-standard-tooltip .standard-table th) {
  background: #f8f9fa;
  border: 1px solid #dcdfe6;
  padding: 8px 6px;
  font-weight: 600;
  color: #303133;
  text-align: center;
  font-size: 12px;
}

:deep(.subsidy-standard-tooltip .standard-table td) {
  border: 1px solid #dcdfe6;
  padding: 6px 4px;
  color: #606266;
  text-align: center;
  font-size: 11px;
}

:deep(.subsidy-standard-tooltip .standard-table td:last-child) {
  text-align: left;
  max-width: 200px;
}

:deep(.subsidy-standard-tooltip .standard-table tbody tr:nth-child(even)) {
  background: #fafafa;
}

:deep(.criteria-calculation-tooltip) {
  max-width: 450px;
}

:deep(.criteria-calculation-tooltip .criteria-calculation-explanation) {
  font-size: 13px;
  line-height: 1.6;
}

:deep(.criteria-calculation-tooltip h4) {
  margin: 0 0 12px 0;
  color: #409eff;
  font-size: 14px;
  text-align: center;
}

:deep(.criteria-calculation-tooltip .calculation-rules p) {
  margin: 6px 0;
  color: #606266;
}

:deep(.criteria-calculation-tooltip .calculation-note) {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
  font-style: italic;
  color: #909399;
}

.student-criteria-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.student-criteria-group {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px;
  background: #fafbfc;
}

.student-name-header {
  display: flex;
  justify-content: center;
  margin-bottom: 6px;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 2px 4px;
  background: #f5f7fa;
  border-radius: 3px;
  font-size: 12px;
}

.summary-item .label {
  color: #606266;
  font-weight: 500;
}

.summary-item .value {
  color: #409eff;
  font-weight: 600;
}

.student-info-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.criteria-score-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  font-size: 12px;
}

.subsidy-standard-row {
  display: flex;
  justify-content: center;
  align-items: center;
}

.subsidy-standard-row .amount {
  font-weight: 500;
  color: #409eff;
}

.subsidy-amount-row {
  display: flex;
  justify-content: center;
  align-items: center;
}

.subsidy-amount-row .amount {
  font-weight: 500;
  color: #67c23a;
  font-size: 14px;
}

.operation-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.operation-buttons .el-button {
  margin: 0;
  min-width: 60px;
}

.operation-buttons .el-dropdown {
  margin-left: 4px;
}

.mentor-criteria {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mentor-criteria .criteria-item {
  display: flex;
  justify-content: space-between;
  padding: 2px 4px;
  background: #f0f9ff;
  border-radius: 3px;
  font-size: 12px;
  border-left: 3px solid #409eff;
}

.mentor-criteria .criteria-item .label {
  color: #606266;
  font-weight: 500;
}

.mentor-criteria .criteria-item .score {
  font-weight: 600;
}

/* 清晰详情弹窗样式 */
:deep(.clear-detail-dialog) {
  width: auto !important;
  min-width: 360px;
  max-width: 450px;
  margin: 8vh auto !important;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  font-family: 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
}

:deep(.clear-detail-dialog .el-message-box__header) {
  background: linear-gradient(135deg, #409eff, #67c23a);
  padding: 20px 24px;
  border: none;
}

:deep(.clear-detail-dialog .el-message-box__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

:deep(.clear-detail-dialog .el-message-box__close) {
  color: white;
  font-size: 20px;
  font-weight: bold;
}

:deep(.clear-detail-dialog .el-message-box__content) {
  padding: 24px;
  background: #ffffff;
  max-height: 60vh;
  overflow-y: auto;
}

:deep(.clear-detail-dialog .el-message-box__message) {
  text-align: left;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  color: #303133;
}

:deep(.clear-detail-dialog .el-message-box__message h4) {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

:deep(.clear-detail-dialog .el-message-box__message p) {
  margin: 8px 0;
  font-size: 14px;
  color: #303133;
}

:deep(.clear-detail-dialog .el-message-box__message strong) {
  color: #606266;
  font-weight: 600;
}

:deep(.clear-detail-dialog .el-message-box__btns) {
  padding: 20px 24px;
  background: #f8f9fa;
  border-top: 1px solid #ebeef5;
  text-align: right;
}

:deep(.clear-detail-dialog .el-button--primary) {
  background: linear-gradient(135deg, #409eff, #67c23a);
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

:deep(.clear-detail-dialog .el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

/* 编辑考核指标对话框样式 */
:deep(.edit-criteria-dialog) {
  width: auto !important;
  min-width: 500px;
  max-width: 600px;
  margin: 5vh auto !important;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

:deep(.edit-criteria-dialog .el-message-box__header) {
  background: linear-gradient(135deg, #409eff, #67c23a);
  padding: 18px 24px;
  border: none;
}

:deep(.edit-criteria-dialog .el-message-box__title) {
  color: white;
  font-weight: 600;
  font-size: 16px;
}

:deep(.edit-criteria-dialog .el-message-box__close) {
  color: white;
  font-size: 18px;
}

:deep(.edit-criteria-dialog .el-message-box__content) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.edit-criteria-dialog .el-message-box__message) {
  margin: 0;
  text-align: left;
}

:deep(.edit-criteria-dialog .el-message-box__btns) {
  padding: 16px 24px;
  background: #f8f9fa;
  border-top: 1px solid #ebeef5;
  text-align: right;
}

:deep(.edit-criteria-dialog .el-button--primary) {
  background: linear-gradient(135deg, #67c23a, #409eff);
  border: none;
  border-radius: 6px;
  padding: 8px 20px;
  font-weight: 600;
}

:deep(.edit-criteria-dialog .el-button--default) {
  border-color: #dcdfe6;
  color: #606266;
  border-radius: 6px;
  padding: 8px 20px;
}

/* 学员考核指标提示样式 */
:deep(.student-criteria-tooltip) {
  max-width: 450px;
}

:deep(.student-criteria-tooltip .criteria-explanation) {
  font-size: 13px;
  line-height: 1.6;
}

:deep(.student-criteria-tooltip h4) {
  margin: 0 0 12px 0;
  color: #67c23a;
  font-size: 14px;
  text-align: center;
}

:deep(.student-criteria-tooltip .criteria-rules p) {
  margin: 4px 0;
  color: #606266;
}

:deep(.student-criteria-tooltip .criteria-rules p strong) {
  color: #409eff;
}

/* 带教老师考核指标提示样式 */
:deep(.mentor-criteria-tooltip) {
  max-width: 500px;
}

:deep(.mentor-criteria-tooltip .criteria-explanation) {
  font-size: 13px;
  line-height: 1.6;
}

:deep(.mentor-criteria-tooltip h4) {
  margin: 0 0 12px 0;
  color: #409eff;
  font-size: 14px;
  text-align: center;
}

:deep(.mentor-criteria-tooltip .criteria-rules p) {
  margin: 4px 0;
  color: #606266;
}

:deep(.mentor-criteria-tooltip .criteria-rules p strong) {
  color: #e6a23c;
}

/* 补贴总金额样式 */
.total-subsidy {
  text-align: center;
  padding: 4px;
}

.total-subsidy .amount {
  font-size: 16px;
  font-weight: 700;
  color: #67c23a;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}
</style> 