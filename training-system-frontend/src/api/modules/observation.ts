import type { ObservationTarget, ObservationRecord } from '../../types/observation'
import request from '@/utils/request'

// 保留类型定义用于前端组件
export interface AdminObserveQuery {
  dateRange?: [string, string]
  counselorIds?: string[]
  studentIds?: string[]
  groupIds?: string[]
  type?: 'highlight' | 'improve' | ''
  page?: number
  pageSize?: number
}

export interface AdminObservationRow {
  id: string
  date: string
  counselorName: string
  counselorId: string
  studentId: string
  studentName: string
  groupId?: string
  groupName?: string
  /** highlight | improve */
  type: 'highlight' | 'improve'
  content: string
  projectId?: string
}

/**
 * 获取辅导员的观察目标列表
 */
export function getObservationsForCounselor(counselorId: string, requesterId?: string): Promise<ObservationTarget[]> {
  const url = requesterId 
    ? `/api/observations/counselor/${counselorId}?requesterId=${requesterId}`
    : `/api/observations/counselor/${counselorId}`
  return request.get(url)
}

/**
 * 提交观察记录
 */
export function submitObservation(target: ObservationTarget, content: string, tags: string[] = []): Promise<void> {
  return request.post('/api/observations/submit', {
    observerId: target.counselorId,
    target,
    content,
    tags
  })
}

/**
 * 管理员获取项目观察记录
 */
export function getObservationRecordsForAdmin(
  projectId: string, 
  query: AdminObserveQuery
): Promise<{ 
  list: AdminObservationRow[]
  total: number
  stat: { total: number; highlightRate: number; improveRate: number }
}> {
  // 从 query 中移除 projectId，因为它已经在 URL 路径中
  const { projectId: _, ...queryParams } = query;
  return request.get(`/api/observations/projects/${projectId}/admin`, {
    params: queryParams
  })
}

/**
 * 获取项目观察统计
 */
export function getProjectObservationStats(projectId: string): Promise<{
  total: number
  highlights: number
  improvements: number
  highlightRate: number
  improveRate: number
}> {
  return request.get(`/api/observations/projects/${projectId}/stats`)
}

/**
 * 创建观察记录
 */
export function createObservation(data: {
  projectId: string
  studentId: string
  type: string
  title: string
  content: string
  attachments?: string[]
  tags?: string[]
  score?: number
  visibility?: string
}, observerId: string): Promise<any> {
  return request.post('/api/observations', data, {
    params: { observerId }
  })
}

/**
 * 更新观察记录
 */
export function updateObservation(id: string, data: {
  type?: string
  title?: string
  content?: string
  attachments?: string[]
  tags?: string[]
  score?: number
  visibility?: string
}): Promise<any> {
  return request.put(`/api/observations/${id}`, data)
}

/**
 * 删除观察记录
 */
export function deleteObservation(id: string): Promise<void> {
  return request.delete(`/api/observations/${id}`)
}

/**
 * 获取观察记录列表
 */
export function getObservations(params?: {
  projectId?: string
  observerId?: string
  studentId?: string
  type?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}): Promise<{
  total: number
  records: any[]
  page: number
  pageSize: number
}> {
  return request.get('/api/observations', { params })
} 