import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getProjectProposal,
  createProposal,
  updateProposal,
  submitProposal,
  withdrawProposal,
  approveOrRejectProposal,
} from '@/api/modules/proposal';

// 类型定义
export type ProposalStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';

export interface ApprovalStep {
  id: string;
  title: string;
  description: string;
  status: 'wait' | 'process' | 'finish' | 'error' | 'success';
  approver?: {
    id: string;
    name: string;
    role: string;
  };
  approvedAt?: string;
  comments?: string;
}

export interface ReportModule {
  id: string;
  label: string;
  required: boolean;
  visible: boolean;
}

export interface ProposalData {
  id: string;
  projectId: string;
  status: ProposalStatus;
  title: string;
  description?: string;
  modules: ReportModule[];
  submittedAt?: string;
  submittedBy?: string;
  approvalSteps: ApprovalStep[];
  reportData: {
    overview?: any;
    agenda?: any[];
    budget?: any[];
    groups?: any[];
    resources?: any[];
  };
  createdAt: string;
  updatedAt: string;
}

export const useProposalStore = defineStore('proposal', () => {
  // 状态
  const currentProposal = ref<ProposalData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 默认报告模块配置
  const defaultModules: ReportModule[] = [
    { id: 'overview', label: '项目概览', required: true, visible: true },
    { id: 'audience', label: '培训对象与分组', required: true, visible: true },
    { id: 'agenda', label: '议程安排', required: false, visible: true },
    { id: 'budget', label: '预算明细', required: false, visible: true },
    { id: 'resources', label: '核心资源与分工', required: false, visible: true },
  ];

  // 加载项目方案
  const loadProposal = async (projectId: string) => {
    loading.value = true;
    error.value = null;
    try {
      console.log('🔄 加载项目方案:', projectId);
      
      const response = await getProjectProposal(projectId);
      console.log('✅ 方案API原始响应:', response);
      console.log('✅ 方案API响应数据:', response?.data);
      
      if (response) {
        let proposalData = null;
        
        // 处理不同的API响应格式
        if (response.data && response.data.code && response.data.data) {
          // 标准后端格式：{ code: 200, message: '...', data: proposal }
          proposalData = response.data.data;
          console.log('🔍 使用标准格式数据:', proposalData);
        } else if (response.data && response.data.id) {
          // axios包装格式：{ data: proposal }
          proposalData = response.data;
          console.log('🔍 使用axios格式数据:', proposalData);
        } else if (response.id) {
          // 直接方案对象格式：proposal (当前实际格式)
          proposalData = response;
          console.log('🔍 使用直接方案对象数据:', proposalData);
        } else {
          console.log('⚠️ 未知的API响应格式，response:', response);
          console.log('⚠️ response.data:', response.data);
        }
        
        if (proposalData && proposalData.id) {
          console.log('🔍 方案状态(转换前):', proposalData.status);
          
          // 转换后端数据格式为前端需要的格式
          currentProposal.value = convertBackendProposalToFrontend(proposalData, projectId);
          
          console.log('🔍 方案状态(转换后):', currentProposal.value.status);
          console.log('✅ 方案转换完成:', currentProposal.value);
        } else {
          console.log('⚠️ API返回的数据无效，创建默认方案');
          const defaultProposal = await createDefaultProposal(projectId);
          currentProposal.value = defaultProposal;
        }
      } else {
        // 如果没有方案，创建一个默认的草稿方案
        console.log('🔄 项目暂无方案，创建默认方案');
        const defaultProposal = await createDefaultProposal(projectId);
        currentProposal.value = defaultProposal;
      }
      
      console.log('✅ 方案加载完成，最终状态:', currentProposal.value?.status);
    } catch (err: any) {
      console.error('❌ 加载方案失败:', err);
      error.value = err.message;
      
      // 如果API调用失败，创建一个默认的本地方案
      console.log('🔄 API失败，创建本地默认方案');
      currentProposal.value = createLocalDefaultProposal(projectId);
      
      ElMessage.warning('加载方案失败，使用默认方案');
    } finally {
      loading.value = false;
    }
  };

  // 更新报告数据
  const updateReportData = (data: any) => {
    if (currentProposal.value) {
      currentProposal.value.reportData = { ...currentProposal.value.reportData, ...data };
      console.log('✅ 报告数据更新成功');
    }
  };

  // 更新模块可见性
  const updateModuleVisibility = (moduleId: string, visible: boolean) => {
    if (currentProposal.value) {
      const module = currentProposal.value.modules.find(m => m.id === moduleId);
      if (module) {
        module.visible = visible;
        console.log(`✅ 模块 ${moduleId} 可见性更新为: ${visible}`);
      }
    }
  };

  // 状态格式转换函数 - 将后端状态转换为前端标准状态
  const normalizeStatus = (status: string): ProposalStatus => {
    if (!status) return 'draft';
    const lowercaseStatus = status.toLowerCase().trim();
    
         // 状态映射表 - 支持多种后端状态格式
     const statusMap: Record<string, ProposalStatus> = {
       // 标准状态（小写）
       'draft': 'draft',
       'submitted': 'submitted',
       'under_review': 'under_review',
       'approved': 'approved',
       'rejected': 'rejected',
       'withdrawn': 'withdrawn',
       
       // 大写状态（后端返回格式）
       'DRAFT': 'draft',
       'SUBMITTED': 'submitted',
       'UNDER_REVIEW': 'under_review',
       'APPROVED': 'approved',
       'REJECTED': 'rejected',
       'WITHDRAWN': 'withdrawn',
       
       // 其他可能的变体
       'pending': 'submitted',
       'pending_approval': 'submitted',
       'in_review': 'under_review',
       'reviewing': 'under_review',
       'passed': 'approved',
       'denied': 'rejected',
       'cancelled': 'withdrawn',
     };
    
    const mappedStatus = statusMap[lowercaseStatus];
    if (mappedStatus) {
      console.log('🔄 状态映射:', status, '→', mappedStatus);
      return mappedStatus;
    }
    
    // 尝试直接匹配有效状态
    const validStatuses: ProposalStatus[] = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn'];
    if (validStatuses.includes(lowercaseStatus as ProposalStatus)) {
      console.log('🔄 直接匹配状态:', status, '→', lowercaseStatus);
      return lowercaseStatus as ProposalStatus;
    }
    
    // 如果状态不在预期范围内，返回默认状态
    console.warn('⚠️ 未知状态:', status, '使用默认状态: draft');
    return 'draft';
  };

  // 提交审批
  const submitForApproval = async () => {
    try {
      if (!currentProposal.value) {
        throw new Error('没有可提交的方案');
      }
      
      // 检查当前方案状态，如果已经提交过就不再重复提交
      if (currentProposal.value.status === 'submitted' || 
          currentProposal.value.status === 'under_review' || 
          currentProposal.value.status === 'approved') {
        console.log('⚠️ 方案已经提交过，当前状态:', currentProposal.value.status);
        ElMessage.warning('方案已经提交，无需重复提交');
        return;
      }
      
      let proposalId = currentProposal.value.id;
      
      // 如果方案ID为空，说明是本地创建的，需要先创建到数据库
      if (!proposalId) {
        console.log('🔄 方案ID为空，先创建方案到数据库');
        const createResponse = await createProposal({
          projectId: currentProposal.value.projectId,
          title: currentProposal.value.title,
          description: currentProposal.value.description,
          content: {},
          reportConfig: {}
        });
        
        console.log('🔍 创建方案API响应:', createResponse);
        
        if (createResponse && createResponse.id) {
          // 直接返回方案对象：{ id: '...', ... }
          proposalId = createResponse.id;
          currentProposal.value.id = proposalId;
          
          // 更新本地状态为创建返回的状态
          if (createResponse.status) {
            const normalizedStatus = normalizeStatus(createResponse.status);
            currentProposal.value.status = normalizedStatus;
            console.log('🔍 创建后状态更新为:', normalizedStatus);
            
            // 如果创建返回的方案已经是提交状态，说明是已存在的方案
            if (normalizedStatus !== 'draft') {
              console.log('⚠️ 发现现有方案已提交，停止重复提交');
              ElMessage.info('方案已存在且已提交');
              return;
            }
          }
          
          console.log('✅ 方案创建成功，ID:', proposalId);
        } else if (createResponse && createResponse.data && createResponse.data.data) {
          // 后端标准格式：{ code: 201, message: '...', data: { id: '...', ... } }
          proposalId = createResponse.data.data.id;
          currentProposal.value.id = proposalId;
          console.log('✅ 方案创建成功，ID:', proposalId);
        } else if (createResponse && createResponse.data && createResponse.data.id) {
          // axios包装格式：{ data: { id: '...', ... } }
          proposalId = createResponse.data.id;
          currentProposal.value.id = proposalId;
          console.log('✅ 方案创建成功，ID:', proposalId);
        } else {
          console.error('❌ 创建方案响应格式错误:', createResponse);
          throw new Error('创建方案失败');
        }
      }
      
      console.log('🔄 提交方案审批，ID:', proposalId);
      
      const response = await submitProposal(proposalId);
      
      console.log('🔍 提交审批API响应:', response);
      
      if (response && response.data) {
        let updatedProposal = null;
        
        // 处理不同的响应格式
        if (response.data.code && response.data.data) {
          // 标准后端格式：{ code: 200, message: '...', data: proposal }
          updatedProposal = response.data.data;
          console.log('🔍 提交响应使用标准格式数据:', updatedProposal);
        } else if (response.data.id) {
          // 直接方案对象格式：proposal
          updatedProposal = response.data;
          console.log('🔍 提交响应使用直接方案对象:', updatedProposal);
        }
        
        if (updatedProposal) {
          // 使用后端返回的实际数据更新本地状态
          currentProposal.value.status = normalizeStatus(updatedProposal.status);
          currentProposal.value.submittedAt = updatedProposal.submittedAt || new Date().toISOString();
          currentProposal.value.submittedBy = updatedProposal.submittedBy;
          
          console.log('✅ 状态已更新为:', currentProposal.value.status);
        } else {
          // 兜底：手动设置状态
          currentProposal.value.status = 'submitted';
          currentProposal.value.submittedAt = new Date().toISOString();
          console.log('⚠️ 使用兜底状态更新');
        }
      } else {
        // 兜底处理
        currentProposal.value.status = 'submitted';
        currentProposal.value.submittedAt = new Date().toISOString();
        console.log('⚠️ 响应格式异常，使用兜底状态');
      }
      
      ElMessage.success('方案已提交审批');
    } catch (err: any) {
      console.error('❌ 提交审批失败:', err);
      ElMessage.error('提交审批失败');
      throw err;
    }
  };

  // 撤回申请
  const withdrawProposalRequest = async () => {
    try {
      if (!currentProposal.value) {
        throw new Error('没有可撤回的方案');
      }
      
      console.log('🔄 撤回方案申请');
      
      const response = await withdrawProposal(currentProposal.value.id);
      
      console.log('🔍 撤回申请API响应:', response);
      
      if (response && response.data) {
        let updatedProposal = null;
        
        // 处理不同的响应格式
        if (response.data.code && response.data.data) {
          updatedProposal = response.data.data;
          console.log('🔍 撤回响应使用标准格式数据:', updatedProposal);
        } else if (response.data.id) {
          updatedProposal = response.data;
          console.log('🔍 撤回响应使用直接方案对象:', updatedProposal);
        }
        
        if (updatedProposal) {
          // 使用后端返回的实际数据更新本地状态
          currentProposal.value.status = normalizeStatus(updatedProposal.status);
          currentProposal.value.submittedAt = undefined;
          currentProposal.value.submittedBy = undefined;
          
          console.log('✅ 撤回后状态已更新为:', currentProposal.value.status);
        } else {
          // 兜底：手动设置状态
          currentProposal.value.status = 'draft';
          currentProposal.value.submittedAt = undefined;
          console.log('⚠️ 使用兜底状态更新');
        }
      }
      
      ElMessage.success('方案申请已撤回');
    } catch (err: any) {
      console.error('❌ 撤回申请失败:', err);
      ElMessage.error('撤回申请失败');
      throw err;
    }
  };

  // 计算属性
  const statusInfo = computed(() => {
    if (!currentProposal.value) return { title: '加载中...', type: 'info', description: '' };
    
    switch (currentProposal.value.status) {
      case 'draft':
        return { 
          title: '草稿状态', 
          type: 'info', 
          description: '方案正在编辑中，尚未提交审批' 
        };
      case 'submitted':
        return { 
          title: '已提交', 
          type: 'warning', 
          description: '方案已提交，等待审批处理' 
        };
      case 'under_review':
        return { 
          title: '审批中', 
          type: 'warning', 
          description: '方案正在审批流程中' 
        };
      case 'approved':
        return { 
          title: '已通过', 
          type: 'success', 
          description: '方案已通过所有审批，可以开始执行' 
        };
      case 'rejected':
        return { 
          title: '已拒绝', 
          type: 'error', 
          description: '方案被拒绝，请根据意见修改后重新提交' 
        };
      default:
        return { title: '未知状态', type: 'info', description: '' };
    }
  });

  const visibleModules = computed(() => {
    return currentProposal.value?.modules.filter(m => m.visible) || [];
  });

  const isModuleVisible = (moduleId: string) => {
    return currentProposal.value?.modules.find(m => m.id === moduleId)?.visible || false;
  };

  // 辅助函数：转换后端数据格式
  const convertBackendProposalToFrontend = (backendData: any, projectId: string): ProposalData => {
    console.log('🔄 开始转换后端数据:', backendData);
    
    // 获取状态，支持多种格式
    const rawStatus = backendData.status || backendData.proposalStatus || 'DRAFT';
    const normalizedStatus = normalizeStatus(rawStatus);
    
    console.log('🔍 状态转换:', rawStatus, '→', normalizedStatus);
    
    const result = {
      id: backendData.id || '',
      projectId: projectId,
      status: normalizedStatus,
      title: backendData.title || '项目培训方案',
      description: backendData.description || '',
      modules: backendData.reportConfig?.modules || backendData.modules || defaultModules,
      submittedAt: backendData.submittedAt || backendData.submitted_at,
      submittedBy: backendData.submittedBy || backendData.submitted_by,
      approvalSteps: convertApprovalSteps(backendData.approvalSteps || backendData.approval_steps || []),
      reportData: backendData.reportData || backendData.content || createDefaultReportData(),
      createdAt: backendData.createdAt || backendData.created_at || new Date().toISOString(),
      updatedAt: backendData.updatedAt || backendData.updated_at || new Date().toISOString(),
    };
    
    console.log('✅ 转换结果:', result);
    return result;
  };

  // 转换审批步骤格式
  const convertApprovalSteps = (backendSteps: any[]): ApprovalStep[] => {
    return backendSteps.map(step => ({
      id: step.stepId || step.id,
      title: step.stepName || step.title,
      description: step.comments || step.description || '',
      status: convertStepStatus(step.status),
      approver: step.approver ? {
        id: step.approver.id,
        name: step.approver.name,
        role: step.approverRole || '审批人',
      } : undefined,
      approvedAt: step.approvedAt,
      comments: step.comments,
    }));
  };

  // 转换步骤状态
  const convertStepStatus = (backendStatus: string) => {
    switch (backendStatus?.toUpperCase()) {
      case 'APPROVED': return 'finish';
      case 'REJECTED': return 'error';
      case 'PENDING': return 'wait';
      default: return 'wait';
    }
  };

  // 创建默认报告数据
  const createDefaultReportData = () => {
    return {
      overview: {
        projectName: '新员工入职培训',
        duration: '3天',
        participantCount: 25,
        location: 'A栋培训室',
      },
      agenda: [
        { time: '2024-07-10', activity: '启动会 & 破冰' },
        { time: '2024-07-11', activity: '核心课程一：领导力基础' },
        { time: '2024-07-12', activity: '结业典礼' },
      ],
      budget: [
        { category: '讲师费用', item: '高级讲师 - 李老师', amount: 64000 },
        { category: '场地费用', item: '主会场租赁 (A栋报告厅)', amount: 16000 },
        { category: '物料费用', item: '学员手册印刷', amount: 5000 },
        { category: '杂项费用', item: '办公文具采购', amount: 500 },
      ],
      groups: [
        { groupName: '第一组：先锋队', members: '张三, 李四, 王小五, 赵六, 周七', leader: '张三' },
        { groupName: '第二组：雄鹰队', members: '陈八, 朱九, 秦十, 吴十一, 郑十二', leader: '陈八' },
        { groupName: '第三组：超越队', members: '孙十三, 冯十四, 卫十五, 蒋十六, 沈十七', leader: '孙十三' },
      ],
    };
  };

  // 创建默认方案（API调用成功时）
  const createDefaultProposal = async (projectId: string): Promise<ProposalData> => {
    try {
      const proposalData = {
        projectId,
        title: '项目培训方案',
        description: '本项目的详细培训实施方案',
        content: {},
        reportConfig: { modules: defaultModules },
      };
      
      const response = await createProposal(proposalData);
      
      if (response && response.data) {
        return convertBackendProposalToFrontend(response.data, projectId);
      }
    } catch (err) {
      console.error('❌ 创建默认方案失败:', err);
    }
    
    // 如果创建失败，返回本地默认方案
    return createLocalDefaultProposal(projectId);
  };

  // 创建本地默认方案（API失败时的fallback）
  const createLocalDefaultProposal = (projectId: string): ProposalData => {
    return {
      id: '', // 空ID，提交时需要先创建方案
      projectId,
      status: 'draft',
      title: '项目培训方案',
      description: '本项目的详细培训实施方案',
      modules: defaultModules,
      submittedAt: undefined,
      approvalSteps: [
        {
          id: '1',
          title: '部门经理审批',
          description: '待处理',
          status: 'wait',
          approver: { id: 'manager1', name: '张三', role: '部门经理' },
        },
        {
          id: '2', 
          title: 'HRBP审核',
          description: '待处理',
          status: 'wait',
          approver: { id: 'hrbp1', name: '李四', role: 'HRBP' },
        },
        {
          id: '3',
          title: '分管领导终审',
          description: '待处理',
          status: 'wait',
          approver: { id: 'leader1', name: '王五', role: '分管领导' },
        },
      ],
      reportData: createDefaultReportData(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  return {
    // 状态
    currentProposal,
    loading,
    error,
    
    // 计算属性
    statusInfo,
    visibleModules,
    
    // 动作
    loadProposal,
    updateReportData,
    updateModuleVisibility,
    submitForApproval,
    withdrawProposalRequest,
    isModuleVisible,
  };
}); 