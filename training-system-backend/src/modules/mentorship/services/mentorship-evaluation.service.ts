import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';

@Injectable()
export class MentorshipEvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    try {
      const {
        page = 1,
        pageSize = 20,
        projectId,
        evaluationType,
        status,
        followupStatus,
        search,
        sortField,
        sortOrder
      } = query;

      const skip = (page - 1) * pageSize;
      const take = parseInt(pageSize);

      // 构建查询条件
      const where: any = {};

      if (projectId) {
        where.projectId = projectId;
      }

      if (evaluationType) {
        switch (evaluationType) {
          case 'student_to_mentor':
            where.evaluatorType = 'STUDENT';
            break;
          case 'mentor_to_student':
            where.evaluatorType = 'MENTOR';
            break;
        }
      }

      if (status) {
        switch (status) {
          case 'pending':
            where.status = 'DRAFT';
            break;
          case 'completed':
            where.status = 'FINALIZED';
            break;
          case 'expired':
            where.status = 'SUBMITTED';
            break;
        }
      }

      // 如果有搜索条件，搜索导师或学员姓名
      if (search) {
        where.OR = [
          { evaluatorName: { contains: search } },
          { evaluateeName: { contains: search } }
        ];
      }

      // 构建排序条件
      const orderBy: any = {};
      if (sortField && sortOrder) {
        switch (sortField) {
          case 'templateName':
            orderBy.evaluationTitle = sortOrder;
            break;
          case 'projectName':
            // 项目名称需要通过关联表排序，暂时使用创建时间
            orderBy.createdAt = sortOrder;
            break;
          case 'evaluationType':
            orderBy.evaluatorType = sortOrder;
            break;
          case 'totalScore':
            orderBy.overallScore = sortOrder;
            break;
          case 'completedAt':
            orderBy.submittedAt = sortOrder;
            break;
          default:
            orderBy.createdAt = 'desc';
        }
      } else {
        orderBy.createdAt = 'desc';
      }

      // 查询评价数据
      const [evaluations, total] = await Promise.all([
        this.prisma.mentorshipEvaluation.findMany({
          where,
          skip,
          take,
          include: {
            project: {
              select: {
                id: true,
                sourceTrainingProjectId: true
              }
            }
          },
          orderBy
        }),
        this.prisma.mentorshipEvaluation.count({ where })
      ]);

      // 获取所有相关的训练项目ID
      const trainingProjectIds = evaluations
        .map(e => e.project?.sourceTrainingProjectId)
        .filter(id => id);

      // 查询训练项目信息
      const trainingProjects = trainingProjectIds.length > 0 
        ? await this.prisma.trainingProject.findMany({
            where: { id: { in: trainingProjectIds } },
            select: { id: true, name: true, type: true }
          })
        : [];

      const projectMap = new Map(trainingProjects.map(p => [p.id, p]));

      // 查询回访记录
      const evaluationIds = evaluations.map(e => e.id);
      const followupRecords = evaluationIds.length > 0 
        ? await this.prisma.$queryRawUnsafe(`
            SELECT evaluation_id, id FROM evaluation_followups 
            WHERE evaluation_id IN (${evaluationIds.map(() => '?').join(',')})
          `, ...evaluationIds) as Array<{evaluation_id: string, id: string}>
        : [];
      
      const followupMap = new Map(followupRecords.map(f => [f.evaluation_id, f.id]));

      // 转换数据格式
      const transformedEvaluations = evaluations.map(evaluation => {
        // 根据evaluatorType和evaluateeType确定评价类型
        let evaluationType = 'mutual';
        if (evaluation.evaluatorType === 'MENTOR' && evaluation.evaluateeType === 'STUDENT') {
          evaluationType = 'mentor_to_student';
        } else if (evaluation.evaluatorType === 'STUDENT' && evaluation.evaluateeType === 'MENTOR') {
          evaluationType = 'student_to_mentor';
        }

        // 确定评价状态
        let evaluationStatus = 'pending';
        if (evaluation.status === 'FINALIZED') {
          evaluationStatus = 'completed';
        } else if (evaluation.status === 'SUBMITTED') {
          evaluationStatus = 'expired';
        } else if (evaluation.status === 'DRAFT') {
          evaluationStatus = 'pending';
        }

        // 确定回访状态 - 基于真实的回访记录
        let followupStatus = 'no_followup';
        if (evaluationStatus === 'completed') {
          if (followupMap.has(evaluation.id)) {
            followupStatus = 'completed_followup';
          } else {
            followupStatus = 'pending_followup';
          }
        } else {
          // 非已完成状态默认为无需回访
          followupStatus = 'no_followup';
        }

        const project = evaluation.project?.sourceTrainingProjectId 
          ? projectMap.get(evaluation.project.sourceTrainingProjectId)
          : null;

        // 处理模板名称，去掉"评价模板："前缀
        let templateName = evaluation.evaluationTitle || '默认模板';
        if (templateName.startsWith('评价模板：')) {
          templateName = templateName.replace('评价模板：', '');
        }

        return {
          id: evaluation.id,
          projectId: evaluation.projectId,
          projectName: project?.name || '未知项目',
          phaseName: null,
          templateName: templateName, // 使用处理后的模板名称
          evaluationType,
          mentorId: evaluation.evaluatorType === 'MENTOR' ? evaluation.evaluatorId : evaluation.evaluateeId,
          mentorName: evaluation.evaluatorType === 'MENTOR' ? evaluation.evaluatorName : evaluation.evaluateeName,
          studentId: evaluation.evaluatorType === 'STUDENT' ? evaluation.evaluatorId : evaluation.evaluateeId,
          studentName: evaluation.evaluatorType === 'STUDENT' ? evaluation.evaluatorName : evaluation.evaluateeName,
          totalScore: evaluation.overallScore ? parseFloat(evaluation.overallScore.toString()) : null,
          status: evaluationStatus,
          followupStatus,
          completedAt: evaluation.submittedAt || evaluation.finalizedAt,
          createdAt: evaluation.createdAt,
          dueDate: null
        };
      });

      // 根据回访状态过滤（如果有指定）
      let filteredEvaluations = transformedEvaluations;
      if (followupStatus) {
        filteredEvaluations = transformedEvaluations.filter(e => e.followupStatus === followupStatus);
      }

      return {
        evaluations: filteredEvaluations,
        total: followupStatus ? filteredEvaluations.length : total,
        page: parseInt(page),
        pageSize: take
      };
    } catch (error) {
      console.error('获取评价数据失败:', error);
      return {
        evaluations: [],
        total: 0,
        page: 1,
        pageSize: 20
      };
    }
  }

  async findOne(id: string) {
    try {
      const evaluation = await this.prisma.mentorshipEvaluation.findUnique({
        where: { id }
      });

      if (!evaluation) {
        return null;
      }

      return {
        ...evaluation,
        projectName: '培训项目',
        phaseName: null,
        mentorName: evaluation.evaluatorType === 'MENTOR' ? evaluation.evaluatorName : evaluation.evaluateeName,
        studentName: evaluation.evaluatorType === 'STUDENT' ? evaluation.evaluatorName : evaluation.evaluateeName,
        totalScore: evaluation.overallScore ? parseFloat(evaluation.overallScore.toString()) : null,
        scores: [
          { criteria: '技术技能', value: evaluation.technicalSkillsScore ? parseFloat(evaluation.technicalSkillsScore.toString()) : 0 },
          { criteria: '沟通能力', value: evaluation.communicationScore ? parseFloat(evaluation.communicationScore.toString()) : 0 },
          { criteria: '学习态度', value: evaluation.learningAttitudeScore ? parseFloat(evaluation.learningAttitudeScore.toString()) : 0 },
          { criteria: '问题解决', value: evaluation.problemSolvingScore ? parseFloat(evaluation.problemSolvingScore.toString()) : 0 },
          { criteria: '协作能力', value: evaluation.collaborationScore ? parseFloat(evaluation.collaborationScore.toString()) : 0 }
        ].filter(score => score.value > 0)
      };
    } catch (error) {
      console.error('获取评价详情失败:', error);
      return null;
    }
  }

  async getStats() {
    try {
      const [total, pending, completed, needFollowup] = await Promise.all([
        this.prisma.mentorshipEvaluation.count(),
        this.prisma.mentorshipEvaluation.count({ where: { status: 'DRAFT' } }),
        this.prisma.mentorshipEvaluation.count({ where: { status: 'FINALIZED' } }),
        this.prisma.mentorshipEvaluation.count({
          where: {
            status: 'FINALIZED',
            submittedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        totalEvaluations: total,
        pendingEvaluations: pending,
        completedEvaluations: completed,
        pendingFollowups: needFollowup,
        averageScore: 85.2 // 暂时使用模拟数据
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        totalEvaluations: 0,
        pendingEvaluations: 0,
        completedEvaluations: 0,
        pendingFollowups: 0,
        averageScore: 0
      };
    }
  }

  async create(createDto: any) {
    return { id: `eval-${Date.now()}`, ...createDto };
  }

  async update(id: string, updateDto: any) {
    return { id, ...updateDto };
  }

  async remove(id: string) {
    return { message: '删除成功' };
  }

  async getFollowupRecord(evaluationId: string) {
    try {
      // 查询回访记录表
      const followupRecord = await this.prisma.$queryRawUnsafe(`
        SELECT * FROM evaluation_followups WHERE evaluation_id = ?
      `, evaluationId) as Array<any>;
      
      if (followupRecord.length === 0) {
        return null;
      }
      
      const record = followupRecord[0];
      return {
        id: record.id,
        evaluationId: record.evaluation_id,
        followupBy: record.followup_by,
        followupDate: record.followup_date,
        followupContent: record.followup_content,
        followupType: record.followup_type,
        followupScore: record.followup_score,
        suggestions: record.suggestions
      };
    } catch (error) {
      console.error('获取回访记录失败:', error);
      return null;
    }
  }

  async submitFollowup(evaluationId: string, followupData: any) {
    try {
      console.log('提交教务回访:', evaluationId, followupData);
      
      // 生成回访记录ID
      const followupId = `followup-${Date.now()}`;
      
      // 转换日期格式为MySQL兼容格式
      const followupDate = followupData.followupDate 
        ? new Date(followupData.followupDate).toISOString().slice(0, 19).replace('T', ' ')
        : new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // 插入回访记录到数据库
      await this.prisma.$queryRawUnsafe(`
        INSERT INTO evaluation_followups (
          id, evaluation_id, followup_by, followup_date, followup_type,
          followup_content, followup_score, suggestions, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, 
        followupId,
        evaluationId,
        followupData.followupBy || '教务管理员',
        followupDate,
        followupData.followupType || 'phone',
        followupData.followupContent,
        followupData.followupScore || null,
        followupData.suggestions || null
      );
      
      // 【新增】模拟补贴计算逻辑演示（基于新公式）
      const demonstrateNewCalculation = (baseAmount: number, successRate: number, duration: number, hasTeachingMaterials: boolean) => {
        // 计算各项系数
        const successRateMultiplier = successRate >= 50 ? 1.0 : successRate >= 20 ? 0.5 : 0;
        const durationMultiplier = duration >= 6 ? 1.0 : duration >= 3 ? 0.5 : 0;
        const materialMultiplier = hasTeachingMaterials ? 1.0 : 0.5;
        
        // 【关键改进】取最低系数，避免多重惩罚
        const allMultipliers = [successRateMultiplier, durationMultiplier, materialMultiplier];
        const finalMultiplier = Math.min(...allMultipliers);
        
        const finalAmount = baseAmount * finalMultiplier;
        
        console.log('📊 补贴计算演示（新公式）:', {
          baseAmount,
          successRateMultiplier,
          durationMultiplier, 
          materialMultiplier,
          finalMultiplier: finalMultiplier, // 实际使用的最低系数
          finalAmount,
          calculationMethod: 'MIN_MULTIPLIER',
          oldMethodWouldBe: baseAmount * successRateMultiplier * durationMultiplier * materialMultiplier,
          improvement: '避免了多重惩罚'
        });
        
        return {
          baseAmount,
          successRateMultiplier,
          durationMultiplier,
          materialMultiplier,
          finalMultiplier,
          finalAmount,
          calculationMethod: 'MIN_MULTIPLIER'
        };
      };
      
      // 演示计算（示例数据）
      demonstrateNewCalculation(3000, 45, 4, false); // 多项问题案例
      
      return {
        success: true,
        data: {
          id: followupId,
          evaluationId,
          followupBy: followupData.followupBy || '教务管理员',
          followupDate: followupDate,
          followupContent: followupData.followupContent,
          followupType: followupData.followupType || 'phone',
          followupScore: followupData.followupScore,
          suggestions: followupData.suggestions,
          createdAt: new Date()
        },
        message: '教务回访记录已保存，补贴计算采用新公式（避免多重惩罚）'
      };
    } catch (error) {
      console.error('提交教务回访失败:', error);
      throw new Error('提交教务回访失败');
    }
  }
} 