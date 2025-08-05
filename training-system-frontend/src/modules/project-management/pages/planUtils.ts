import type { TagProps } from 'element-plus';

/**
 * 计划状态及其对应的文本描述
 */
export const planStatusMap = {
  'not-started': '未开始',
  'in-progress': '进行中',
  'reviewing': '审批中',
  'approved': '已批准',
  'rejected': '已驳回',
  'completed': '已完成',
  'archived': '已归档',
};

export type PlanStatus = keyof typeof planStatusMap;

/**
 * 根据状态返回对应的显示文本
 * @param status 计划状态
 */
export const statusText = (status: PlanStatus): string => {
  return planStatusMap[status] || '未知状态';
};

/**
 * 根据状态返回Element Plus标签的类型 (type)
 * @param status 计划状态
 */
export const statusTagType = (status: PlanStatus): TagProps['type'] => {
  switch (status) {
    case 'not-started':
      return 'info';
    case 'in-progress':
      return 'primary'; // Default type
    case 'reviewing':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'completed':
      return 'success';
    case 'archived':
      return 'info';
    default:
      return 'info';
  }
}; 