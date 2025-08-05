import request from '@/utils/request';
import type { TrainingGroup } from '@/modules/project-management/stores/group';

const BASE_URL = '/api';

/**
 * 获取指定项目下的小组列表
 * @param projectId 项目ID
 */
export function getGroupsByProject(projectId: string): Promise<TrainingGroup[]> {
  return request.get(`${BASE_URL}/projects/${projectId}/groups`);
}

/**
 * 创建一个新小组
 * @param projectId 项目ID
 * @param data 小组数据
 */
export function createGroup(projectId: string, data: { name: string; description?: string }) {
  // 确保 projectId 包含在请求体中，因为后端 DTO 需要这个字段
  const requestData = { ...data, projectId };
  return request.post(`${BASE_URL}/projects/${projectId}/groups`, requestData);
}

/**
 * 更新小组信息
 * @param groupId 小组ID
 * @param data 要更新的数据
 */
export function updateGroup(groupId: string, data: { name?: string; description?: string }) {
  return request.put(`${BASE_URL}/groups/${groupId}`, data);
}

/**
 * 删除一个小组
 * @param groupId 小组ID
 */
export function deleteGroup(groupId: string) {
  return request.delete(`${BASE_URL}/groups/${groupId}`);
}

/**
 * 向小组中添加成员
 * @param groupId 小组ID
 * @param data 成员信息
 */
export function addGroupMember(groupId: string, data: { userId: string; role: string }) {
  return request.post(`${BASE_URL}/groups/${groupId}/members`, data);
}

/**
 * 从小组中移除成员
 * @param groupId 小组ID
 * @param userId 用户ID
 */
export function removeGroupMember(groupId: string, userId: string) {
  return request.delete(`${BASE_URL}/groups/${groupId}/members/${userId}`);
} 