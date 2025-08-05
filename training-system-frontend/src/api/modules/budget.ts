import type { BudgetLine, BudgetSummary } from '@/types/finance'
import request from '@/utils/request'

export async function getBudgetLines(projectId: string): Promise<BudgetLine[]> {
  return request.get(`/api/projects/${projectId}/budget-lines`)
}

export async function createBudgetLines(projectId: string, lines: Partial<BudgetLine>[]): Promise<BudgetLine[]> {
  return request.post(`/api/projects/${projectId}/budget-lines`, lines)
}

export async function updateBudgetLine(projectId: string, id: string, patch: Partial<BudgetLine>): Promise<BudgetLine> {
  return request.patch(`/api/projects/${projectId}/budget-lines/${id}`, patch)
}

export async function getBudgetSummary(projectId: string): Promise<BudgetSummary> {
  return request.get(`/api/projects/${projectId}/budget-summary`)
}

export async function deleteBudgetLine(projectId: string, id: string): Promise<void> {
  return request.delete(`/api/projects/${projectId}/budget-lines/${id}`)
} 