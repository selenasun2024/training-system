export interface ObservationTarget {
  /** 所属项目 */
  projectId: string
  projectName: string
  /** 小组，可选 */
  groupId?: string
  groupName?: string
  /** 学员 */
  traineeId: string
  traineeName: string
  /** 学员部门 */
  traineeDepartment?: string
  /** 辅导员 */
  counselorId: string
  /** 状态 */
  status: 'pending' | 'draft' | 'submitted' | 'void'
  /** 本地草稿 */
  draftContent?: string
  draftTags?: string[]
  /** 记录内容（已提交时存在） */
  record?: ObservationRecord
}

export interface ObservationRecord {
  id: string
  content: string
  tags?: string[]
  createdAt: string
  updatedAt: string
} 