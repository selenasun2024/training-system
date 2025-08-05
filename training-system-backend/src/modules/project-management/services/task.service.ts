import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from '../dto/task.dto';

export interface TaskForReview {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  reviewerRole: 'counselor' | 'teacher' | 'admin';
  deadline: string;
  submissions: StudentSubmission[];
}

export interface StudentSubmission {
  userId: string;
  userName: string;
  content: string;
  score?: number;
}

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建任务
   */
  async createTask(createTaskDto: CreateTaskDto) {
    console.log('📝 TaskService: 创建任务 - ', createTaskDto);

    // 验证项目是否存在
    const project = await this.prisma.trainingProject.findUnique({
      where: { id: createTaskDto.projectId },
    });

    if (!project) {
      throw new Error('项目不存在');
    }

    // 查找或创建阶段
    let stage;
    
    // 如果stageId等于projectId，说明是简化调用，我们需要找到或创建一个默认阶段
    if (createTaskDto.stageId === createTaskDto.projectId) {
      console.log('📝 TaskService: 检测到简化调用，查找或创建默认阶段');
      
      // 查找项目的第一个DURING阶段
      stage = await this.prisma.trainingStage.findFirst({
        where: { 
          projectId: createTaskDto.projectId,
          type: 'DURING'
        },
      });

      // 如果没有DURING阶段，创建一个
      if (!stage) {
        console.log('📝 TaskService: 创建默认DURING阶段');
        stage = await this.prisma.trainingStage.create({
          data: {
            project: {
              connect: { id: createTaskDto.projectId }
            },
            name: '培训中',
            type: 'DURING',
            description: '默认培训阶段',
            orderIndex: 1,
            status: 'ACTIVE',
            config: {},
          },
        });
        console.log('✅ TaskService: 默认阶段创建成功:', stage.id);
      }
    } else {
      // 正常验证阶段
      stage = await this.prisma.trainingStage.findUnique({
        where: { id: createTaskDto.stageId },
      });

      if (!stage) {
        throw new Error('阶段不存在');
      }
    }

    // 如果没有指定orderIndex，获取当前阶段任务数量作为默认值
    let orderIndex = createTaskDto.orderIndex;
    if (orderIndex === undefined) {
      const taskCount = await this.prisma.trainingTask.count({
        where: {
          stageId: stage.id,
        },
      });
      orderIndex = taskCount;
    }

    console.log('📝 TaskService: 准备创建任务，最终阶段ID:', stage.id);

    // 创建任务
    const task = await this.prisma.trainingTask.create({
      data: {
        projectId: createTaskDto.projectId,
        stageId: stage.id, // 使用实际的阶段ID
        name: createTaskDto.name,
        description: createTaskDto.description,
        type: createTaskDto.type,
        required: createTaskDto.required ?? true,
        orderIndex: orderIndex,
        config: createTaskDto.config || {},
        assignedTo: createTaskDto.assignedTo,
        reviewerRole: createTaskDto.reviewerRole,
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
        estimatedHours: createTaskDto.estimatedHours,
        status: 'PENDING',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    console.log('✅ TaskService: 任务创建成功 - ID:', task.id);
    return task;
  }

  /**
   * 更新任务
   */
  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto) {
    console.log('✏️ TaskService: 更新任务 - ID:', taskId, '数据:', updateTaskDto);

    // 验证任务是否存在
    const existingTask = await this.prisma.trainingTask.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      throw new Error('任务不存在');
    }

    // 更新任务
    const task = await this.prisma.trainingTask.update({
      where: { id: taskId },
      data: {
        ...updateTaskDto,
        updatedAt: new Date(),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    console.log('✅ TaskService: 任务更新成功 - ID:', task.id);
    return task;
  }

  /**
   * 根据角色获取待审核任务列表（基于分组权限模式）
   */
  async getTasksForReview(
    role: 'counselor' | 'teacher' | 'admin',
    projectId?: string,
    counselorId?: string, // 新增：指定辅导员ID
  ): Promise<TaskForReview[]> {
    console.log('🔍 TaskService: 获取待审核任务 - 角色:', role, '项目ID:', projectId, '辅导员ID:', counselorId);

    if (role === 'counselor' && counselorId) {
      // 新的分组权限模式：只获取该辅导员负责分组中学员的任务
      return this.getTasksForCounselorByGroup(counselorId, projectId);
    }

    // 其他角色保持原有逻辑
    const whereCondition: any = {
      reviewerRole: role.toUpperCase(),
      status: 'ACTIVE',
    };

    if (projectId) {
      whereCondition.projectId = projectId;
    }

    const tasks = await this.prisma.trainingTask.findMany({
      where: whereCondition,
      include: {
        project: {
          select: {
            name: true,
          },
        },
        submissions: {
          where: {
            status: 'SUBMITTED',
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('🔍 TaskService: 找到任务数量:', tasks.length);

    const result: TaskForReview[] = tasks
      .filter(task => task.submissions.length > 0)
      .map(task => ({
        id: task.id,
        title: task.name,
        projectId: task.projectId,
        projectName: task.project.name,
        reviewerRole: role,
        deadline: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
        submissions: task.submissions.map(submission => ({
          userId: submission.student.id,
          userName: submission.student.name,
          content: submission.content || '',
          score: submission.score || undefined,
        })),
      }));

    console.log('🔍 TaskService: 转换后的任务数量:', result.length);
    return result;
  }

  /**
   * 获取已批阅的任务列表（基于分组权限模式）
   */
  async getReviewedTasks(
    role: 'counselor' | 'teacher' | 'admin',
    projectId?: string,
    counselorId?: string,
  ): Promise<TaskForReview[]> {
    console.log('🔍 TaskService: 获取已批阅任务 - 角色:', role, '项目ID:', projectId, '辅导员ID:', counselorId);

    if (role === 'counselor' && counselorId) {
      // 新的分组权限模式：只获取该辅导员负责分组中学员的已批阅任务
      return this.getReviewedTasksForCounselorByGroup(counselorId, projectId);
    }

    // 其他角色的已批阅任务逻辑
    const whereCondition: any = {
      reviewerRole: role.toUpperCase(),
      status: 'ACTIVE',
    };

    if (projectId) {
      whereCondition.projectId = projectId;
    }

    const tasks = await this.prisma.trainingTask.findMany({
      where: whereCondition,
      include: {
        project: {
          select: {
            name: true,
          },
        },
        submissions: {
          where: {
            status: 'REVIEWED',
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result: TaskForReview[] = tasks
      .filter(task => task.submissions.length > 0)
      .map(task => ({
        id: task.id,
        title: task.name,
        projectId: task.projectId,
        projectName: task.project.name,
        reviewerRole: role,
        deadline: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
        submissions: task.submissions.map(submission => ({
          userId: submission.student.id,
          userName: submission.student.name,
          content: submission.content || '',
          score: submission.score || undefined,
          feedback: submission.feedback || '',
          reviewedAt: submission.reviewedAt?.toISOString() || '',
        })),
      }));

    console.log('🔍 TaskService: 已批阅任务数量:', result.length);
    return result;
  }

  /**
   * 基于分组权限获取辅导员的批阅任务
   */
  private async getTasksForCounselorByGroup(
    counselorId: string,
    projectId?: string,
  ): Promise<TaskForReview[]> {
    console.log('🔍 TaskService: 基于分组权限获取辅导员批阅任务 - 辅导员ID:', counselorId);

    // 1. 查找该辅导员作为LEADER的分组
    const counselorGroups = await this.prisma.groupMember.findMany({
      where: {
        userId: counselorId,
        role: 'LEADER'
      },
      include: {
        group: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            },
            members: {
              where: {
                role: 'MEMBER' // 获取分组中的学员成员
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`🔍 辅导员 ${counselorId} 负责的分组数量: ${counselorGroups.length}`);

    if (counselorGroups.length === 0) {
      console.log('🔍 该辅导员没有负责任何分组');
      return [];
    }

    // 2. 过滤激活的项目
    const activeGroups = counselorGroups.filter(g => 
      ['ACTIVE', 'APPROVED', 'COMPLETED'].includes(g.group.project.status)
    );

    if (projectId) {
      // 如果指定了项目ID，只获取该项目的分组
      const filteredGroups = activeGroups.filter(g => g.group.project.id === projectId);
      console.log(`🔍 指定项目 ${projectId} 中的分组数量: ${filteredGroups.length}`);
    }

    const targetGroups = projectId 
      ? activeGroups.filter(g => g.group.project.id === projectId)
      : activeGroups;

    // 3. 收集所有负责的学员ID和项目ID
    const studentIds = new Set<string>();
    const responsibleProjectIds = new Set<string>();

    for (const counselorGroup of targetGroups) {
      responsibleProjectIds.add(counselorGroup.group.project.id);
      
      // 验证分组成员确实是项目中的学员
      for (const member of counselorGroup.group.members) {
        const isProjectStudent = await this.prisma.projectParticipant.findFirst({
          where: {
            projectId: counselorGroup.group.project.id,
            userId: member.userId,
            role: 'STUDENT',
            status: 'ACTIVE'
          }
        });

        if (isProjectStudent) {
          studentIds.add(member.userId);
        }
      }
    }

    console.log(`🔍 负责的学员数量: ${studentIds.size}`);
    console.log(`🔍 负责的项目数量: ${responsibleProjectIds.size}`);

    if (studentIds.size === 0) {
      console.log('🔍 没有找到负责的学员');
      return [];
    }

    // 4. 查找这些学员提交的作业任务
    const tasks = await this.prisma.trainingTask.findMany({
      where: {
        projectId: { in: Array.from(responsibleProjectIds) },
        type: 'homework', // 只获取作业类型
        status: { in: ['ACTIVE', 'PENDING'] }, // 支持ACTIVE和PENDING状态的任务
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        submissions: {
          where: {
            status: 'SUBMITTED',
            studentId: { in: Array.from(studentIds) } // 只获取负责学员的提交
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('🔍 TaskService: 找到的任务数量:', tasks.length);

    // 5. 转换为前端期望的格式
    const result: TaskForReview[] = tasks
      .filter(task => task.submissions.length > 0) // 只返回有提交内容的任务
      .map(task => ({
        id: task.id,
        title: task.name,
        projectId: task.projectId,
        projectName: task.project.name,
        reviewerRole: 'counselor',
        deadline: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
        submissions: task.submissions.map(submission => ({
          userId: submission.student.id,
          userName: submission.student.name,
          content: submission.content || '',
          score: submission.score || undefined,
        })),
      }));

    console.log('🔍 TaskService: 基于分组权限的任务数量:', result.length);
    return result;
  }

  /**
   * 获取已批阅的任务列表（基于分组权限模式）
   */
  private async getReviewedTasksForCounselorByGroup(
    counselorId: string,
    projectId?: string,
  ): Promise<TaskForReview[]> {
    console.log('🔍 TaskService: 基于分组权限获取辅导员已批阅任务 - 辅导员ID:', counselorId);

    // 1. 查找该辅导员作为LEADER的分组
    const counselorGroups = await this.prisma.groupMember.findMany({
      where: {
        userId: counselorId,
        role: 'LEADER'
      },
      include: {
        group: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            },
            members: {
              where: {
                role: 'MEMBER' // 获取分组中的学员成员
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`🔍 辅导员 ${counselorId} 负责的分组数量: ${counselorGroups.length}`);

    if (counselorGroups.length === 0) {
      console.log('🔍 该辅导员没有负责任何分组');
      return [];
    }

    // 2. 过滤激活的项目
    const activeGroups = counselorGroups.filter(g => 
      ['ACTIVE', 'APPROVED', 'COMPLETED'].includes(g.group.project.status)
    );

    if (projectId) {
      // 如果指定了项目ID，只获取该项目的分组
      const filteredGroups = activeGroups.filter(g => g.group.project.id === projectId);
      console.log(`🔍 指定项目 ${projectId} 中的分组数量: ${filteredGroups.length}`);
    }

    const targetGroups = projectId 
      ? activeGroups.filter(g => g.group.project.id === projectId)
      : activeGroups;

    // 3. 收集所有负责的学员ID和项目ID
    const studentIds = new Set<string>();
    const responsibleProjectIds = new Set<string>();

    for (const counselorGroup of targetGroups) {
      responsibleProjectIds.add(counselorGroup.group.project.id);
      
      // 验证分组成员确实是项目中的学员
      for (const member of counselorGroup.group.members) {
        const isProjectStudent = await this.prisma.projectParticipant.findFirst({
          where: {
            projectId: counselorGroup.group.project.id,
            userId: member.userId,
            role: 'STUDENT',
            status: 'ACTIVE'
          }
        });

        if (isProjectStudent) {
          studentIds.add(member.userId);
        }
      }
    }

    console.log(`🔍 负责的学员数量: ${studentIds.size}`);
    console.log(`🔍 负责的项目数量: ${responsibleProjectIds.size}`);

    if (studentIds.size === 0) {
      console.log('🔍 没有找到负责的学员');
      return [];
    }

    // 4. 查找这些学员提交的作业任务
    const tasks = await this.prisma.trainingTask.findMany({
      where: {
        projectId: { in: Array.from(responsibleProjectIds) },
        type: 'homework', // 只获取作业类型
        status: { in: ['ACTIVE', 'PENDING'] }, // 支持ACTIVE和PENDING状态的任务
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        submissions: {
          where: {
            status: 'REVIEWED',
            studentId: { in: Array.from(studentIds) } // 只获取负责学员的提交
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('🔍 TaskService: 找到的任务数量:', tasks.length);

    // 5. 转换为前端期望的格式
    const result: TaskForReview[] = tasks
      .filter(task => task.submissions.length > 0) // 只返回有提交内容的任务
      .map(task => ({
        id: task.id,
        title: task.name,
        projectId: task.projectId,
        projectName: task.project.name,
        reviewerRole: 'counselor',
        deadline: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
        submissions: task.submissions.map(submission => ({
          userId: submission.student.id,
          userName: submission.student.name,
          content: submission.content || '',
          score: submission.score || undefined,
        })),
      }));

    console.log('🔍 TaskService: 基于分组权限的任务数量:', result.length);
    return result;
  }

  /**
   * 学生提交作业
   */
  async submitTask(taskId: string, studentId: string, content: string, filePaths: string[] = []) {
    console.log('📝 TaskService: 学生提交作业 - 任务ID:', taskId, '学生ID:', studentId);

    // 验证任务是否存在
    const task = await this.prisma.trainingTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('任务不存在');
    }

    // 验证学生是否存在
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('学生不存在');
    }

    // 检查是否已经提交过
    const existingSubmission = await this.prisma.taskSubmission.findUnique({
      where: {
        taskId_studentId: {
          taskId: taskId,
          studentId: studentId,
        },
      },
    });

    if (existingSubmission) {
      // 如果已提交但还未批阅，允许更新
      if (existingSubmission.status === 'SUBMITTED') {
        const updatedSubmission = await this.prisma.taskSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            content: content,
            filePaths: filePaths,
            submittedAt: new Date(),
          },
        });
        console.log('✅ TaskService: 作业重新提交成功');
        return updatedSubmission;
      } else {
        throw new Error('作业已经被批阅，无法重新提交');
      }
    }

    // 创建新的提交记录
    const submission = await this.prisma.taskSubmission.create({
      data: {
        taskId: taskId,
        studentId: studentId,
        content: content,
        filePaths: filePaths,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    console.log('✅ TaskService: 作业提交成功 - 提交ID:', submission.id);
    return submission;
  }

  /**
   * 提交任务评分
   */
  async submitScore(
    taskId: string,
    userId: string,
    score: number,
    feedback?: string,
  ): Promise<void> {
    console.log('📝 TaskService: 提交评分 - 任务ID:', taskId, '学员ID:', userId, '分数:', score);

    // 验证任务是否存在
    const task = await this.prisma.trainingTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('任务不存在');
    }

    // 查找对应的提交记录
    const submission = await this.prisma.taskSubmission.findUnique({
      where: {
        taskId_studentId: {
          taskId: taskId,
          studentId: userId,
        },
      },
    });

    if (!submission) {
      throw new Error('学员提交记录不存在');
    }

    if (submission.status !== 'SUBMITTED') {
      throw new Error('该提交尚未提交或已经评阅过');
    }

    // 更新提交记录的评分信息
    await this.prisma.taskSubmission.update({
      where: {
        id: submission.id,
      },
      data: {
        score: score,
        feedback: feedback,
        status: 'REVIEWED',
        reviewedAt: new Date(),
        // TODO: 后续添加当前用户ID作为reviewer
        // reviewerId: currentUserId,
      },
    });

    console.log('✅ TaskService: 评分提交成功');
  }

  /**
   * 获取任务详情
   */
  async getTaskDetail(taskId: string) {
    console.log('🔍 TaskService: 获取任务详情 - 任务ID:', taskId);

    const task = await this.prisma.trainingTask.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                department: true,
              },
            },
            reviewer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new Error('任务不存在');
    }

    return {
      id: task.id,
      name: task.name,
      description: task.description,
      type: task.type,
      status: task.status,
      reviewerRole: task.reviewerRole,
      dueDate: task.dueDate,
      project: task.project,
      stage: task.stage,
      submissions: task.submissions.map(submission => ({
        id: submission.id,
        content: submission.content,
        score: submission.score,
        feedback: submission.feedback,
        status: submission.status,
        submittedAt: submission.submittedAt,
        reviewedAt: submission.reviewedAt,
        student: submission.student,
        reviewer: submission.reviewer,
      })),
    };
  }

  /**
   * 获取学生的作业任务列表
   */
  async getStudentTasks(userId: string) {
    console.log('📝 TaskService: 获取学生作业任务 - 学生ID:', userId);
    
    // 查找学员参与的项目
    const participations = await this.prisma.projectParticipant.findMany({
      where: { 
        userId: userId,
        status: 'ACTIVE',
        role: 'STUDENT'
      },
      include: {
        project: {
          include: {
            tasks: {
              where: {
                type: 'homework' // 只获取作业类型的任务
              },
              include: {
                stage: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  }
                }
              },
              orderBy: [
                { dueDate: 'asc' },
                { createdAt: 'desc' }
              ]
            }
          }
        }
      }
    });

    // 提取所有作业任务
    const tasks = [];
    for (const participation of participations) {
      for (const task of participation.project.tasks) {
        // 检查学员是否有提交记录
        const submission = await this.prisma.taskSubmission.findFirst({
          where: {
            taskId: task.id,
            studentId: userId
          }
        });

        tasks.push({
          id: task.id,
          title: task.name,
          description: task.description,
          projectId: participation.project.id,
          projectName: participation.project.name,
          dueDate: task.dueDate,
          status: submission ? 'completed' : 'pending',
          score: submission?.score,
          submittedAt: submission?.submittedAt,
          submission: submission ? {
            content: submission.content,
            attachments: submission.filePaths,
            feedback: submission.feedback
          } : null
        });
      }
    }

    console.log('✅ TaskService: 学生任务列表获取成功，任务数量:', tasks.length);
    return tasks;
  }

  /**
   * 删除任务
   */
  async deleteTask(id: string, currentUserId: string) {
    console.log('🗑️ TaskService: 删除任务 - 任务ID:', id);

    // 检查任务是否存在
    const task = await this.prisma.trainingTask.findUnique({
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

    if (!task) {
      throw new Error('任务不存在');
    }

    // 检查项目状态
    if (task.project.status === 'COMPLETED') {
      throw new Error('已完成的项目中的任务不能删除');
    }

    // 🔧 暂时放宽权限检查，专注于核心功能调试
    // TODO: 后续根据需求启用严格的权限控制
    // if (task.project.ownerId !== currentUserId) {
    //   throw new Error('只有项目负责人可以删除任务');
    // }

    // 删除任务（级联删除提交记录）
    await this.prisma.trainingTask.delete({
      where: { id },
    });

    console.log('✅ TaskService: 任务删除成功');
    return { message: '任务删除成功' };
  }
}