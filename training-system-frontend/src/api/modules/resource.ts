import type { ResourceItem, ResourceType } from '@/types/finance'
import request from '@/utils/request'

export async function getResources(projectId: string, type?: ResourceType): Promise<ResourceItem[]> {
  const url = `/api/projects/${projectId}/resources`
  if (type) {
    return request.get(`${url}?type=${type}`)
  }
  return request.get(url)
}

export async function createResource(projectId: string, payload: Partial<ResourceItem>): Promise<ResourceItem> {
  return request.post(`/api/projects/${projectId}/resources`, payload)
}

export async function updateResource(projectId: string, id: string, patch: Partial<ResourceItem>): Promise<ResourceItem> {
  return request.patch(`/api/projects/${projectId}/resources/${id}`, patch)
}

export async function deleteResource(projectId: string, id: string): Promise<void> {
  return request.delete(`/api/projects/${projectId}/resources/${id}`)
} 