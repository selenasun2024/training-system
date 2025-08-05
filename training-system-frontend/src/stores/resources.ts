import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ResourceItem, ResourceType, ResourceStatus } from '@/types/finance'
import * as resourceApi from '@/api/modules/resource'

/**
 * useResourceStore
 * 统一管理项目资源条目；开发环境下可开启 mockMode 直接使用本地数据。
 */
export const useResourceStore = defineStore('resources', () => {
  // ======== State ========
  const resources = ref<ResourceItem[]>([])
  const loading = ref(false)
  const mockMode = ref(false) // 关闭模拟模式，连接真实API

  // ======== Mock ========
  const mockData: ResourceItem[] = [
    {
      id: 'da1',
      projectId: 'mock',
      type: 'digital',
      name: '领导力概论.ppt',
      spec: 'PPT',
      status: 'uploaded',
      responsible: '王教授',
      agendaItem: '课程一',
      budgetAmount: 0,
    },
  ]

  // ======== Getters ========
  const byType = (type: ResourceType) =>
    computed(() => {
      return resources.value.filter((r) => r.type === type)
    })

  // ======== Actions ========
  async function fetchResources(projectId: string, type?: ResourceType) {
    loading.value = true
    try {
      if (mockMode.value) {
        // 本地过滤
        resources.value = type ? mockData.filter((m) => m.type === type) : mockData
      } else {
        const result = await resourceApi.getResources(projectId, type)
        console.log('📡 获取资源API响应:', result)
        
        // 后端返回数组格式
        let resourcesData: any[] = []
        
        if (Array.isArray(result)) {
          resourcesData = result
        } else if (result && typeof result === 'object' && 'resources' in result) {
          resourcesData = (result as any).resources || []
        } else {
          resourcesData = []
          console.warn('⚠️ 未知的资源数据格式:', typeof result, result)
        }
        
        // 转换后端返回的数据：字段映射和类型转换
        resources.value = resourcesData.map((item: any) => ({
          ...item,
          type: item.type?.toLowerCase() as any,
          // 字段映射：responsible -> uploader（用于前端显示）
          uploader: item.responsible,
          // 确保前端期望的字段存在
          item: item.name, // service类型需要的字段
        }))
        
        console.log('📊 成功获取资源数据，数量:', resources.value.length)
      }
    } catch (error) {
      console.error('获取资源列表失败:', error)
      // 确保在错误情况下resources仍然是数组
      resources.value = []
    } finally {
      loading.value = false
    }
  }

  async function createResource(projectId: string, payload: Partial<ResourceItem>) {
    if (mockMode.value) {
      const item: ResourceItem = {
        ...(payload as ResourceItem),
        id: `mock-${Date.now()}`,
        projectId,
        status: 'pending',
      }
      resources.value.push(item)
      return item
    }
    
    // 数据类型转换：前端小写转后端大写
    const transformedPayload = {
      ...payload,
      type: payload.type?.toUpperCase() as any,
      // 确保必要字段不为空
      name: payload.name || '',
      responsible: payload.responsible || '',
    }
    
    const item = await resourceApi.createResource(projectId, transformedPayload)
    
    // 转换后端返回的数据类型：大写转小写，并添加字段映射
    const transformedItem = {
      ...item,
      type: item.type?.toLowerCase() as any,
      // 字段映射：responsible -> uploader（用于前端显示）
      uploader: item.responsible,
      // 确保前端期望的字段存在
      item: item.name, // service类型需要的字段
    }
    
    resources.value.push(transformedItem)
    return transformedItem
  }

  async function updateResource(projectId: string, id: string, patch: Partial<ResourceItem>) {
    if (mockMode.value) {
      const idx = resources.value.findIndex((r) => r.id === id)
      if (idx !== -1) resources.value[idx] = { ...resources.value[idx], ...patch }
      return resources.value[idx]
    }
    
    // 数据类型转换：前端小写转后端大写
    const transformedPatch = {
      ...patch,
      type: patch.type?.toUpperCase() as any,
    }
    
    const updated = await resourceApi.updateResource(projectId, id, transformedPatch)
    
    // 转换后端返回的数据类型：大写转小写
    const transformedUpdated = {
      ...updated,
      type: updated.type?.toLowerCase() as any,
    }
    
    const idx = resources.value.findIndex((r) => r.id === id)
    if (idx !== -1) resources.value[idx] = transformedUpdated
    return transformedUpdated
  }

  async function deleteResource(projectId: string, id: string) {
    if (mockMode.value) {
      resources.value = resources.value.filter((r) => r.id !== id)
      return
    }
    await resourceApi.deleteResource(projectId, id)
    resources.value = resources.value.filter((r) => r.id !== id)
  }

  function batchUpdateStatus(ids: string[], status: ResourceStatus) {
    ids.forEach((id) => {
      const idx = resources.value.findIndex((r) => r.id === id)
      if (idx !== -1) resources.value[idx].status = status
    })
  }

  return {
    resources,
    loading,
    mockMode,

    // getters
    byType,

    // actions
    fetchResources,
    createResource,
    updateResource,
    deleteResource,
    batchUpdateStatus,
  }
}) 