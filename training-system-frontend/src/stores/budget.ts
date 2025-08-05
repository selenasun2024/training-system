import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { BudgetLine, BudgetSummary } from '@/types/finance'
import * as budgetApi from '@/api/modules/budget'

export const useBudgetStore = defineStore('budget', () => {
  const budgetLines = ref<BudgetLine[]>([])
  const summary = ref<BudgetSummary | null>(null)
  const loading = ref(false)
  const mockMode = ref(false) // 关闭模拟模式，连接真实API

  // ==== Mock ====
  const mockLines: BudgetLine[] = [
    {
      id: 'bl1',
      projectId: 'mock',
      category: '讲师费用',
      item: '高级讲师-李老师',
      budgetAmount: 6400000, // 64000 元
      actualAmount: undefined,
    },
  ]

  // ==== Getters ====
  const totalBudget = computed(() => budgetLines.value.reduce((sum, b) => sum + (b.budgetAmount || 0), 0))
  const totalActual = computed(() => budgetLines.value.reduce((sum, b) => sum + (b.actualAmount || 0), 0))
  const diff = computed(() => totalActual.value - totalBudget.value)
  const chartData = computed(() => {
    const map = new Map<string, number>()
    budgetLines.value.forEach((b) => {
      const prev = map.get(b.category) || 0
      map.set(b.category, prev + b.budgetAmount)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  })

  // ==== Actions ====
  async function fetchBudget(projectId: string) {
    loading.value = true
    try {
      if (mockMode.value) {
        budgetLines.value = mockLines
        refreshSummary()
      } else {
        const result = await budgetApi.getBudgetLines(projectId)
        // 确保结果是数组格式  
        budgetLines.value = Array.isArray(result) ? result : ((result as any)?.budgetLines || [])
        summary.value = await budgetApi.getBudgetSummary(projectId)
      }
    } catch (error) {
      console.error('获取预算数据失败:', error)
      // 失败时确保budgetLines保持为数组
      budgetLines.value = []
      summary.value = null
    } finally {
      loading.value = false
    }
  }

  async function createLines(projectId: string, lines: Partial<BudgetLine>[]) {
    try {
      if (mockMode.value) {
        lines.forEach((l) => {
          budgetLines.value.push({ ...(l as BudgetLine), id: `mock-${Date.now()}` })
        })
        refreshSummary()
      } else {
        const result = await budgetApi.createBudgetLines(projectId, lines)
        // 确保result是数组
        const newLines = Array.isArray(result) ? result : []
        budgetLines.value.push(...newLines)
        summary.value = await budgetApi.getBudgetSummary(projectId)
      }
    } catch (error) {
      console.error('创建预算明细失败:', error)
      throw error // 重新抛出错误，让组件处理
    }
  }

  async function updateLine(projectId: string, id: string, patch: Partial<BudgetLine>) {
    if (mockMode.value) {
      const idx = budgetLines.value.findIndex((b) => b.id === id)
      if (idx !== -1) budgetLines.value[idx] = { ...budgetLines.value[idx], ...patch }
      refreshSummary()
    } else {
      const updated = await budgetApi.updateBudgetLine(projectId, id, patch)
      const idx = budgetLines.value.findIndex((b) => b.id === id)
      if (idx !== -1) budgetLines.value[idx] = updated
      summary.value = await budgetApi.getBudgetSummary(projectId)
    }
  }

  async function deleteLine(projectId: string, id: string) {
    if (mockMode.value) {
      budgetLines.value = budgetLines.value.filter((b) => b.id !== id)
      refreshSummary()
    } else {
      await budgetApi.deleteBudgetLine(projectId, id)
      budgetLines.value = budgetLines.value.filter((b) => b.id !== id)
      summary.value = await budgetApi.getBudgetSummary(projectId)
    }
  }

  function refreshSummary() {
    summary.value = {
      totalBudget: totalBudget.value,
      totalActual: totalActual.value,
      diff: diff.value,
      chartData: chartData.value,
    }
  }

  return {
    budgetLines,
    summary,
    loading,
    mockMode,

    // getters
    totalBudget,
    totalActual,
    diff,
    chartData,

    // actions
    fetchBudget,
    createLines,
    updateLine,
    deleteLine,
    refreshSummary,
  }
}) 