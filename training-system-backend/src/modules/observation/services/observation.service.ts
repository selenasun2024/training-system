import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { CreateObservationDto, UpdateObservationDto, ObservationQueryDto, AdminObserveQueryDto } from '../dto/observation.dto';

export interface ObservationTarget {
  projectId: string;
  projectName: string;
  /** 小组信息 */
  groupId?: string;
  groupName?: string;
  traineeId: string;
  traineeName: string;
  /** 学员部门 */
  traineeDepartment?: string;
  counselorId: string;
  status: 'pending' | 'draft' | 'submitted' | 'void';
  draftContent?: string;
  draftTags?: string[];
  record?: {
    id: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface AdminObservationRow {
  id: string;
  date: string;
  counselorName: string;
  counselorId: string;
  studentId: string;
  studentName: string;
  groupId?: string;
  groupName?: string;
  type: 'highlight' | 'improve';
  content: string;
  projectId: string;
}

@Injectable()
export class ObservationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取辅导员的观察目标列表
   * 如果是教务管理员，可以获取任意辅导员的数据
   */
  async getObservationsForCounselor(counselorId: string, requesterId?: string): Promise<ObservationTarget[]> {
    // 开发阶段：如果counselorId是'all'，返回所有辅导员的观察目标
    if (counselorId === 'all') {
      console.log('🔍 开发模式：获取所有辅导员的观察目标');
      return this.getAllObservationTargets();
    }
    
    // 如果提供了请求者ID，检查是否为管理员
    let actualCounselorId = counselorId;
    
    if (requesterId && requesterId !== counselorId) {
      // 检查请求者是否为管理员
      const requesterRoles = await this.prisma.userRole.findMany({
        where: {
          userId: requesterId,
          status: 'ACTIVE'
        },
        select: {
          roleName: true
        }
      });
      
      const isAdmin = requesterRoles.some(role => 
        role.roleName === 'admin'
      );
      
      if (isAdmin) {
        console.log(`管理员 ${requesterId} 访问辅导员 ${counselorId} 的数据`);
        // 管理员可以访问任意辅导员的数据
        actualCounselorId = counselorId;
      } else {
        throw new Error('无权限访问其他辅导员的数据');
      }
    }

    // 查询该辅导员在哪些项目的分组中被设置为LEADER角色
    const counselorGroups = await this.prisma.groupMember.findMany({
      where: {
        userId: actualCounselorId,
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
            }
          }
        }
      }
    });

    // 过滤掉DRAFT状态的项目
    const activeGroups = counselorGroups.filter(g => 
      g.group.project.status === 'ACTIVE' || 
      g.group.project.status === 'APPROVED' || 
      g.group.project.status === 'COMPLETED'
    );

    const targets: ObservationTarget[] = [];

    // 为每个激活的分组获取学员
    for (const counselorGroup of activeGroups) {
      const group = counselorGroup.group;
      const projectId = group.project.id;
      const projectName = group.project.name;

      console.log(`处理项目 ${projectName} (${projectId}) 中的分组 ${group.name}`);

      // 获取该分组中的所有学员成员（排除辅导员自己）
      const groupMembers = await this.prisma.groupMember.findMany({
        where: {
          groupId: group.id,
          userId: {
            not: actualCounselorId // 排除辅导员自己
          },
          role: 'MEMBER' // 只获取普通成员，不包括其他LEADER
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              department: true
            }
          }
        }
      });

      console.log(`分组 ${group.name} 中的学员成员数量: ${groupMembers.length}`);

      // 过滤出那些在项目中角色是 'STUDENT' 的成员
      const memberUserIds = groupMembers.map(member => member.userId);
      const students = await this.prisma.projectParticipant.findMany({
        where: {
          projectId: projectId,
          userId: {
            in: memberUserIds
          },
          role: 'STUDENT'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              department: true
            }
          }
        }
      });

      console.log(`分组 ${group.name} 中的学员数量: ${students.length}`);

      // 为每个学员创建观察目标
      for (const student of students) {
        // 检查是否已有观察记录
        const existingRecord = await this.prisma.observationRecord.findFirst({
          where: {
            projectId: projectId,
            studentId: student.userId,
            observerId: actualCounselorId
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        const target: ObservationTarget = {
          projectId,
          projectName,
          groupId: group.id,
          groupName: group.name,
          traineeId: student.userId,
          traineeName: student.user.name,
          traineeDepartment: student.user.department,
          counselorId: actualCounselorId,
          status: existingRecord ? 'submitted' : 'pending'
        };

        if (existingRecord) {
          target.record = {
            id: existingRecord.id,
            content: existingRecord.content,
            tags: Array.isArray(existingRecord.tags) ? existingRecord.tags as string[] : [],
            createdAt: existingRecord.createdAt.toISOString(),
            updatedAt: existingRecord.updatedAt.toISOString()
          };
        }

        targets.push(target);
      }
    }

    return targets;
  }

  /**
   * 提交观察记录
   */
  async submitObservation(
    observerId: string,
    target: ObservationTarget,
    content: string,
    tags: string[] = []
  ): Promise<void> {
    // 检查是否已存在记录
    const existingRecord = await this.prisma.observationRecord.findFirst({
      where: {
        projectId: target.projectId,
        studentId: target.traineeId,
        observerId: observerId
      }
    });

    if (existingRecord) {
      // 更新现有记录
      await this.prisma.observationRecord.update({
        where: { id: existingRecord.id },
        data: {
          content,
          tags: tags,
          title: `观察记录 - ${target.traineeName}`,
          type: 'DAILY',
          updatedAt: new Date()
        }
      });
    } else {
      // 创建新记录
      await this.prisma.observationRecord.create({
        data: {
          projectId: target.projectId,
          studentId: target.traineeId,
          observerId: observerId,
          type: 'DAILY',
          title: `观察记录 - ${target.traineeName}`,
          content,
          tags: tags,
          attachments: [],
          visibility: 'TEACHER'
        }
      });
    }
  }

  /**
   * 创建观察记录
   */
  async createObservation(observerId: string, createDto: CreateObservationDto) {
    return await this.prisma.observationRecord.create({
      data: {
        ...createDto,
        observerId,
        attachments: createDto.attachments || [],
        tags: createDto.tags || [],
        visibility: createDto.visibility || 'TEACHER'
      },
      include: {
        project: {
          select: { name: true }
        },
        student: {
          select: { name: true }
        },
        observer: {
          select: { name: true }
        }
      }
    });
  }

  /**
   * 更新观察记录
   */
  async updateObservation(id: string, updateDto: UpdateObservationDto) {
    return await this.prisma.observationRecord.update({
      where: { id },
      data: updateDto,
      include: {
        project: {
          select: { name: true }
        },
        student: {
          select: { name: true }
        },
        observer: {
          select: { name: true }
        }
      }
    });
  }

  /**
   * 删除观察记录
   */
  async deleteObservation(id: string) {
    return await this.prisma.observationRecord.delete({
      where: { id }
    });
  }

  /**
   * 获取观察记录列表
   */
  async getObservations(query: ObservationQueryDto) {
    const { projectId, observerId, studentId, type, dateFrom, dateTo, page = 1, pageSize = 10 } = query;

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (observerId) where.observerId = observerId;
    if (studentId) where.studentId = studentId;
    if (type) where.type = type;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [total, records] = await Promise.all([
      this.prisma.observationRecord.count({ where }),
      this.prisma.observationRecord.findMany({
        where,
        include: {
          project: { select: { name: true } },
          student: { select: { name: true } },
          observer: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      total,
      records,
      page,
      pageSize
    };
  }

  /**
   * 管理员获取观察记录
   */
  async getObservationRecordsForAdmin(
    projectId: string,
    query: AdminObserveQueryDto
  ): Promise<{
    list: AdminObservationRow[];
    total: number;
    stat: { total: number; highlightRate: number; improveRate: number };
  }> {
    const { dateRange, counselorIds, studentIds, groupIds, type } = query;
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;

    const where: any = { projectId };

    // 日期范围过滤
    if (dateRange && dateRange.length === 2) {
      where.createdAt = {
        gte: new Date(dateRange[0]),
        lte: new Date(dateRange[1])
      };
    }

    // 辅导员过滤
    if (counselorIds && counselorIds.length > 0) {
      where.observerId = { in: counselorIds };
    }

    // 学员过滤
    if (studentIds && studentIds.length > 0) {
      where.studentId = { in: studentIds };
    }

         // 类型过滤（基于tags）
    if (type && (type === 'highlight' || type === 'improve')) {
      where.tags = {
        array_contains: [type]
      };
    }

    const [total, records] = await Promise.all([
      this.prisma.observationRecord.count({ where }),
      this.prisma.observationRecord.findMany({
        where,
        include: {
          observer: { select: { name: true } },
          student: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    // 转换为前端需要的格式
    const list: AdminObservationRow[] = records.map(record => {
      const tags = Array.isArray(record.tags) ? record.tags as string[] : [];
      const recordType = tags.includes('highlight') ? 'highlight' : 
                        tags.includes('improve') ? 'improve' : 'highlight';

      return {
        id: record.id,
        date: record.createdAt.toISOString().split('T')[0],
        counselorName: record.observer.name,
        counselorId: record.observerId,
        studentId: record.studentId,
        studentName: record.student.name,
        type: recordType,
        content: record.content,
        projectId: record.projectId
      };
    });

    // 计算统计数据
    const highlightCount = list.filter(r => r.type === 'highlight').length;
    const improveCount = list.filter(r => r.type === 'improve').length;
    const highlightRate = total > 0 ? Math.round((highlightCount / total) * 100) : 0;
    const improveRate = total > 0 ? Math.round((improveCount / total) * 100) : 0;

    return {
      list,
      total,
      stat: {
        total,
        highlightRate,
        improveRate
      }
    };
  }

  /**
   * 获取项目观察统计信息
   */
  async getProjectObservationStats(projectId: string) {
    const [total, highlightCount, improveCount] = await Promise.all([
      this.prisma.observationRecord.count({
        where: { projectId }
      }),
      this.prisma.observationRecord.count({
        where: {
          projectId,
          tags: {
            array_contains: ['highlight']
          }
        }
      }),
      this.prisma.observationRecord.count({
        where: {
          projectId,
          tags: {
            array_contains: ['improve']
          }
        }
      })
    ]);

    return {
      total,
      highlightCount,
      improveCount,
      highlightRate: total > 0 ? Math.round((highlightCount / total) * 100) : 0,
      improveRate: total > 0 ? Math.round((improveCount / total) * 100) : 0
    };
  }

  /**
   * 教务管理员获取所有辅导员的观察数据概览
   * 专为开发阶段和管理员测试使用
   */
  async getAllCounselorsObservationOverview(adminId: string) {
    // 验证管理员权限
    const adminRoles = await this.prisma.userRole.findMany({
      where: {
        userId: adminId,
        status: 'ACTIVE'
      },
      select: {
        roleName: true
      }
    });
    
    const isAdmin = adminRoles.some(role => role.roleName === 'admin');
    if (!isAdmin) {
      throw new Error('仅限教务管理员访问');
    }

    // 获取所有辅导员
    const counselors = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        userRoles: {
          some: {
            roleName: 'counselor',
            status: 'ACTIVE'
          }
        }
      },
      select: {
        id: true,
        name: true,
        username: true,
        department: true
      }
    });

    // 为每个辅导员获取观察数据统计
    const counselorOverviews = await Promise.all(
      counselors.map(async (counselor) => {
        // 获取该辅导员负责的项目数
        const projectCount = await this.prisma.projectParticipant.count({
          where: {
            userId: counselor.id,
            role: 'COUNSELOR'
          }
        });

        // 获取该辅导员的观察记录数
        const observationCount = await this.prisma.observationRecord.count({
          where: {
            observerId: counselor.id
          }
        });

        // 获取该辅导员负责的学员数
        const studentCount = await this.prisma.projectParticipant.count({
          where: {
            project: {
              participants: {
                some: {
                  userId: counselor.id,
                  role: 'COUNSELOR'
                }
              }
            },
            role: 'STUDENT'
          }
        });

        return {
          counselorId: counselor.id,
          counselorName: counselor.name,
          username: counselor.username,
          department: counselor.department,
          projectCount,
          studentCount,
          observationCount,
          lastObservationDate: await this.getLastObservationDate(counselor.id)
        };
      })
    );

    return {
      summary: {
        totalCounselors: counselors.length,
        totalObservations: counselorOverviews.reduce((sum, c) => sum + c.observationCount, 0),
        activeCounselors: counselorOverviews.filter(c => c.observationCount > 0).length
      },
      counselors: counselorOverviews
    };
  }

  /**
   * 获取辅导员最后一次观察的日期
   */
  private async getLastObservationDate(counselorId: string): Promise<string | null> {
    const lastRecord = await this.prisma.observationRecord.findFirst({
      where: {
        observerId: counselorId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        createdAt: true
      }
    });

    return lastRecord ? lastRecord.createdAt.toISOString().split('T')[0] : null;
  }

  /**
   * 开发阶段：获取所有辅导员的观察目标
   * 用于调试和测试，显示所有通过分组选择的辅导员及其对应的学员
   */
  async getAllObservationTargets(): Promise<ObservationTarget[]> {
    console.log('🔍 开始获取所有观察目标...');
    
    // 查询所有活跃项目中的LEADER角色成员（即辅导员）
    const allCounselorGroups = await this.prisma.groupMember.findMany({
      where: {
        role: 'LEADER',
        group: {
          project: {
            status: {
              in: ['ACTIVE', 'APPROVED', 'COMPLETED']
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
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
                role: 'MEMBER' // 只获取学员成员
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    department: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`🔍 找到 ${allCounselorGroups.length} 个辅导员分组关系`);

    const targets: ObservationTarget[] = [];

    // 为每个辅导员-分组关系创建观察目标
    for (const counselorGroup of allCounselorGroups) {
      const { user: counselor, group } = counselorGroup;
      const project = group.project;

      console.log(`🔍 处理辅导员 ${counselor.name} 在项目 ${project.name} 中的分组 ${group.name}`);

      // 获取该分组中的所有学员成员
      for (const memberGroup of group.members) {
        const student = memberGroup.user;
        
        // 检查该学员是否确实是项目参与者且角色为STUDENT
        const isProjectStudent = await this.prisma.projectParticipant.findFirst({
          where: {
            projectId: project.id,
            userId: student.id,
            role: 'STUDENT'
          }
        });

        if (isProjectStudent) {
          // 检查是否已有观察记录
          const existingRecord = await this.prisma.observationRecord.findFirst({
            where: {
              observerId: counselor.id,
              studentId: student.id,
              projectId: project.id
            },
            select: {
              id: true,
              content: true,
              tags: true,
              createdAt: true,
              updatedAt: true
            }
          });

                     const target: ObservationTarget = {
             projectId: project.id,
             projectName: project.name,
             groupId: group.id,
             groupName: group.name,
             traineeId: student.id,
             traineeName: student.name,
             traineeDepartment: student.department,
             counselorId: counselor.id,
             status: existingRecord ? 'submitted' : 'pending',
             record: existingRecord ? {
               id: existingRecord.id,
               content: existingRecord.content,
               tags: Array.isArray(existingRecord.tags) 
                 ? existingRecord.tags.map(tag => String(tag))
                 : [],
               createdAt: existingRecord.createdAt.toISOString(),
               updatedAt: existingRecord.updatedAt.toISOString()
             } : undefined
           };

          targets.push(target);
        }
      }
    }

    console.log(`✅ 生成了 ${targets.length} 个观察目标`);
    return targets;
  }
} 