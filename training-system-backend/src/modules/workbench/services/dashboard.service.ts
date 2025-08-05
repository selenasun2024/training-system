import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';

export interface DashboardQueryDto {
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取管理员工作台数据
   */
  async getAdminDashboard(userId: string, query: DashboardQueryDto) {
    const { dateFrom, dateTo, projectId } = query;

    // 构建时间过滤条件
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    // 项目过滤条件
    const projectFilter: any = {};
    if (projectId) {
      projectFilter.id = projectId;
    }

    // 获取总体统计数据
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalUsers,
      recentProjects,
      projectStats,
      taskStats,
    ] = await Promise.all([
      // 总项目数
      this.prisma.trainingProject.count({
        where: projectFilter,
      }),

      // 活跃项目数
      this.prisma.trainingProject.count({
        where: {
          ...projectFilter,
          status: 'ACTIVE',
        },
      }),

      // 已完成项目数
      this.prisma.trainingProject.count({
        where: {
          ...projectFilter,
          status: 'COMPLETED',
        },
      }),

      // 总用户数
      this.prisma.user.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      // 最近项目
      this.prisma.trainingProject.findMany({
        where: {
          ...projectFilter,
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              name: true,
              department: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              participants: true,
            },
          },
        },
      }),

      // 项目状态统计
      this.prisma.trainingProject.groupBy({
        by: ['status'],
        where: projectFilter,
        _count: {
          status: true,
        },
      }),

      // 任务统计
      this.prisma.trainingTask.groupBy({
        by: ['status'],
        where: {
          ...(projectId && { projectId }),
        },
        _count: {
          status: true,
        },
      }),
    ]);

    // 获取我负责的项目
    const myProjects = await this.prisma.trainingProject.findMany({
      where: {
        ownerId: userId,
        ...projectFilter,
      },
      include: {
        _count: {
          select: {
            tasks: true,
            participants: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 获取待办任务
    const pendingTasks = await this.prisma.trainingTask.findMany({
      where: {
        status: 'PENDING',
        ...(projectId && { projectId }),
      },
      include: {
        project: {
          select: {
            name: true,
            status: true,
          },
        },
        stage: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      overview: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalUsers,
      },
      charts: {
        projectStatus: projectStats.map(stat => ({
          status: stat.status,
          count: stat._count.status,
        })),
        taskStatus: taskStats.map(stat => ({
          status: stat.status,
          count: stat._count.status,
        })),
      },
      recentProjects: recentProjects.map(project => ({
        ...project,
        ownerName: project.owner.name,
        ownerDepartment: project.owner.department,
        taskCount: project._count.tasks,
        participantCount: project._count.participants,
      })),
      myProjects: myProjects.map(project => ({
        ...project,
        taskCount: project._count.tasks,
        participantCount: project._count.participants,
      })),
      pendingTasks,
    };
  }

  /**
   * 获取辅导员工作台数据
   */
  async getCounselorDashboard(userId: string, query: DashboardQueryDto) {
    const { dateFrom, dateTo, projectId } = query;

    // 构建时间过滤条件
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    // 获取我参与的项目
    const participatingProjects = await this.prisma.projectParticipant.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        ...(projectId && { projectId }),
      },
      include: {
        project: {
          include: {
            owner: {
              select: {
                name: true,
                department: true,
              },
            },
            _count: {
              select: {
                tasks: true,
                participants: true,
              },
            },
          },
        },
      },
    });

    // 获取我的观察记录任务
    const observationTasks = await this.prisma.observationRecord.findMany({
      where: {
        observerId: userId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
        ...(projectId && { projectId }),
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        student: {
          select: {
            name: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 获取需要审核的任务
    const tasksToReview = await this.prisma.trainingTask.findMany({
      where: {
        reviewerRole: 'COUNSELOR',
        status: 'ACTIVE',
        ...(projectId && { projectId }),
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        stage: {
          select: {
            name: true,
            type: true,
          },
        },
        submissions: {
          where: {
            status: 'SUBMITTED',
          },
          include: {
            student: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 获取学员统计数据
    const students = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        userRoles: {
          some: {
            roleName: 'student',
            status: 'ACTIVE',
            revokedAt: null,
          },
        },
      },
      select: {
        department: true,
      },
    });

    // 手动聚合数据
    const studentStats = students.reduce((acc, student) => {
      const dept = student.department || '未分配';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const studentStatsList = Object.entries(studentStats).map(([department, count]) => ({
      department,
      _count: { department: count },
    }));

    // 获取我的项目任务统计
    const projectIds = participatingProjects.map(p => p.projectId);
    const taskStats = await this.prisma.trainingTask.groupBy({
      by: ['status'],
      where: {
        projectId: {
          in: projectIds,
        },
      },
      _count: {
        status: true,
      },
    });

    return {
      overview: {
        participatingProjects: participatingProjects.length,
        observationRecords: observationTasks.length,
        tasksToReview: tasksToReview.reduce((sum, task) => sum + task.submissions.length, 0),
        totalStudents: studentStatsList.reduce((sum, stat) => sum + stat._count.department, 0),
      },
      charts: {
        taskStatus: taskStats.map(stat => ({
          status: stat.status,
          count: stat._count.status,
        })),
        studentsByDepartment: studentStatsList.map(stat => ({
          department: stat.department || '未分配',
          count: stat._count.department,
        })),
      },
      participatingProjects: participatingProjects.map(p => ({
        ...p.project,
        role: p.role,
        ownerName: p.project.owner.name,
        ownerDepartment: p.project.owner.department,
        taskCount: p.project._count.tasks,
        participantCount: p.project._count.participants,
      })),
      recentObservations: observationTasks.map(obs => ({
        ...obs,
        projectName: obs.project.name,
        studentName: obs.student.name,
        studentDepartment: obs.student.department,
      })),
      tasksToReview: tasksToReview.map(task => ({
        ...task,
        projectName: task.project.name,
        stageName: task.stage.name,
        pendingSubmissions: task.submissions.length,
        submissions: task.submissions.map(sub => ({
          ...sub,
          studentName: sub.student.name,
        })),
      })),
    };
  }

  /**
   * 获取项目列表（用于工作台筛选）
   */
  async getProjectsForDashboard(userId: string) {
    // 首先获取用户作为辅导员的项目（通过GroupMember表）
    const counselorGroups = await this.prisma.groupMember.findMany({
      where: {
        userId,
        role: 'LEADER', // 辅导员角色
      },
      include: {
        group: {
          select: {
            projectId: true,
          },
        },
      },
    });
    
    const counselorProjectIds = counselorGroups.map(group => group.group.projectId);
    
    // 然后获取所有相关项目
    const projects = await this.prisma.trainingProject.findMany({
      where: {
        OR: [
          { ownerId: userId }, // 用户拥有的项目
          {
            participants: { // 通过ProjectParticipant表参与的项目
              some: {
                userId,
                status: 'ACTIVE',
              },
            },
          },
          {
            id: { // 通过GroupMember作为辅导员参与的项目
              in: counselorProjectIds,
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        projectNo: true,
        status: true,
        currentStage: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return projects;
  }

  /**
   * 获取用户快速统计数据
   */
  async getQuickStats(userId: string) {
    const [
      ownedProjects,
      participatingProjects,
      pendingTasks,
      observationRecords,
    ] = await Promise.all([
      this.prisma.trainingProject.count({
        where: { ownerId: userId },
      }),
      this.prisma.projectParticipant.count({
        where: {
          userId,
          status: 'ACTIVE',
        },
      }),
      this.prisma.trainingTask.count({
        where: {
          assignedTo: userId,
          status: 'PENDING',
        },
      }),
      this.prisma.observationRecord.count({
        where: { observerId: userId },
      }),
    ]);

    return {
      ownedProjects,
      participatingProjects,
      pendingTasks,
      observationRecords,
    };
  }
} 