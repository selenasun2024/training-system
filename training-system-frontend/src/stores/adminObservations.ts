import { defineStore } from 'pinia'
import type { AdminObservationRow, AdminObserveQuery } from '../api/modules/observation'
import { getObservationRecordsForAdmin, getObservations } from '../api/modules/observation'

interface State {
  records: AdminObservationRow[]
  total: number
  stats: { total: number; highlightRate: number; improveRate: number }
  loading: boolean
}

export const useAdminObservationStore = defineStore('adminObservations', {
  state: (): State => ({
    records: [],
    total: 0,
    stats: { total: 0, highlightRate: 0, improveRate: 0 },
    loading: false,
  }),
  actions: {
    async fetch(projectId: string, query: AdminObserveQuery) {
      this.loading = true
      try {
        const { list, total, stat } = await getObservationRecordsForAdmin(projectId, query)
        this.records = list
        this.total = total
        this.stats = stat
      } finally {
        this.loading = false
      }
    },
    
    // 获取所有项目的观察记录
    async fetchAllProjects(query: AdminObserveQuery) {
      this.loading = true
      try {
        const params: any = {
          page: query.page || 1,
          pageSize: query.pageSize || 10,
        }
        
        // 添加其他查询条件
        if (query.dateRange && query.dateRange.length === 2) {
          params.dateFrom = query.dateRange[0]
          params.dateTo = query.dateRange[1]
        }
        if (query.counselorIds && query.counselorIds.length > 0) {
          params.observerId = query.counselorIds[0] // API当前只支持单个observerId
        }
        if (query.studentIds && query.studentIds.length > 0) {
          params.studentId = query.studentIds[0] // API当前只支持单个studentId
        }
        // type 字段在这个查询中暂时不传递，因为前端的 highlight/improve 是通过 tags 来区分的
        
        const { total, records } = await getObservations(params)
        
        // 转换后端数据格式为前端期望的格式
        this.records = records.map((record: any) => ({
          id: record.id,
          date: record.createdAt.split('T')[0],
          counselorName: record.observer?.name || '未知',
          counselorId: record.observerId,
          studentId: record.studentId,
          studentName: record.student?.name || '未知',
          type: record.tags?.includes('highlight') ? 'highlight' : 'improve',
          content: record.content,
          projectId: record.projectId,
          projectName: record.project?.name
        }))
        
        this.total = total
        
        // 计算统计数据
        const highlightCount = this.records.filter(r => r.type === 'highlight').length
        const improveCount = this.records.filter(r => r.type === 'improve').length
        this.stats = {
          total,
          highlightRate: total > 0 ? Math.round((highlightCount / total) * 100) : 0,
          improveRate: total > 0 ? Math.round((improveCount / total) * 100) : 0
        }
      } finally {
        this.loading = false
      }
    },
  },
}) 