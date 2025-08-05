import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';

@Injectable()
export class MentorshipRelationshipService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search,
        department,
        status,
        trainingType,
        projectId
      } = query;

      console.log('🔍 MentorshipRelationshipService: 查询师徒关系汇总', { query });

      // 构建查询条件
      const where: any = {};

      // 默认排除已终止的师徒关系
      where.status = { not: 'TERMINATED' };

      // 搜索条件：导师或学员姓名
      if (search) {
        where.OR = [
          { mentorName: { contains: search } },
          { studentName: { contains: search } }
        ];
      }

      // 状态筛选：将前端状态映射为数据库状态
      if (status) {
        const statusMapping: Record<string, string> = {
          'active': 'ACTIVE',
          'graduated': 'COMPLETED', // 已出师
          'pending': 'ACTIVE', // 未出师（仍在进行中）
          'paused': 'PAUSED',
          'terminated': 'TERMINATED'
        };
        // 如果明确指定状态，则覆盖默认的排除逻辑
        where.status = statusMapping[status] || status.toUpperCase();
      }

      // 如果指定了项目ID（培训项目ID）
      if (projectId) {
        where.projectId = projectId;
      }

      // 查询师徒关系总数
      const total = await this.prisma.mentorshipRelationship.count({ where });

      // 查询师徒关系
      const relationships = await this.prisma.mentorshipRelationship.findMany({
        where,
        include: {
          mentor: {
            select: { 
              id: true, 
              name: true, 
              department: true, 
              position: true
            }
          },
          student: {
            select: { 
              id: true, 
              name: true, 
              department: true, 
              position: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize)
      });

      console.log(`📊 查询到师徒关系 ${relationships.length} 条，总计 ${total} 条`);

      // 获取所有相关的项目ID，查询培训项目信息
      const projectIds = [...new Set(relationships.map(r => r.projectId))];
      console.log('🔍 师徒关系中的项目ID:', projectIds.slice(0, 5), `(共${projectIds.length}个)`);
      
      // 先尝试直接查询培训项目
      let trainingProjects = await this.prisma.trainingProject.findMany({
        where: {
          id: { in: projectIds }
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true
        }
      });

      console.log('📋 直接匹配的培训项目:', trainingProjects.length, '个');

      let projectMap = new Map(trainingProjects.map(p => [p.id, p]));

      // 如果直接匹配不到，尝试通过mentorship_projects表查找
      if (trainingProjects.length === 0 && projectIds.length > 0) {
        console.log('🔄 尝试通过mentorship_projects表查找项目映射...');
        
        const mentorshipProjects = await this.prisma.mentorshipProject.findMany({
          where: {
            id: { in: projectIds }
          },
          select: {
            id: true,
            sourceTrainingProjectId: true
          }
        });

        console.log('📋 找到的mentorship_projects:', mentorshipProjects.length, '个');

        if (mentorshipProjects.length > 0) {
          const sourceProjectIds = [...new Set(mentorshipProjects.map(mp => mp.sourceTrainingProjectId).filter(Boolean))];
          console.log('🎯 源培训项目ID:', sourceProjectIds);

          const sourceTrainingProjects = await this.prisma.trainingProject.findMany({
            where: {
              id: { in: sourceProjectIds }
            },
            select: {
              id: true,
              name: true,
              type: true,
              status: true
            }
          });

          console.log('📋 找到的源培训项目:', sourceTrainingProjects.length, '个');

          // 重新构建项目映射：mentorshipProject.id -> trainingProject
          const mentorshipProjectMap = new Map(mentorshipProjects.map(mp => [mp.id, mp]));
          const sourceProjectMap = new Map(sourceTrainingProjects.map(tp => [tp.id, tp]));

          projectMap = new Map();
          for (const [mpId, mp] of mentorshipProjectMap) {
            const sourceProject = sourceProjectMap.get(mp.sourceTrainingProjectId);
            if (sourceProject) {
              projectMap.set(mpId, sourceProject);
            }
          }

          console.log('🔗 最终项目映射:', projectMap.size, '个');
        }
      }

      // 获取阶段信息（针对阶段指派）
      const phaseIds = [...new Set(relationships.map(r => r.phaseId).filter(Boolean))];
      const phases = await this.prisma.trainingStage.findMany({
        where: {
          id: { in: phaseIds }
        },
        select: {
          id: true,
          name: true
        }
      });

      const phaseMap = new Map(phases.map(p => [p.id, p]));

      // 转换数据格式
      const formattedRelationships = relationships.map(rel => {
        const trainingProject = projectMap.get(rel.projectId);
        const phase = rel.phaseId ? phaseMap.get(rel.phaseId) : null;

        // 状态映射：数据库状态 -> 前端显示
        const statusMapping: Record<string, { text: string; type: string }> = {
          'ACTIVE': { text: '未出师', type: 'warning' },
          'COMPLETED': { text: '已出师', type: 'success' },
          'PAUSED': { text: '暂停', type: 'info' },
          'TERMINATED': { text: '已终止', type: 'danger' }
        };

        const statusInfo = statusMapping[rel.status] || { text: rel.status, type: 'info' };

        return {
          id: rel.id,
          mentorInfo: {
            id: rel.mentorId,
            name: rel.mentorName,
            department: rel.mentor?.department || '未知部门',
            position: rel.mentor?.position || ''
          },
          studentInfo: {
            id: rel.studentId,
            name: rel.studentName,
            department: rel.student?.department || '未知部门',
            position: rel.student?.position || ''
          },
          project: {
            id: trainingProject?.id,
            name: trainingProject?.name || '未知项目',
            type: trainingProject?.type || '其他'
          },
          relationType: phase ? `阶段指派 - ${phase.name}` : this.getRelationTypeText(rel.scope),
          establishedDate: rel.establishedDate,
          status: rel.status,
          statusText: statusInfo.text,
          statusType: statusInfo.type,
          progress: this.calculateProgress(rel),
          phase: phase ? phase.name : null,
          phaseId: rel.phaseId
        };
      });

      // 部门筛选（在前端格式化后进行）
      let filteredRelationships = formattedRelationships;
      if (department) {
        filteredRelationships = formattedRelationships.filter(rel => 
          rel.mentorInfo.department === department || 
          rel.studentInfo.department === department
        );
      }

      // 培训类型筛选
      if (trainingType) {
        filteredRelationships = filteredRelationships.filter(rel => 
          rel.project.type === trainingType
        );
      }

      // 获取统计信息
      const stats = await this.getRelationshipStats(where);

      console.log('✅ 师徒关系查询成功', { 
        返回数量: filteredRelationships.length, 
        总数: total,
        页码: page, 
        页大小: pageSize 
      });

      return {
        code: 200,
        data: {
          relationships: filteredRelationships,
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            total,
            totalPages: Math.ceil(total / Number(pageSize))
          },
          stats
        },
        message: '获取师徒关系列表成功'
      };

    } catch (error) {
      console.error('❌ 查询师徒关系失败:', error);
      throw new Error(`查询师徒关系失败: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      const relationship = await this.prisma.mentorshipRelationship.findUnique({
        where: { id },
        include: {
          mentor: {
            select: { 
              id: true, 
              name: true, 
              department: true, 
              position: true,
              email: true
            }
          },
          student: {
            select: { 
              id: true, 
              name: true, 
              department: true, 
              position: true,
              email: true
            }
          }
        }
      });

      if (!relationship) {
        return {
          code: 404,
          message: '师徒关系不存在'
        };
      }

      return {
        code: 200,
        data: relationship,
        message: '获取师徒关系详情成功'
      };
    } catch (error) {
      console.error('❌ 获取师徒关系详情失败:', error);
      throw new Error(`获取师徒关系详情失败: ${error.message}`);
    }
  }

  async create(createDto: any) {
    return { code: 201, data: { id: `rel-${Date.now()}`, ...createDto }, message: '师徒关系创建成功' };
  }

  async update(id: string, updateDto: any) {
    return { code: 200, data: { id, ...updateDto }, message: '师徒关系更新成功' };
  }

  async remove(id: string) {
    return { code: 200, message: '师徒关系删除成功' };
  }

  /**
   * 获取关系类型文本
   */
  private getRelationTypeText(scope: string): string {
    const scopeMapping: Record<string, string> = {
      'PROJECT_WIDE': '项目范围',
      'SPECIFIC_PHASE': '阶段指派',
      'FULL_PROCESS': '全程指导',
      'DEPARTMENT_LEVEL': '部门级别'
    };
    return scopeMapping[scope] || scope;
  }

  /**
   * 计算师徒关系进度
   */
  private calculateProgress(relationship: any): number {
    // 基于关系状态计算进度
    switch (relationship.status) {
      case 'COMPLETED':
        return 100;
      case 'ACTIVE':
        // 可以基于时间或里程碑计算进度
        const now = new Date();
        const start = new Date(relationship.establishedDate);
        const expectedDuration = relationship.expectedDuration || 90; // 默认90天
        const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return Math.min(Math.floor((daysPassed / expectedDuration) * 100), 95);
      case 'PAUSED':
        return relationship.actualDuration ? Math.floor((relationship.actualDuration / (relationship.expectedDuration || 90)) * 100) : 0;
      case 'TERMINATED':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * 获取师徒关系统计信息
   */
  private async getRelationshipStats(where: any) {
    try {
      const [
        totalCount,
        activeCount,
        completedCount,
        pausedCount,
        terminatedCount
      ] = await Promise.all([
        this.prisma.mentorshipRelationship.count({ where }),
        this.prisma.mentorshipRelationship.count({ where: { ...where, status: 'ACTIVE' } }),
        this.prisma.mentorshipRelationship.count({ where: { ...where, status: 'COMPLETED' } }),
        this.prisma.mentorshipRelationship.count({ where: { ...where, status: 'PAUSED' } }),
        this.prisma.mentorshipRelationship.count({ where: { ...where, status: 'TERMINATED' } })
      ]);

      return {
        total: totalCount,
        active: activeCount,
        completed: completedCount,
        paused: pausedCount,
        terminated: terminatedCount,
        graduationRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      };
    } catch (error) {
      console.error('❌ 获取统计信息失败:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        paused: 0,
        terminated: 0,
        graduationRate: 0
      };
    }
  }
} 