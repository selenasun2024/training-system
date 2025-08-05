import request from '../../utils/request';

// 类型定义
export interface CreateProposalData {
  projectId: string;
  title: string;
  description?: string;
  content?: Record<string, any>;
  reportConfig?: Record<string, any>;
}

export interface UpdateProposalData {
  title?: string;
  description?: string;
  status?: string;
  content?: Record<string, any>;
  reportConfig?: Record<string, any>;
}

export interface SubmitProposalData {
  comments?: string;
}

export interface ApprovalData {
  action: 'APPROVED' | 'REJECTED';
  comments?: string;
}

export interface ProposalQueryParams {
  status?: string;
  projectId?: string;
  search?: string;
  page?: string;
  limit?: string;
}

/**
 * 创建方案
 */
export const createProposal = (data: CreateProposalData) => {
  return request.post('/api/proposals', data);
};

/**
 * 获取项目方案
 */
export const getProjectProposal = (projectId: string) => {
  return request.get(`/api/proposals/project/${projectId}`);
};

/**
 * 更新方案
 */
export const updateProposal = (id: string, data: UpdateProposalData) => {
  return request.put(`/api/proposals/${id}`, data);
};

/**
 * 提交方案审批
 */
export const submitProposal = (id: string, data: SubmitProposalData = {}) => {
  return request.post(`/api/proposals/${id}/submit`, data);
};

/**
 * 撤回方案
 */
export const withdrawProposal = (id: string) => {
  return request.post(`/api/proposals/${id}/withdraw`);
};

/**
 * 审批方案
 */
export const approveOrRejectProposal = (id: string, data: ApprovalData) => {
  return request.post(`/api/proposals/${id}/approval`, data);
};

/**
 * 获取项目方案版本历史
 */
export const getProposalVersionHistory = (projectId: string) => {
  return request.get(`/api/proposals/project/${projectId}/versions`);
};

/**
 * 删除方案
 */
export const deleteProposal = (id: string) => {
  return request.delete(`/api/proposals/${id}`);
};

/**
 * 获取方案列表
 */
export const getProposals = (params: ProposalQueryParams = {}) => {
  const url = '/api/proposals?' + new URLSearchParams(params as Record<string, string>).toString();
  return request.get(url);
};

/**
 * 获取方案详情
 */
export const getProposal = (id: string) => {
  return request.get(`/api/proposals/${id}`);
}; 