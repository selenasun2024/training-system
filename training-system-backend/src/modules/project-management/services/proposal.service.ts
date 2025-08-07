import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { LoggerService } from '../../../shared/infrastructure/logger/logger.service';
import { WriteOperation, ReadOperation } from '../../../shared/decorators/database-operation.decorator';
import {
  CreateProposalDto,
  UpdateProposalDto,
  SubmitProposalDto,
  ApprovalActionDto,
  ProposalQueryDto,
  ProposalStatus,
  ApprovalStepStatus,
} from '../dto/proposal.dto';

@Injectable()
export class ProposalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService
  ) {}

  /**
   * 创建方案
   */
  @WriteOperation('创建项目方案', ['projectProposal'])
  async createProposal(createDto: CreateProposalDto, createdBy: string) {
    this.logger.info('创建项目方案', { title: createDto.title, projectId: createDto.projectId });

    // 检查项目是否存在
    const project = await this.prisma.trainingProject.findUnique({
      where: { id: createDto.projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 检查是否已有方案
    const existingProposal = await this.prisma.projectProposal.findFirst({
      where: { projectId: createDto.projectId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNo: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        approvalSteps: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (existingProposal) {
      this.logger.info('找到现有方案', { proposalId: existingProposal.id });
      
      // 如果现有方案已经提交或审批中，不允许重复创建/提交
      if (existingProposal.status !== 'DRAFT' && existingProposal.status !== 'REJECTED') {
        this.logger.warn('现有方案状态不允许重新提交', { status: existingProposal.status });
      }
      
      return existingProposal;
    }

    // 创建方案
    const proposal = await this.prisma.projectProposal.create({
      data: {
        projectId: createDto.projectId,
        title: createDto.title,
        description: createDto.description,
        status: 'DRAFT', // 确保新方案的默认状态是草稿
        content: createDto.content || {},
        reportConfig: createDto.reportConfig || this.getDefaultReportConfig(),
        createdBy,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNo: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        approvalSteps: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // 创建默认审批流程
    await this.createDefaultApprovalSteps(proposal.id);

    this.logger.info('方案创建成功', { proposalId: proposal.id });
    return proposal;
  }

  /**
   * 获取项目方案
   */
  async getProjectProposal(projectId: string) {
    console.log('🔍 获取项目方案:', projectId);

    const proposal = await this.prisma.projectProposal.findFirst({
      where: { projectId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNo: true,
            status: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        approvalSteps: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!proposal) {
      console.log('❌ 项目方案不存在');
      return null;
    }

    // 获取报告数据
    const reportData = await this.generateReportData(projectId);

    const result = {
      ...proposal,
      reportData,
    };

    console.log('✅ 项目方案获取成功');
    return result;
  }

  /**
   * 更新方案
   */
  async updateProposal(id: string, updateDto: UpdateProposalDto) {
    console.log('🔄 更新方案:', id, updateDto);

    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new NotFoundException('方案不存在');
    }

    // 检查状态是否允许更新
    if (proposal.status !== 'DRAFT' && proposal.status !== 'REJECTED') {
      throw new BadRequestException('只有草稿状态或被拒绝的方案才能修改');
    }

    const updatedProposal = await this.prisma.projectProposal.update({
      where: { id },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNo: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        approvalSteps: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log('✅ 方案更新成功');
    return updatedProposal;
  }

  /**
   * 提交方案审批
   */
  async submitProposal(id: string, submitDto: SubmitProposalDto, submittedBy: string) {
    console.log('🔄 提交方案审批:', id);

    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new NotFoundException('方案不存在');
    }

    if (proposal.status !== 'DRAFT' && proposal.status !== 'REJECTED') {
      throw new BadRequestException('只有草稿状态或被拒绝的方案才能提交');
    }

    // 更新方案状态
    const updatedProposal = await this.prisma.projectProposal.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedBy,
      },
    });

    // 重置审批流程状态
    await this.prisma.proposalApproval.updateMany({
      where: { proposalId: id },
      data: {
        status: 'PENDING',
        comments: null,
        approvedAt: null,
      },
    });

    console.log('✅ 方案提交成功');
    return updatedProposal;
  }

  /**
   * 撤回方案
   */
  async withdrawProposal(id: string) {
    console.log('🔄 撤回方案:', id);

    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new NotFoundException('方案不存在');
    }

    if (proposal.status !== 'SUBMITTED' && proposal.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('只有已提交或审核中的方案才能撤回');
    }

    const updatedProposal = await this.prisma.projectProposal.update({
      where: { id },
      data: {
        status: 'DRAFT',
        submittedAt: null,
        submittedBy: null,
      },
    });

    console.log('✅ 方案撤回成功');
    return updatedProposal;
  }

  /**
   * 方案审批操作
   */
  async approveOrRejectProposal(
    proposalId: string,
    stepId: string,
    action: ApprovalActionDto,
    approverId: string,
  ) {
    console.log('🔄 方案审批操作:', { proposalId, stepId, action, approverId });

    const proposal = await this.prisma.projectProposal.findUnique({
      where: { id: proposalId },
      include: {
        approvalSteps: true,
      },
    });

    if (!proposal) {
      throw new NotFoundException('方案不存在');
    }

    if (proposal.status !== 'SUBMITTED' && proposal.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('只有已提交或审核中的方案才能审批');
    }

    // 查找审批步骤
    const approvalStep = await this.prisma.proposalApproval.findFirst({
      where: {
        proposalId,
        stepId,
      },
    });

    if (!approvalStep) {
      throw new NotFoundException('审批步骤不存在');
    }

    // 更新审批步骤
    await this.prisma.proposalApproval.update({
      where: { id: approvalStep.id },
      data: {
        status: action.action,
        comments: action.comments,
        approverId,
        approvedAt: new Date(),
      },
    });

    // 检查整体审批状态
    const allSteps = await this.prisma.proposalApproval.findMany({
      where: { proposalId },
      orderBy: { createdAt: 'asc' },
    });

    let newProposalStatus: any = 'UNDER_REVIEW';

    // 如果有步骤被拒绝，整个方案被拒绝
    if (allSteps.some(step => step.status === 'REJECTED')) {
      newProposalStatus = 'REJECTED';
    }
    // 如果所有步骤都通过，方案通过
    else if (allSteps.every(step => step.status === 'APPROVED')) {
      newProposalStatus = 'APPROVED';
    }

    // 更新方案状态
    const updateData: any = { status: newProposalStatus };
    if (newProposalStatus === 'APPROVED') {
      updateData.approvedAt = new Date();
    } else if (newProposalStatus === 'REJECTED') {
      updateData.rejectedAt = new Date();
    }

    await this.prisma.projectProposal.update({
      where: { id: proposalId },
      data: updateData,
    });

    console.log('✅ 审批操作完成，新状态:', newProposalStatus);
    return { status: newProposalStatus };
  }

  /**
   * 获取项目方案版本历史
   */
  async getProposalVersionHistory(projectId: string) {
    console.log('🔍 获取项目方案版本历史:', projectId);

    const proposals = await this.prisma.projectProposal.findMany({
      where: { 
        projectId,
        submittedAt: {
          not: null
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        submitter: {
          select: {
            id: true,
            name: true,
          },
        },
        approvalSteps: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: [
        { submittedAt: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    console.log(`✅ 找到 ${proposals.length} 个版本历史记录`);
    return proposals;
  }

  /**
   * 获取方案列表
   */
  async getProposals(query: ProposalQueryDto) {
    const { status, projectId, search, page = '1', limit = '10' } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const whereCondition: any = {};

    if (status) {
      whereCondition.status = status;
    }

    if (projectId) {
      whereCondition.projectId = projectId;
    }

    if (search) {
      whereCondition.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [proposals, total] = await Promise.all([
      this.prisma.projectProposal.findMany({
        where: whereCondition,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              projectNo: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.projectProposal.count({ where: whereCondition }),
    ]);

    return {
      proposals,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    };
  }

  /**
   * 创建默认审批流程
   */
  private async createDefaultApprovalSteps(proposalId: string) {
    const defaultSteps = [
      {
        stepId: 'dept_manager',
        stepName: '部门经理审批',
        approverRole: 'DEPT_MANAGER',
      },
      {
        stepId: 'hrbp',
        stepName: 'HRBP审核',
        approverRole: 'HRBP',
      },
      {
        stepId: 'leader',
        stepName: '分管领导终审',
        approverRole: 'LEADER',
      },
    ];

    await this.prisma.proposalApproval.createMany({
      data: defaultSteps.map(step => ({
        proposalId,
        ...step,
      })),
    });
  }

  /**
   * 获取默认报告配置
   */
  private getDefaultReportConfig() {
    return {
      modules: [
        { id: 'overview', label: '项目概览', visible: true, required: true },
        { id: 'audience', label: '培训对象与分组', visible: true, required: true },
        { id: 'agenda', label: '议程安排', visible: true, required: false },
        { id: 'budget', label: '预算明细', visible: true, required: false },
        { id: 'resources', label: '核心资源与分工', visible: true, required: false },
      ],
    };
  }

  /**
   * 生成报告数据
   */
  private async generateReportData(projectId: string) {
    // 获取项目基础信息
    const project = await this.prisma.trainingProject.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: { name: true },
        },
      },
    });

    // 获取议程数据（模拟）
    const agenda = [
      { time: '2024-07-10 09:00-12:00', activity: '启动会 & 破冰活动' },
      { time: '2024-07-10 14:00-17:00', activity: '核心课程一：领导力基础' },
      { time: '2024-07-11 09:00-12:00', activity: '实战演练与讨论' },
      { time: '2024-07-11 14:00-16:00', activity: '结业典礼与总结' },
    ];

    // 获取预算数据
    const budgetLines = await this.prisma.budgetLine.findMany({
      where: { projectId },
    });

    const budget = budgetLines.map(line => ({
      category: line.category,
      item: line.item,
      amount: Number(line.budgetAmount),
    }));

    // 获取分组数据
    const groups = await this.prisma.trainingGroup.findMany({
      where: { projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const groupsData = groups.map(group => ({
      groupName: group.name,
      members: group.members.map(m => m.user.name).join(', '),
      leader: group.members.find(m => m.role === 'LEADER')?.user.name || '未指定',
    }));

    return {
      overview: {
        projectName: project?.name,
        projectNo: project?.projectNo,
        owner: project?.owner?.name,
        status: project?.status,
      },
      agenda,
      budget,
      groups: groupsData,
    };
  }
} 