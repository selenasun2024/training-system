import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';

export interface CreateProjectDto {
  name: string;
  description?: string;
  type: string; // 项目类型ID，必填
  estimatedDuration?: number;
  startDate?: string;
  endDate?: string;
  config?: any;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'PLANNING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  currentStage?: 'BEFORE' | 'DURING' | 'AFTER';
  estimatedDuration?: number;
  startDate?: string;
  endDate?: string;
  config?: any;
}

export interface ProjectQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'DRAFT' | 'PLANNING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  ownerId?: string;
  stage?: 'BEFORE' | 'DURING' | 'AFTER';
}

export interface CreateStageDto {
  name: string;
  type: 'BEFORE' | 'DURING' | 'AFTER';
  description?: string;
  estimatedDuration?: number;
  startDate?: string;
  endDate?: string;
  config?: any;
}

export interface UpdateStageDto {
  name?: string;
  description?: string;
  status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  estimatedDuration?: number;
  startDate?: string;
  endDate?: string;
  config?: any;
}

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建培训项目
   */
  async createProject(createDto: CreateProjectDto, ownerId: string) {
    // 生成项目编号
    const projectNo = await this.generateProjectNo();

    const project = await this.prisma.trainingProject.create({
      data: {
        projectNo,
        name: createDto.name,
        description: createDto.description,
        type: createDto.type,
        ownerId: ownerId,
        estimatedDuration: createDto.estimatedDuration,
        startDate: createDto.startDate ? new Date(createDto.startDate) : null,
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
        config: createDto.config || {},
        status: 'DRAFT',
        currentStage: 'BEFORE',
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
        stages: true,
      },
    });

    // 自动创建默认阶段
    await this.createDefaultStages(project.id);

    // 🔧 新增：同步分组数据到数据库
    if (createDto.config && createDto.config.groups && Array.isArray(createDto.config.groups)) {
      console.log('🔧 创建项目时同步分组数据到数据库...');
      await this.syncGroupsToDatabase(project.id, createDto.config.groups);
    }

    return this.getProjectById(project.id);
  }

  /**
   * 获取项目列表
   */
  async getProjects(query: ProjectQueryDto, currentUserId: string) {
    const { page = 1, limit = 10, search, status, ownerId, stage } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { projectNo: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (stage) {
      where.currentStage = stage;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    // 🔧 暂时禁用权限过滤：根据项目管理后端设计，暂时不启用用户权限控制
    // TODO: 后续根据需求启用用户权限控制
    // where.OR = [
    //   { ownerId: currentUserId },
    //   { 
    //     participants: {
    //       some: {
    //         userId: currentUserId,
    //         status: 'ACTIVE',
    //       },
    //     },
    //   },
    // ];

    const [projects, total] = await Promise.all([
      this.prisma.trainingProject.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              department: true,
            },
          },
          stages: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
            },
            orderBy: { orderIndex: 'asc' },
          },
          participants: {
            where: { status: 'ACTIVE' },
            select: {
              role: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.trainingProject.count({ where }),
    ]);

    return {
      projects: projects.map(project => ({
        ...project,
        taskCount: project._count.tasks,
        participantCount: project.participants.length,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 根据ID获取项目详情
   */
  async getProjectById(id: string) {
    const project = await this.prisma.trainingProject.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true,
          },
        },
        stages: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            status: true,
            orderIndex: true,
            estimatedDuration: true,
            startDate: true,
            endDate: true,
            config: true,
            _count: {
              select: {
                tasks: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        participants: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            role: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                department: true,
                position: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            resources: true,
            budgetLines: true,
            meetings: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    return {
      ...project,
      statistics: {
        taskCount: project._count.tasks,
        resourceCount: project._count.resources,
        budgetLineCount: project._count.budgetLines,
        meetingCount: project._count.meetings,
        participantCount: project.participants.length,
      },
    };
  }

  /**
   * 更新项目信息
   */
  async updateProject(id: string, updateDto: UpdateProjectDto, currentUserId: string) {
    // 🔍 添加议程数据调试日志
    if (updateDto.config && updateDto.config.agenda) {
      console.log('🔍 后端接收到的议程数据:', JSON.stringify(updateDto.config.agenda, null, 2));
      console.log('🔍 议程天数:', updateDto.config.agenda.days?.length || 0);
      if (updateDto.config.agenda.days) {
        updateDto.config.agenda.days.forEach((day: any, index: number) => {
          console.log(`🔍 第${index + 1}天 - 日期: ${day.date}, 议程项: ${day.items?.length || 0}`);
        });
      }
    }

    const project = await this.prisma.trainingProject.findUnique({
      where: { id },
      select: { ownerId: true, status: true, config: true },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 权限检查：只有项目所有者可以更新项目
    // 🔧 暂时禁用权限检查，专注于核心功能调试
    // if (project.ownerId !== currentUserId) {
    //   throw new ForbiddenException('只有项目负责人可以修改项目信息');
    // }

    // 状态验证
    if (updateDto.status && project.status === 'COMPLETED') {
      throw new BadRequestException('已完成的项目不能修改');
    }

    // 🔧 智能合并 config 配置
    let mergedConfig = (project.config as any) || {};
    
    if (updateDto.config) {
      console.log('🔧 合并前的config:', JSON.stringify(mergedConfig, null, 2));
      console.log('🔧 前端传来的config:', JSON.stringify(updateDto.config, null, 2));
      console.log('🔧 🎯 检查division字段:', {
        '前端有division': !!updateDto.config.division,
        '前端division内容': updateDto.config.division,
        '原有division': mergedConfig.division
      });
      console.log('🔧 🔍 前端传来的项目类型:', updateDto.config.type, '(类型:', typeof updateDto.config.type, ')');
      
      // 智能合并策略：
      // 1. 保留后端的系统配置（enabledModules, workflows）
      // 2. 更新前端的基本信息配置（type, target, location等）
      // 3. 更新前端的UI配置（enableGroupChat, enableFullPlan等）
      
      const systemConfig = {
        enabledModules: mergedConfig.enabledModules || {},
        workflows: mergedConfig.workflows || {},
      };
      
      const frontendConfig = updateDto.config as any;
      
      // 构建合并后的配置
      mergedConfig = {
        // 保留系统配置
        ...systemConfig,
        // 基本信息配置 - 修复：使用严格的字段存在性检查而不是逻辑OR
        type: frontendConfig.hasOwnProperty('type') ? frontendConfig.type : mergedConfig.type,
        target: frontendConfig.hasOwnProperty('target') ? frontendConfig.target : mergedConfig.target,
        org: frontendConfig.hasOwnProperty('org') ? frontendConfig.org : mergedConfig.org,
        owner: frontendConfig.hasOwnProperty('owner') ? frontendConfig.owner : mergedConfig.owner,
        location: frontendConfig.hasOwnProperty('location') ? frontendConfig.location : mergedConfig.location,
        goal: frontendConfig.hasOwnProperty('goal') ? frontendConfig.goal : mergedConfig.goal,
        remark: frontendConfig.hasOwnProperty('remark') ? frontendConfig.remark : mergedConfig.remark,
        // UI功能配置
        enableGroupChat: frontendConfig.enableGroupChat !== undefined ? frontendConfig.enableGroupChat : mergedConfig.enableGroupChat,
        enableFullPlan: frontendConfig.enableFullPlan !== undefined ? frontendConfig.enableFullPlan : mergedConfig.enableFullPlan,
        enableAgenda: frontendConfig.enableAgenda !== undefined ? frontendConfig.enableAgenda : mergedConfig.enableAgenda,
        enableResource: frontendConfig.enableResource !== undefined ? frontendConfig.enableResource : mergedConfig.enableResource,
        enableBudget: frontendConfig.enableBudget !== undefined ? frontendConfig.enableBudget : mergedConfig.enableBudget,
        enableDivision: frontendConfig.enableDivision !== undefined ? frontendConfig.enableDivision : mergedConfig.enableDivision,
        approver: frontendConfig.approver !== undefined ? frontendConfig.approver : mergedConfig.approver,
        // 议程数据 - 修复：使用严格的字段存在性检查
        agenda: frontendConfig.hasOwnProperty('agenda') ? frontendConfig.agenda : mergedConfig.agenda,
        // 🔧 新增：分工数据处理
        division: frontendConfig.hasOwnProperty('division') ? frontendConfig.division : mergedConfig.division,
        // 其他前端配置
        ...Object.keys(frontendConfig).reduce((acc, key) => {
          if (!['type', 'target', 'org', 'owner', 'location', 'goal', 'remark', 
                'enableGroupChat', 'enableFullPlan', 'enableAgenda', 'enableResource', 
                'enableBudget', 'enableDivision', 'agenda'].includes(key)) {
            acc[key] = frontendConfig[key];
          }
          return acc;
        }, {} as any),
      };
      
      console.log('🔧 合并后的config:', JSON.stringify(mergedConfig, null, 2));
      console.log('🔧 🔍 合并后的项目类型:', mergedConfig.type, '(类型:', typeof mergedConfig.type, ')');
      console.log('🔧 🎯 合并后的division:', {
        '有division': !!mergedConfig.division,
        'division内容': mergedConfig.division,
        '角色数量': mergedConfig.division?.roles?.length || 0,
        '任务数量': mergedConfig.division?.tasks?.length || 0
      });
    }

    // 🔍 在保存前最终检查将要保存的数据
    const dataToSave = {
      ...updateDto,
      config: mergedConfig,
      startDate: updateDto.startDate ? new Date(updateDto.startDate) : undefined,
      endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
    };
    console.log('🔧 📀 即将保存到数据库的完整数据:', JSON.stringify(dataToSave, null, 2));
    console.log('🔧 📀 即将保存的config.type:', dataToSave.config?.type);

    const updatedProject = await this.prisma.trainingProject.update({
      where: { id },
      data: dataToSave,
    });

    // 🔧 新增：同步分组数据到数据库
    if (mergedConfig.groups && Array.isArray(mergedConfig.groups)) {
      console.log('🔧 开始同步分组数据到数据库...');
      await this.syncGroupsToDatabase(id, mergedConfig.groups);
    }

    // 🔍 验证保存后的数据
    const savedProject = await this.prisma.trainingProject.findUnique({
      where: { id },
      select: { config: true },
    });
    
    if (savedProject?.config && typeof savedProject.config === 'object') {
      console.log('🔍 数据库中保存的完整config:', JSON.stringify(savedProject.config, null, 2));
      const configData = savedProject.config as any;
      console.log('🔍 培训类型 (保存后):', configData.type, '(类型:', typeof configData.type, ')');
      console.log('🔍 培训对象 (保存后):', configData.target, '(类型:', typeof configData.target, ')');
      console.log('🔍 🎯 分工数据 (保存后):', {
        '有division': !!configData.division,
        'division类型': typeof configData.division,
        '角色数量': configData.division?.roles?.length || 0,
        '任务数量': configData.division?.tasks?.length || 0,
        'division内容': configData.division
      });
      console.log('🔍 功能配置保留情况:', {
        enabledModules: !!configData.enabledModules,
        workflows: !!configData.workflows,
        enableGroupChat: configData.enableGroupChat,
        enableFullPlan: configData.enableFullPlan,
      });
    }

    return this.getProjectById(updatedProject.id);
  }

  /**
   * 发布项目（将项目状态从DRAFT改为ACTIVE）
   */
  async publishProject(id: string, currentUserId: string) {
    const project = await this.prisma.trainingProject.findUnique({
      where: { id },
      select: { 
        ownerId: true, 
        status: true, 
        name: true,
        participants: {
          where: { 
            status: 'ACTIVE'
          },
          select: { 
            userId: true,
            role: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    console.log('🔍 项目发布验证 - 项目信息:', {
      name: project.name,
      status: project.status,
      participantCount: project.participants.length,
      participants: project.participants.map(p => ({ name: p.user.name, role: p.role }))
    });

    // 权限检查：只有项目所有者可以发布项目
    // 🔧 暂时禁用权限检查，专注于核心功能调试
    // if (project.ownerId !== currentUserId) {
    //   throw new ForbiddenException('只有项目负责人可以发布项目');
    // }

    // 状态验证：只有草稿状态的项目可以发布
    if (project.status !== 'DRAFT') {
      throw new BadRequestException(`项目状态为"${project.status}"，只有草稿状态的项目可以发布`);
    }

    // 🔧 放宽业务规则：项目可以没有参与者也能发布
    // 只进行友好提醒，不阻止发布
    if (project.participants.length === 0) {
      console.log('⚠️ 项目没有参与者，但仍允许发布');
    } else {
      const teacherOrCounselorCount = project.participants.filter(p => 
        p.role === 'TEACHER' || p.role === 'COUNSELOR'
      ).length;
      
      if (teacherOrCounselorCount === 0) {
        console.log('⚠️ 项目没有教师或辅导员参与者，但仍允许发布');
        console.log('ℹ️ 当前参与者角色:', project.participants.map(p => p.role).join(', '));
      }
    }

    // 更新项目状态
    const updatedProject = await this.prisma.trainingProject.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        currentStage: 'DURING',
        updatedAt: new Date(),
      },
    });

    console.log(`✅ 项目 "${project.name}" 已发布，状态：${project.status} -> ${updatedProject.status}`);
    if (project.participants.length > 0) {
      console.log(`✅ 发布时的参与者：`, project.participants.map(p => `${p.user.name}(${p.role})`).join(', '));
    }

    return this.getProjectById(updatedProject.id);
  }

  /**
   * 删除项目
   */
  async deleteProject(id: string, currentUserId: string) {
    const project = await this.prisma.trainingProject.findUnique({
      where: { id },
      select: { ownerId: true, status: true },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 🔧 暂时放宽权限检查，专注于核心功能调试
    // TODO: 后续根据需求启用严格的权限控制
    // if (project.ownerId !== currentUserId) {
    //   throw new ForbiddenException('只有项目负责人可以删除项目');
    // }

    // 🔧 放宽状态限制，允许删除更多状态的项目用于调试
    if (project.status === 'COMPLETED') {
      throw new BadRequestException('已完成的项目不能删除');
    }

    await this.prisma.trainingProject.delete({
      where: { id },
    });

    return { message: '项目删除成功' };
  }

  /**
   * 为项目创建阶段
   */
  async createStage(projectId: string, createDto: CreateStageDto, currentUserId: string) {
    const project = await this.prisma.trainingProject.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 🔧 暂时放宽权限检查，专注于核心功能调试
    // TODO: 后续根据需求启用严格的权限控制
    // if (project.ownerId !== currentUserId) {
    //   throw new ForbiddenException('只有项目负责人可以创建阶段');
    // }

    // 获取同类型阶段的最大排序号
    const maxOrderStage = await this.prisma.trainingStage.findFirst({
      where: {
        projectId,
        type: createDto.type,
      },
      orderBy: { orderIndex: 'desc' },
    });

    const stage = await this.prisma.trainingStage.create({
      data: {
        projectId,
        name: createDto.name,
        type: createDto.type,
        description: createDto.description,
        orderIndex: (maxOrderStage?.orderIndex || 0) + 1,
        estimatedDuration: createDto.estimatedDuration,
        startDate: createDto.startDate ? new Date(createDto.startDate) : null,
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
        config: createDto.config || {},
      },
    });

    return stage;
  }

  /**
   * 获取项目的所有阶段
   */
  async getProjectStages(projectId: string) {
    const stages = await this.prisma.trainingStage.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { orderIndex: 'asc' },
      ],
    });

    return stages.map(stage => ({
      ...stage,
      taskCount: stage._count.tasks,
    }));
  }

  /**
   * 生成项目编号
   */
  private async generateProjectNo(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const prefix = `TP${year}${month}`;

    // 查找当月最大编号
    const lastProject = await this.prisma.trainingProject.findFirst({
      where: {
        projectNo: {
          startsWith: prefix,
        },
      },
      orderBy: { projectNo: 'desc' },
    });

    let sequence = 1;
    if (lastProject) {
      const lastSequence = parseInt(lastProject.projectNo.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * 创建默认阶段 - 🔧 修改：只创建一个阶段"阶段一"
   */
  private async createDefaultStages(projectId: string) {
    const defaultStages = [
      {
        name: '阶段一',
        type: 'DURING' as const,
        description: '默认培训阶段',
        orderIndex: 1,
      },
    ];

    await this.prisma.trainingStage.createMany({
      data: defaultStages.map(stage => ({
        ...stage,
        projectId,
        config: {},
      })),
    });
  }

  /**
   * 根据ID获取阶段详情
   */
  async getStageById(id: string) {
    const stage = await this.prisma.trainingStage.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!stage) {
      throw new NotFoundException('阶段不存在');
    }

    return {
      ...stage,
      taskCount: stage._count.tasks,
    };
  }

  /**
   * 更新阶段
   */
  async updateStage(id: string, updateDto: UpdateStageDto, currentUserId: string) {
    const stage = await this.prisma.trainingStage.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            ownerId: true,
            status: true,
          },
        },
      },
    });

    if (!stage) {
      throw new NotFoundException('阶段不存在');
    }

    // 🔧 暂时放宽权限检查，专注于核心功能调试
    // TODO: 后续根据需求启用严格的权限控制
    // if (stage.project.ownerId !== currentUserId) {
    //   throw new ForbiddenException('只有项目负责人可以更新阶段');
    // }

    // 检查项目状态
    if (stage.project.status === 'COMPLETED') {
      throw new BadRequestException('已完成的项目不能修改阶段');
    }

    // 准备更新数据
    const updateData: any = {};
    
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;
    if (updateDto.estimatedDuration !== undefined) updateData.estimatedDuration = updateDto.estimatedDuration;
    if (updateDto.startDate !== undefined) updateData.startDate = updateDto.startDate ? new Date(updateDto.startDate) : null;
    if (updateDto.endDate !== undefined) updateData.endDate = updateDto.endDate ? new Date(updateDto.endDate) : null;
    if (updateDto.config !== undefined) updateData.config = updateDto.config;

    const updatedStage = await this.prisma.trainingStage.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return {
      ...updatedStage,
      taskCount: updatedStage._count.tasks,
    };
  }

  /**
   * 删除阶段
   */
  async deleteStage(id: string, currentUserId: string) {
    const stage = await this.prisma.trainingStage.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            ownerId: true,
            status: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!stage) {
      throw new NotFoundException('阶段不存在');
    }

    // 🔧 暂时放宽权限检查，专注于核心功能调试
    // TODO: 后续根据需求启用严格的权限控制
    // if (stage.project.ownerId !== currentUserId) {
    //   throw new ForbiddenException('只有项目负责人可以删除阶段');
    // }

    // 检查项目状态
    if (stage.project.status === 'COMPLETED') {
      throw new BadRequestException('已完成的项目不能删除阶段');
    }

    // 检查阶段状态
    if (stage.status === 'ACTIVE' || stage.status === 'COMPLETED') {
      throw new BadRequestException('活跃或已完成的阶段不能删除');
    }

    // 🔧 修复：支持级联删除 - 先删除阶段中的所有任务，再删除阶段
    if (stage._count.tasks > 0) {
      console.log(`⚠️ 阶段包含 ${stage._count.tasks} 个任务，将先删除所有任务`);
      
      // 先删除阶段中的所有任务
      await this.prisma.trainingTask.deleteMany({
        where: { stageId: id },
      });
      
      console.log('✅ 阶段中的所有任务已删除');
    }

    // 删除阶段
    await this.prisma.trainingStage.delete({
      where: { id },
    });

    return { message: '阶段删除成功' };
  }

  /**
   * 完成阶段
   */
  async completeStage(id: string, notes?: string, currentUserId?: string) {
    const stage = await this.prisma.trainingStage.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            ownerId: true,
            status: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!stage) {
      throw new NotFoundException('阶段不存在');
    }

    // 🔧 暂时放宽权限检查，专注于核心功能调试
    // TODO: 后续根据需求启用严格的权限控制
    // if (stage.project.ownerId !== currentUserId) {
    //   throw new ForbiddenException('只有项目负责人可以完成阶段');
    // }

    // 检查阶段状态
    if (stage.status === 'COMPLETED') {
      throw new BadRequestException('阶段已经完成');
    }

    if (stage.status === 'CANCELLED') {
      throw new BadRequestException('已取消的阶段不能完成');
    }

    // 检查所有任务是否已完成
    const incompleteTasks = stage.tasks.filter(task => task.status !== 'COMPLETED' && task.status !== 'CANCELLED');
    if (incompleteTasks.length > 0) {
      throw new BadRequestException(`该阶段还有 ${incompleteTasks.length} 个未完成的任务，不能完成阶段`);
    }

    const updatedStage = await this.prisma.trainingStage.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
        config: {
          ...(stage.config as any),
          completedAt: new Date().toISOString(),
          completedBy: currentUserId,
          completionNotes: notes,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return {
      ...updatedStage,
      taskCount: updatedStage._count.tasks,
    };
  }

  /**
   * 重新激活阶段
   */
  async reactivateStage(id: string, notes?: string, currentUserId?: string) {
    const stage = await this.prisma.trainingStage.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            ownerId: true,
            status: true,
          },
        },
      },
    });

    if (!stage) {
      throw new NotFoundException('阶段不存在');
    }

    // 🔧 暂时放宽权限检查，专注于核心功能调试
    // TODO: 后续根据需求启用严格的权限控制
    // if (stage.project.ownerId !== currentUserId) {
    //   throw new ForbiddenException('只有项目负责人可以重新激活阶段');
    // }

    // 检查阶段状态
    if (stage.status === 'ACTIVE') {
      throw new BadRequestException('阶段已经是活跃状态');
    }

    if (stage.status === 'PENDING') {
      throw new BadRequestException('待处理的阶段不需要重新激活');
    }

    const updatedStage = await this.prisma.trainingStage.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        config: {
          ...(stage.config as any),
          reactivatedAt: new Date().toISOString(),
          reactivatedBy: currentUserId,
          reactivationNotes: notes,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return {
      ...updatedStage,
      taskCount: updatedStage._count.tasks,
    };
  }

  /**
   * 获取阶段的所有任务
   */
  async getStageTasks(stageId: string) {
    const stage = await this.prisma.trainingStage.findUnique({
      where: { id: stageId },
      select: { id: true },
    });

    if (!stage) {
      throw new NotFoundException('阶段不存在');
    }

    const tasks = await this.prisma.trainingTask.findMany({
      where: { stageId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return tasks.map(task => ({
      ...task,
      submissionCount: task._count.submissions,
    }));
  }

  /**
   * 获取项目参与者列表
   */
  async getProjectParticipants(projectId: string) {
    const project = await this.prisma.trainingProject.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    const participants = await this.prisma.projectParticipant.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            department: true,
            position: true,
            level: true,
            hireDate: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return participants;
  }

  /**
   * 添加项目参与者
   */
  async addProjectParticipant(
    projectId: string, 
    data: {
      userId: string;
      role: 'OWNER' | 'TEACHER' | 'COUNSELOR' | 'STUDENT' | 'OBSERVER';
      notes?: string;
    }, 
    currentUserId: string
  ) {
    const project = await this.prisma.trainingProject.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查是否已经是参与者
    const existingParticipant = await this.prisma.projectParticipant.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: data.userId,
        },
      },
    });

    if (existingParticipant) {
      throw new BadRequestException('该用户已经是项目参与者');
    }

    const participant = await this.prisma.projectParticipant.create({
      data: {
        projectId,
        userId: data.userId,
        role: data.role,
        status: 'ACTIVE',
        notes: data.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            department: true,
            position: true,
            level: true,
            hireDate: true,
          },
        },
      },
    });

    return participant;
  }

  /**
   * 移除项目参与者
   */
  async removeProjectParticipant(projectId: string, userId: string, currentUserId: string) {
    const project = await this.prisma.trainingProject.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    const participant = await this.prisma.projectParticipant.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('参与者不存在');
    }

    // 不允许移除项目所有者
    if (userId === project.ownerId) {
      throw new BadRequestException('不能移除项目所有者');
    }

    await this.prisma.projectParticipant.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return { message: '参与者移除成功' };
  }

  /**
   * 更新项目参与者信息
   */
  async updateProjectParticipant(
    projectId: string, 
    userId: string, 
    data: {
      role?: 'OWNER' | 'TEACHER' | 'COUNSELOR' | 'STUDENT' | 'OBSERVER';
      status?: 'active' | 'inactive' | 'completed' | 'dropped';
      notes?: string;
    }, 
    currentUserId: string
  ) {
    const project = await this.prisma.trainingProject.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    const participant = await this.prisma.projectParticipant.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('参与者不存在');
    }

    // 不允许修改项目所有者的角色
    if (userId === project.ownerId && data.role && data.role !== 'OWNER') {
      throw new BadRequestException('不能修改项目所有者的角色');
    }

    const updatedParticipant = await this.prisma.projectParticipant.update({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      data: {
        role: data.role,
        status: data.status?.toUpperCase() as any,
        notes: data.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            department: true,
            position: true,
            level: true,
            hireDate: true,
          },
        },
      },
    });

    return updatedParticipant;
  }

  /**
   * 同步分组数据到数据库
   */
  private async syncGroupsToDatabase(projectId: string, groupsData: any[]) {
    console.log('🔧 同步分组数据到数据库:', projectId, groupsData);
    
    try {
      // 1. 删除项目的现有分组和分组成员
      await this.prisma.groupMember.deleteMany({
        where: {
          group: {
            projectId: projectId
          }
        }
      });
      
      await this.prisma.trainingGroup.deleteMany({
        where: { projectId: projectId }
      });
      
      console.log('🔧 清理现有分组数据完成');
      
      // 2. 创建新的分组和分组成员
      for (const groupData of groupsData) {
        console.log('🔧 处理分组:', groupData.name);
        
        // 创建分组
        const group = await this.prisma.trainingGroup.create({
          data: {
            name: groupData.name,
            description: `项目分组 - ${groupData.name}`,
            projectId: projectId
          }
        });
        
        console.log('🔧 创建分组成功:', group.id);
        
        // 添加辅导员（如果存在）
        if (groupData.counselorId) {
          console.log('🔧 添加辅导员:', groupData.counselorId);
          await this.prisma.groupMember.create({
            data: {
              userId: groupData.counselorId,
              groupId: group.id,
              role: 'LEADER'
            }
          });
          
          // 确保辅导员也在项目参与者中
          await this.ensureProjectParticipant(projectId, groupData.counselorId, 'COUNSELOR');
        }
        
        // 添加学员
        if (groupData.students && Array.isArray(groupData.students)) {
          console.log('🔧 添加学员数量:', groupData.students.length);
          for (const student of groupData.students) {
            await this.prisma.groupMember.create({
              data: {
                userId: student.id,
                groupId: group.id,
                role: 'MEMBER'
              }
            });
            
            // 确保学员也在项目参与者中
            await this.ensureProjectParticipant(projectId, student.id, 'STUDENT');
          }
        }
      }
      
      console.log('🔧 分组数据同步完成');
      
    } catch (error) {
      console.error('❌ 同步分组数据失败:', error);
      throw error;
    }
  }

  /**
   * 确保用户在项目参与者中
   */
  private async ensureProjectParticipant(projectId: string, userId: string, role: 'COUNSELOR' | 'STUDENT') {
    const existingParticipant = await this.prisma.projectParticipant.findUnique({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: userId
        }
      }
    });
    
    if (!existingParticipant) {
      console.log('🔧 添加项目参与者:', userId, role);
      await this.prisma.projectParticipant.create({
        data: {
          projectId: projectId,
          userId: userId,
          role: role,
          status: 'ACTIVE'
        }
      });
    }
  }
} 