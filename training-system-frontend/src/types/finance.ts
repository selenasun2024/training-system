export type ResourceType = 'digital' | 'service' | 'supply'
export type ResourceStatus =
  | 'pending'     // 待处理 / 待上传 / 待采购
  | 'uploaded'    // 已上传（数字资料）
  | 'requested'   // 已申请（服务预定）
  | 'confirmed'   // 已确认（服务预定）
  | 'ordered'     // 已下单（物料）
  | 'stocked'     // 已入库（物料）
  | 'distributed' // 已分发（物料）
  | 'cancelled'

export interface ResourceItem {
  id: string
  projectId: string
  type: ResourceType
  name: string
  spec?: string
  quantity?: string
  unit?: string
  agendaItem?: string
  budgetAmount?: number // 预算金额(分)
  actualAmount?: number // 实际金额(分)
  status: ResourceStatus
  workOrderId?: string
  responsible: string
  supplier?: string
  uploadTime?: string
  url?: string
}

export interface BudgetLine {
  id: string
  projectId: string
  category: string // 费用科目
  item: string     // 费用项目
  resourceId?: string
  budgetAmount: number // 预算金额(分)
  actualAmount?: number // 实际金额(分)
  notes?: string
}

export interface BudgetSummary {
  totalBudget: number
  totalActual: number
  diff: number
  chartData: Array<{ name: string; value: number }>
} 