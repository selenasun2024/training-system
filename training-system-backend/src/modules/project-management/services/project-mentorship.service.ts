import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import {
  CreateMentorshipRelationshipDto,
  CreateMentorshipEvaluationDto,
  MentorshipProgressQueryDto
} from '../dto/project-mentorship.dto';

@Injectable()
export class ProjectMentorshipService {
  // 内存中存储已删除的关系ID，用于过滤Mock数据
  private deletedRelationships = new Set<string>();
  
  // 内存中存储手动创建的师徒关系
  private createdRelationships = new Map<string, any>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取项目师徒关系
   * 优先从数据库读取，同时兼容内存中的数据
   */
  async getProjectRelationships(
    projectId: string,
    status?: string,
    currentUserId?: string
  ) {
    console.log('🔍 ProjectMentorshipService: 获取项目师徒关系 - 项目ID:', projectId, '状态过滤:', status);

    try {
      // 首先通过TrainingProject ID查找对应的MentorshipProject IDs
      const mentorshipProjects = await this.prisma.mentorshipProject.findMany({
        where: {
          sourceTrainingProjectId: projectId
        },
        select: { id: true }
      });

      const mentorshipProjectIds = mentorshipProjects.map(mp => mp.id);
      console.log('🔍 找到MentorshipProject IDs:', mentorshipProjectIds);

      if (mentorshipProjectIds.length === 0) {
        console.log('🔍 没有找到对应的MentorshipProject，返回空结果');
        return [];
      }

      // 从数据库获取师徒关系
      const dbRelationships = await this.prisma.mentorshipRelationship.findMany({
        where: {
          projectId: { in: mentorshipProjectIds },
          // 如果没有指定状态，默认只显示活跃的关系（排除已终止的）
          ...(status 
            ? { status: status.toUpperCase() as any }
            : { status: { not: 'TERMINATED' } } // 默认不显示已终止的关系
          )
        },
        include: {
          mentor: {
            select: { id: true, name: true, department: true, position: true }
          },
          student: {
            select: { id: true, name: true, department: true, position: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 状态映射：数据库枚举值 -> 前端状态
      const dbToFrontendStatusMapping: Record<string, string> = {
        'ACTIVE': 'active',
        'PAUSED': 'paused',
        'COMPLETED': 'graduated', // 数据库COMPLETED映射为前端graduated
        'TERMINATED': 'dismissed' // 数据库TERMINATED映射为前端dismissed
      };

      // 转换数据库数据为前端期望的格式
      const dbFormattedRelationships = dbRelationships.map(rel => ({
        id: rel.id,
        projectId: rel.projectId,
        mentorId: rel.mentorId,
        studentId: rel.studentId,
        phaseId: rel.phaseId, // 添加阶段ID
        type: rel.scope,
        scope: rel.scope, // 添加关系范围
        status: dbToFrontendStatusMapping[rel.status] || rel.status.toLowerCase(),
        establishedDate: rel.establishedDate,
        mentor: rel.mentor,
        student: rel.student,
        mentorName: rel.mentorName,
        studentName: rel.studentName,
        matchingType: rel.matchingType,
        matchingScore: rel.matchingScore ? Number(rel.matchingScore) : null,
        matchingReasons: Array.isArray(rel.matchingReasons) ? rel.matchingReasons : []
      }));

      // 获取内存中的关系（保持向后兼容）
      const memoryRelationships = Array.from(this.createdRelationships.values())
        .filter(rel => {
          if (rel.projectId !== projectId) return false;
          if (status && rel.status !== status) return false;
          // 避免重复：如果数据库中已有相同的关系，则跳过内存中的
          const existsInDb = dbFormattedRelationships.some(dbRel => 
            dbRel.mentorId === rel.mentorId && 
            dbRel.studentId === rel.studentId &&
            dbRel.projectId === rel.projectId
          );
          return !existsInDb;
        });
      
      // 过滤掉已删除的关系
      const filteredMemoryRelationships = memoryRelationships.filter(rel => !this.deletedRelationships.has(rel.id));
      
      // 合并数据库和内存中的关系
      const allRelationships = [...dbFormattedRelationships, ...filteredMemoryRelationships];
      
      console.log('✅ 获取师徒关系成功 - 数据库:', dbFormattedRelationships.length, '内存:', filteredMemoryRelationships.length, '总计:', allRelationships.length);
      
      return allRelationships;
    } catch (error) {
      console.error('❌ 获取师徒关系失败:', error);
      throw new Error(`获取师徒关系失败: ${error.message}`);
    }
  }

  /**
   * 创建师徒关系
   * 真正保存到数据库的MentorshipRelationship表中
   */
  async createMentorshipRelationship(createDto: CreateMentorshipRelationshipDto) {
    console.log('📝 ProjectMentorshipService: 创建师徒关系 - 数据:', createDto);

    try {
      // 首先获取TrainingProject信息
      const trainingProject = await this.prisma.trainingProject.findUnique({
        where: { id: createDto.projectId },
        select: { id: true, name: true }
      });

      if (!trainingProject) {
        throw new Error(`培训项目不存在: ${createDto.projectId}`);
      }

      // 获取导师和学员信息
      const [mentor, student] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: createDto.mentorId },
          select: { id: true, name: true, department: true, position: true }
        }),
        this.prisma.user.findUnique({
          where: { id: createDto.studentId },
          select: { id: true, name: true, department: true, position: true }
        })
      ]);

      if (!mentor) {
        throw new Error(`导师不存在: ${createDto.mentorId}`);
      }

      if (!student) {
        throw new Error(`学员不存在: ${createDto.studentId}`);
      }

      // 检查或创建对应的MentorshipProject
      let mentorshipProject = await this.prisma.mentorshipProject.findFirst({
        where: {
          sourceTrainingProjectId: createDto.projectId,
          mentorId: createDto.mentorId,
          studentId: createDto.studentId
        }
      });

      if (!mentorshipProject) {
        console.log('🔄 创建新的MentorshipProject记录');
        mentorshipProject = await this.prisma.mentorshipProject.create({
          data: {
            title: `${trainingProject.name} - ${mentor.name}带教${student.name}`,
            description: `基于培训项目"${trainingProject.name}"的师徒关系`,
            projectType: 'TRAINING_BASED',
            status: 'ACTIVE',
            sourceTrainingProjectId: createDto.projectId,
            sourceTrainingProjectName: trainingProject.name,
            autoCreated: true,
            mentorId: createDto.mentorId,
            mentorName: mentor.name,
            studentId: createDto.studentId,
            studentName: student.name,
            plannedDuration: 90,
            startDate: new Date(),
            plannedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天后
            progress: 0,
            completedPhases: 0,
            totalPhases: 1,
            objectives: [],
            successCriteria: [],
            customConfig: {},
            createdBy: createDto.createdBy || 'admin-001'
          }
        });
        console.log('✅ MentorshipProject创建成功，ID:', mentorshipProject.id);
      } else {
        console.log('🔍 找到已存在的MentorshipProject，ID:', mentorshipProject.id);
      }

      // 检查导师是否已经是项目参与者
      const existingMentor = await this.prisma.projectParticipant.findFirst({
        where: {
          projectId: createDto.projectId,
          userId: createDto.mentorId,
          role: 'COUNSELOR'
        }
      });

      // 如果导师不在项目中，添加导师
      if (!existingMentor) {
        await this.prisma.projectParticipant.create({
          data: {
            id: `pp-mentor-${Date.now()}`,
            projectId: createDto.projectId,
            userId: createDto.mentorId,
            role: 'COUNSELOR',
            status: 'ACTIVE',
            joinedAt: new Date()
          }
        });
      }

      // 检查学员是否已经是项目参与者
      const existingStudent = await this.prisma.projectParticipant.findFirst({
        where: {
          projectId: createDto.projectId,
          userId: createDto.studentId,
          role: 'STUDENT'
        }
      });

      // 如果学员不在项目中，添加学员
      if (!existingStudent) {
        await this.prisma.projectParticipant.create({
          data: {
            id: `pp-student-${Date.now()}`,
            projectId: createDto.projectId,
            userId: createDto.studentId,
            role: 'STUDENT',
            status: 'ACTIVE',
            joinedAt: new Date()
          }
        });
      }

      // 检查是否已存在相同的师徒关系
      const existingRelationship = await this.prisma.mentorshipRelationship.findFirst({
        where: {
          projectId: mentorshipProject.id,
          mentorId: createDto.mentorId,
          studentId: createDto.studentId,
          status: { not: 'TERMINATED' }
        }
      });

      if (existingRelationship) {
        console.log('⚠️ 师徒关系已存在，返回现有关系');
        return {
          id: existingRelationship.id,
          projectId: existingRelationship.projectId,
          mentorId: existingRelationship.mentorId,
          studentId: existingRelationship.studentId,
          type: existingRelationship.scope,
          status: 'active',
          establishedDate: existingRelationship.establishedDate,
          mentor: mentor,
          student: student,
          mentorName: mentor.name,
          studentName: student.name,
          matchingType: existingRelationship.matchingType || 'MANUAL',
          matchingScore: existingRelationship.matchingScore ? Number(existingRelationship.matchingScore) : null,
          matchingReasons: Array.isArray(existingRelationship.matchingReasons) ? existingRelationship.matchingReasons : []
        };
      }

      // 创建新的师徒关系并保存到数据库
      const relationshipData = {
        projectId: mentorshipProject.id,
        projectType: 'TRAINING_PROJECT' as any,
        mentorId: createDto.mentorId,
        mentorName: mentor.name,
        mentorType: 'DEPARTMENT_ASSIGNED' as any, // 修正: 'INTERNAL' -> 'DEPARTMENT_ASSIGNED'
        studentId: createDto.studentId,
        studentName: student.name,
        relationshipType: 'ONE_TO_ONE' as any,
        scope: (createDto.type || 'FULL_PROJECT') as any, // 修正: 'PROJECT_BASED' -> 'FULL_PROJECT'
        matchingType: (createDto.matchingType || 'MANUAL') as any,
        matchingScore: createDto.matchingScore || null,
        matchingReasons: createDto.matchingReasons || [],
        matchingCriteria: {},
        establishedDate: new Date(),
        expectedDuration: 90, // 默认90天
        status: 'ACTIVE' as any,
        createdBy: createDto.createdBy || 'admin-001'
      };

      console.log('📦 ProjectMentorshipService: 准备写入数据库的关系数据:', relationshipData);

      const savedRelationship = await this.prisma.mentorshipRelationship.create({
        data: relationshipData,
        include: {
          mentor: {
            select: { id: true, name: true, department: true, position: true }
          },
          student: {
            select: { id: true, name: true, department: true, position: true }
          }
        }
      });

      const relationship = {
        id: savedRelationship.id,
        projectId: savedRelationship.projectId,
        mentorId: savedRelationship.mentorId,
        studentId: savedRelationship.studentId,
        type: savedRelationship.scope,
        status: 'active',  // 前端显示为"未出师"
        establishedDate: savedRelationship.establishedDate,
        mentor: savedRelationship.mentor,
        student: savedRelationship.student,
        mentorName: savedRelationship.mentorName,
        studentName: savedRelationship.studentName,
        matchingType: savedRelationship.matchingType,
        matchingScore: savedRelationship.matchingScore ? Number(savedRelationship.matchingScore) : null,
        matchingReasons: Array.isArray(savedRelationship.matchingReasons) ? savedRelationship.matchingReasons : []
      };

      // 同时保存到内存中以保持向后兼容
      this.createdRelationships.set(relationship.id, relationship);

      console.log('✅ 师徒关系创建成功并保存到数据库 - ID:', relationship.id);
      return relationship;
    } catch (error) {
      console.error('❌ 创建师徒关系失败:', error);
      throw new Error(`创建师徒关系失败: ${error.message}`);
    }
  }

  /**
   * 获取带教进度
   * 基于 training_tasks 和 task_submissions 表来计算进度
   */
  async getMentorshipProgress(
    projectId: string,
    queryParams?: any,
    currentUserId?: string
  ) {
    console.log('🔍 ProjectMentorshipService: 获取带教进度 - 项目ID:', projectId, '参数:', queryParams);

    try {
      // 获取项目中的师徒关系（不限制状态，让任务进度显示所有关系）
      const relationships = await this.getProjectRelationships(projectId, undefined, currentUserId);
      
      if (relationships.length === 0) {
        console.log('⚠️ 没有找到师徒关系');
        return {
          summary: {
            totalStudents: 0,
            averageProgress: 0,
            onTimeCompletion: 0,
            needsAttention: 0
          },
          relationships: [],
          pagination: {
            page: queryParams?.page || 1,
            limit: queryParams?.limit || 20,
            total: 0
          }
        };
      }

      // 获取项目的真实任务数据
      const projectTasks = await this.prisma.trainingTask.findMany({
        where: { projectId },
        include: {
          stage: {
            select: { id: true, name: true }
          },
          submissions: {
            select: { 
              studentId: true, 
              status: true, 
              score: true, 
              submittedAt: true,
              reviewedAt: true 
            }
          }
        },
        orderBy: [
          { stage: { orderIndex: 'asc' } },
          { orderIndex: 'asc' }
        ]
      });

      console.log(`📋 项目任务数量: ${projectTasks.length}`);

      // 为每个师徒关系计算真实的任务进度数据
      const progressData = await Promise.all(relationships.map(async relationship => {
        const studentId = relationship.studentId;
        
        // 计算学员的任务完成情况
        const studentSubmissions = projectTasks.map(task => {
          return task.submissions.find(sub => sub.studentId === studentId);
        });

        const completedTasks = studentSubmissions.filter(sub => 
          sub && ['REVIEWED', 'APPROVED'].includes(sub.status)
        ).length;

        const totalTasks = projectTasks.length;
        const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // 找到当前正在进行的任务（未完成的第一个任务）
        let currentTask = null;
        for (let i = 0; i < projectTasks.length; i++) {
          const task = projectTasks[i];
          const submission = task.submissions.find(sub => sub.studentId === studentId);
          
          if (!submission || !['REVIEWED', 'APPROVED'].includes(submission.status)) {
            currentTask = {
              id: task.id,
              name: task.name,
              type: this.mapTaskType(task.type),
              status: this.getTaskStatus(submission),
              deadline: task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 默认一周后
            };
            break;
          }
        }

        // 如果所有任务都完成了，显示最后一个任务
        if (!currentTask && projectTasks.length > 0) {
          const lastTask = projectTasks[projectTasks.length - 1];
          const lastSubmission = lastTask.submissions.find(sub => sub.studentId === studentId);
          currentTask = {
            id: lastTask.id,
            name: lastTask.name,
            type: this.mapTaskType(lastTask.type),
            status: 'completed',
            deadline: lastTask.dueDate || new Date()
          };
        }

        // 如果没有任务，创建默认任务
        if (!currentTask) {
          currentTask = {
            id: 'no-task',
            name: '暂无任务',
            type: 'theory',
            status: 'not_started',
            deadline: new Date()
          };
        }

        // 计算平均分
        const scores = studentSubmissions
          .filter(sub => sub && sub.score !== null)
          .map(sub => sub.score);
        const averageScore = scores.length > 0 
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : null;

        // 计算学习时长（基于任务预计时长）
        const estimatedHours = projectTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        const studyTime = Math.round(overallProgress * estimatedHours / 100);

        // 获取最近活动
        const recentSubmissions = studentSubmissions
          .filter(sub => sub && sub.submittedAt)
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

        const lastActivity = recentSubmissions.length > 0
          ? {
              action: '提交了作业',
              time: recentSubmissions[0].submittedAt
            }
          : {
              action: '暂无活动',
              time: new Date()
            };

        return {
          id: relationship.id,
          studentId: relationship.studentId,
          studentName: relationship.studentName || relationship.student?.name || '未知学员',
          department: relationship.student?.department || '未知部门',
          mentorId: relationship.mentorId,
          mentorName: relationship.mentorName || relationship.mentor?.name || '未知导师',
          
          // 真实的当前任务信息
          currentTask,
          
          // 真实的进度统计
          overallProgress,
          completedTasks,
          totalTasks,
          averageScore,
          
          // 真实的学习时长
          studyTime,
          targetTime: estimatedHours || 40,
          
          // 真实的最近活动
          lastActivity,
          
          // 基于真实数据的风险提示
          risks: this.generateRealRisks(overallProgress, studyTime, estimatedHours, currentTask.status),
          
          // 关系建立时间
          establishedDate: relationship.establishedDate,
          status: relationship.status
        };
      }));

      // 过滤数据
      let filteredData = progressData;
      
      if (queryParams?.mentorId) {
        filteredData = filteredData.filter(item => item.mentorId === queryParams.mentorId);
      }
      
      if (queryParams?.studentId) {
        filteredData = filteredData.filter(item => item.studentId === queryParams.studentId);
      }
      
      if (queryParams?.taskStatus) {
        filteredData = filteredData.filter(item => item.currentTask.status === queryParams.taskStatus);
      }
      
      if (queryParams?.taskType) {
        filteredData = filteredData.filter(item => item.currentTask.type === queryParams.taskType);
      }
      
      if (queryParams?.searchKeyword) {
        filteredData = filteredData.filter(item => 
          item.studentName.includes(queryParams.searchKeyword) ||
          item.mentorName.includes(queryParams.searchKeyword)
        );
      }

      // 分页
      const page = queryParams?.page || 1;
      const limit = queryParams?.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedData = filteredData.slice(startIndex, startIndex + limit);

      // 计算统计数据
      const summary = {
        totalStudents: filteredData.length,
        averageProgress: Math.round(filteredData.reduce((sum, item) => sum + item.overallProgress, 0) / filteredData.length) || 0,
        onTimeCompletion: Math.round((filteredData.filter(item => item.currentTask.status === 'completed').length / filteredData.length) * 100) || 0,
        needsAttention: filteredData.filter(item => item.risks.length > 0).length
      };

      const result = {
        summary,
        relationships: paginatedData,
        pagination: {
          page,
          limit,
          total: filteredData.length
        }
      };

      console.log('✅ 获取带教进度成功，学员数量:', paginatedData.length);
      return result;
    } catch (error) {
      console.error('❌ 获取带教进度失败:', error);
      throw new Error(`获取带教进度失败: ${error.message}`);
    }
  }



  /**
   * 提交评价
   */
  async submitEvaluation(
    projectId: string,
    createDto: CreateMentorshipEvaluationDto,
    currentUserId?: string
  ) {
    console.log('📝 ProjectMentorshipService: 提交评价 - 项目ID:', projectId, '数据:', createDto);

    try {
      // 首先检查师徒关系是否存在
      const relationship = await this.prisma.mentorshipRelationship.findUnique({
        where: { id: createDto.relationshipId },
        include: {
          mentor: { select: { id: true, name: true } },
          student: { select: { id: true, name: true } }
        }
      });

      if (!relationship) {
        throw new Error(`师徒关系不存在: ${createDto.relationshipId}`);
      }

      console.log('🔍 找到师徒关系:', relationship);
      
      // 🔧 检查项目ID不匹配的情况
      if (projectId !== relationship.projectId) {
        console.log('⚠️ 项目ID不匹配 - 前端传递:', projectId, '师徒关系实际:', relationship.projectId);
        console.log('🔧 将使用师徒关系实际的项目ID:', relationship.projectId);
      }

      // 确定评价者和被评价者的信息
      let evaluatorName = '评价者';
      let evaluateeName = '被评价者';
      
      if (createDto.evaluatorType === 'MENTOR') {
        evaluatorName = relationship.mentor?.name || relationship.mentorName || '未知导师';
        evaluateeName = relationship.student?.name || relationship.studentName || '未知学员';
      } else if (createDto.evaluatorType === 'STUDENT') {
        evaluatorName = relationship.student?.name || relationship.studentName || '未知学员';  
        evaluateeName = relationship.mentor?.name || relationship.mentorName || '未知导师';
      }

      // 🔧 修复：使用师徒关系实际所属的项目ID，而不是前端传递的项目ID
      const evaluationData = {
        projectId: relationship.projectId,  // 使用师徒关系实际的项目ID
        relationshipId: createDto.relationshipId || '',
        
        // 评价类型映射
        evaluationType: this.mapEvaluationType(createDto.evaluationPeriod) as any,
        evaluationTitle: createDto.feedback || '待完成的评价任务',
        evaluationPeriod: createDto.evaluationPeriod || 'PHASE_END',
        
        // 🔧 修复：使用实际存在的用户ID作为评价者ID
        evaluatorId: createDto.evaluatorType === 'MENTOR' ? relationship.mentorId : relationship.studentId,
        evaluatorType: createDto.evaluatorType as any,
        evaluatorName: evaluatorName,
        
        // 被评价者信息  
        evaluateeId: createDto.evaluateeId,
        evaluateeType: this.getEvaluateeType(createDto.evaluatorType) as any,
        evaluateeName: evaluateeName,
        
        // 评价分数（使用前端发送的分数或默认值）
        technicalSkillsScore: createDto.performanceRating || 0,
        communicationScore: createDto.communicationRating || 0,
        learningAttitudeScore: createDto.guidanceEffectivenessRating || 0,
        problemSolvingScore: createDto.progressRating || 0,
        collaborationScore: createDto.performanceRating || 0,
        overallScore: createDto.overallRating || 0,
        
        // 评价反馈
        specificFeedback: createDto.feedback || '待完成的评价任务',
        strengths: createDto.strengths?.join(', ') || '',
        improvementAreas: createDto.areasForImprovement?.join(', ') || '', 
        suggestions: createDto.recommendations?.join(', ') || '',
        
        // 状态和时间
        status: 'DRAFT' as any,
        evaluationDate: new Date(),
        isAnonymous: false,
        visibility: 'SHARED' as any,
      };

      console.log('🔍 准备保存的评价数据:', evaluationData);

      // 保存到数据库
      const evaluation = await this.prisma.mentorshipEvaluation.create({
        data: evaluationData
      });

      console.log('✅ 评价提交成功 - ID:', evaluation.id);
      return evaluation;
    } catch (error) {
      console.error('❌ 提交评价失败 - 详细错误:', error);
      console.error('❌ 错误堆栈:', error.stack);
      throw new Error(`提交评价失败: ${error.message}`);
    }
  }

  // 辅助方法：映射评价类型
  private mapEvaluationType(evaluationPeriod: string): string {
    const mapping: Record<string, string> = {
      'WEEKLY': 'PERIODIC',
      'MONTHLY': 'PERIODIC', 
      'PHASE_END': 'PHASE',
      'PROJECT_END': 'FINAL'
    };
    return mapping[evaluationPeriod] || 'PHASE';
  }

  // 辅助方法：根据评价者类型确定被评价者类型
  private getEvaluateeType(evaluatorType: string): string {
    return evaluatorType === 'MENTOR' ? 'STUDENT' : 'MENTOR';
  }

  /**
   * 获取项目评价数据
   * 查询数据库中真实的评价记录
   */
  async getProjectEvaluations(
    projectId: string,
    type?: string,
    evaluatorId?: string,
    currentUserId?: string
  ) {
    console.log('🔍 ProjectMentorshipService: 获取项目评价 - 项目ID:', projectId, '类型:', type, '评价者:', evaluatorId);

    try {
      // 查询数据库中的真实评价记录
      const evaluations = await this.prisma.mentorshipEvaluation.findMany({
        where: {
          projectId: projectId,
          ...(type && { evaluationType: type as any }), // 类型转换
          ...(evaluatorId && { evaluatorId: evaluatorId }),
        },
        include: {
          evaluator: {
            select: {
              id: true,
              name: true,
              department: true,
              position: true,
            }
          },
          evaluatee: {
            select: {
              id: true,
              name: true,
              department: true,
              position: true,
            }
          },
          relationship: {
            select: {
              id: true,
              mentorId: true,
              studentId: true,
              mentor: {
                select: {
                  id: true,
                  name: true,
                  department: true,
                  position: true,
                }
              },
              student: {
                select: {
                  id: true,
                  name: true,
                  department: true,
                  position: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 格式化返回数据，兼容前端期望的格式
      const formattedEvaluations = evaluations.map(evaluation => ({
        id: evaluation.id,
        relationshipId: evaluation.relationshipId,
        projectId: evaluation.projectId,
        evaluatorId: evaluation.evaluatorId,
        evaluateeId: evaluation.evaluateeId,
        evaluatorType: evaluation.evaluatorType,
        evaluationType: evaluation.evaluationType,
        evaluationName: evaluation.evaluationTitle,
        status: evaluation.status.toLowerCase(), // 转换为小写以兼容前端
        dueDate: evaluation.evaluationDate,
        score: evaluation.overallScore ? Number(evaluation.overallScore) : 0,
        mentor: evaluation.relationship?.mentor || {
          id: evaluation.relationship?.mentorId || '',
          name: '未知导师',
          department: '',
          position: ''
        },
        student: evaluation.relationship?.student || {
          id: evaluation.relationship?.studentId || '',
          name: '未知学员', 
          department: '',
          position: ''
        },
        mentorName: evaluation.relationship?.mentor?.name || '未知导师',
        studentName: evaluation.relationship?.student?.name || '未知学员',
        createdAt: evaluation.createdAt,
        templateTitle: evaluation.evaluationTitle,
        feedback: evaluation.specificFeedback,
        strengths: evaluation.strengths,
        improvementAreas: evaluation.improvementAreas,
        suggestions: evaluation.suggestions
      }));

      console.log('✅ 获取项目评价成功，数量:', formattedEvaluations.length);
      return formattedEvaluations;
    } catch (error) {
      console.error('❌ 获取项目评价失败:', error);
      throw new Error(`获取项目评价失败: ${error.message}`);
    }
  }

  // 辅助方法
  private getRandomStatus(): 'pending' | 'completed' {
    return Math.random() > 0.5 ? 'completed' : 'pending';
  }

  private getRandomScore(): number {
    return Math.floor(Math.random() * 20) + 80; // 80-100分
  }

  private calculateDueDate(startDate: string | Date, days: number): Date {
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * 获取带教标准
   * 返回项目带教的标准配置和要求
   */
  async getMentorshipStandards(
    projectId: string,
    category?: string,
    currentUserId?: string
  ) {
    console.log('🔍 ProjectMentorshipService: 获取带教标准 - 项目ID:', projectId, '分类:', category);

    try {
      // 模拟返回带教标准数据
      const mockStandards = [
        {
          id: `std-${projectId}-1`,
          category: 'technical',
          title: '技术能力要求',
          items: [
            { name: '编程基础', requirement: '掌握至少一种编程语言', level: 'required' },
            { name: '框架使用', requirement: '熟悉主流开发框架', level: 'preferred' },
            { name: '代码质量', requirement: '代码规范性和可读性', level: 'required' }
          ]
        },
        {
          id: `std-${projectId}-2`,
          category: 'communication',
          title: '沟通协作能力',
          items: [
            { name: '团队合作', requirement: '良好的团队协作精神', level: 'required' },
            { name: '问题反馈', requirement: '及时反馈学习问题', level: 'required' },
            { name: '文档编写', requirement: '清晰的文档编写能力', level: 'preferred' }
          ]
        }
      ];

      // 根据分类过滤
      const filteredStandards = category 
        ? mockStandards.filter(std => std.category === category)
        : mockStandards;

      console.log('✅ 获取带教标准成功，数量:', filteredStandards.length);
      return filteredStandards;
    } catch (error) {
      console.error('❌ 获取带教标准失败:', error);
      throw new Error(`获取带教标准失败: ${error.message}`);
    }
  }

  // 辅助方法 - 处理真实任务数据
  private mapTaskType(dbTaskType: string): string {
    const typeMapping: Record<string, string> = {
      'face-to-face': 'theory',
      'homework': 'homework',
      'online-course': 'theory',
      'discussion': 'practice',
      'exam': 'exam',
      'practice': 'practice'
    };
    return typeMapping[dbTaskType] || 'theory';
  }

  private getTaskStatus(submission: any): string {
    if (!submission) return 'not_started';
    
    switch (submission.status) {
      case 'DRAFT':
        return 'in_progress';
      case 'SUBMITTED':
        return 'in_progress';
      case 'REVIEWED':
      case 'APPROVED':
        return 'completed';
      case 'REJECTED':
        return 'overdue';
      default:
        return 'not_started';
    }
  }

  private generateRealRisks(progress: number, studyTime: number, targetTime: number, taskStatus: string): any[] {
    const risks = [];
    
    // 进度落后风险
    if (progress < 30) {
      risks.push({
        type: 'progress',
        level: 'high',
        description: '学习进度明显落后，需要加强指导'
      });
    } else if (progress < 60) {
      risks.push({
        type: 'progress',
        level: 'medium',
        description: '学习进度有所滞后，建议关注'
      });
    }
    
    // 学习时长不足风险
    if (targetTime > 0 && studyTime < targetTime * 0.5) {
      risks.push({
        type: 'time',
        level: 'medium',
        description: '学习时长不足，建议增加学习投入'
      });
    }
    
    // 任务逾期风险
    if (taskStatus === 'overdue') {
      risks.push({
        type: 'deadline',
        level: 'high',
        description: '任务已逾期，需要立即处理'
      });
    }
    
    return risks;
  }

  /**
   * 获取学员在项目中的任务详情
   */
  async getStudentTaskDetails(projectId: string, studentId: string, currentUserId?: string) {
    try {
      console.log('🔍 ProjectMentorshipService: 获取学员任务详情', { projectId, studentId });

      // 1. 验证学员是否参与项目
      const participant = await this.prisma.projectParticipant.findFirst({
        where: {
          projectId,
          userId: studentId,
          role: 'STUDENT',
          status: 'ACTIVE'
        }
      });

      console.log('📋 项目参与者查询结果:', participant);

      if (!participant) {
        // 检查学员是否存在
        const student = await this.prisma.user.findUnique({
          where: { id: studentId },
          select: { id: true, name: true, department: true }
        });
        
        if (!student) {
          throw new Error(`学员不存在: ${studentId}`);
        }
        
        console.log('⚠️ 学员存在但未参与项目，返回基础信息');
        // 学员存在但未参与项目，返回基础信息
        return {
          student: {
            id: student.id,
            name: student.name,
            department: student.department,
            email: null
          },
          mentorship: null,
          summary: {
            totalTasks: 0,
            completedTasks: 0,
            overallProgress: 0,
            averageScore: null,
            totalEstimatedHours: 0,
            actualStudyTime: 0
          },
          tasks: []
        };
      }

      // 2. 获取项目的所有任务
      const projectTasks = await this.prisma.trainingTask.findMany({
        where: { projectId },
        include: {
          stage: {
            select: { 
              id: true, 
              name: true, 
              type: true,
              orderIndex: true 
            }
          },
          submissions: {
            where: { studentId },
            select: {
              id: true,
              content: true,
              filePaths: true,
              score: true,
              feedback: true,
              status: true,
              submittedAt: true,
              reviewedAt: true,
              reviewer: {
                select: { id: true, name: true }
              }
            }
          },
          assignee: {
            select: { id: true, name: true }
          }
        },
        orderBy: [
          { stage: { orderIndex: 'asc' } },
          { orderIndex: 'asc' }
        ]
      });

      // 3. 获取学员基本信息
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, name: true, department: true, email: true }
      });

      // 4. 获取师徒关系信息
      const mentorshipRelation = await this.prisma.mentorshipRelationship.findFirst({
        where: {
          studentId,
          // 获取所有状态的关系，包括已完成和已终止的
        },
        orderBy: { establishedDate: 'desc' } // 获取最新的关系
      });

      // 5. 如果有师徒关系，获取导师信息
      let mentorInfo = null;
      if (mentorshipRelation) {
        mentorInfo = await this.prisma.user.findUnique({
          where: { id: mentorshipRelation.mentorId },
          select: { id: true, name: true }
        });
      }

      // 5. 处理任务数据
      const taskList = projectTasks.map(task => {
        const submission = task.submissions[0]; // 每个学员每个任务只有一个提交记录
        
        return {
          id: task.id,
          name: task.name,
          description: task.description,
          type: task.type,
          required: task.required,
          orderIndex: task.orderIndex,
          dueDate: task.dueDate,
          estimatedHours: task.estimatedHours,
          stage: task.stage,
          assignee: task.assignee,
          
          // 提交状态
          status: this.getTaskStatus(submission),
          submission: submission ? {
            id: submission.id,
            content: submission.content,
            filePaths: submission.filePaths,
            score: submission.score,
            feedback: submission.feedback,
            status: submission.status,
            submittedAt: submission.submittedAt,
            reviewedAt: submission.reviewedAt,
            reviewer: submission.reviewer
          } : null,
          
          // 计算相对时间
          timeSpent: submission && submission.submittedAt ? this.calculateTimeSpent(submission.submittedAt, task.createdAt) : 0,
          isOverdue: task.dueDate ? new Date() > new Date(task.dueDate) && !submission : false
        };
      });

      // 6. 计算统计数据
      const completedTasks = taskList.filter(task => 
        ['completed'].includes(task.status)
      ).length;
      
      const totalTasks = taskList.length;
      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const scores = taskList
        .filter(task => task.submission && task.submission.score !== null && task.submission.score !== undefined)
        .map(task => task.submission.score);
      const averageScore = scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length)
        : null;

      // 7. 计算学习时长
      const totalEstimatedHours = taskList.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
      const actualStudyTime = Math.round(overallProgress * totalEstimatedHours / 100);

      return {
        // 学员信息
        student: {
          id: student.id,
          name: student.name,
          department: student.department,
          email: student.email
        },
        
        // 师徒关系
        mentorship: mentorshipRelation ? {
          id: mentorshipRelation.id,
          mentor: mentorInfo,
          establishedDate: mentorshipRelation.establishedDate,
          status: mentorshipRelation.status
        } : null,
        
        // 统计数据
        summary: {
          totalTasks,
          completedTasks,
          overallProgress,
          averageScore,
          totalEstimatedHours,
          actualStudyTime
        },
        
        // 详细任务列表
        tasks: taskList
      };

    } catch (error) {
      console.error('❌ ProjectMentorshipService: 获取学员任务详情失败:', error);
      throw new Error(`获取学员任务详情失败: ${error.message}`);
    }
  }

  /**
   * 计算任务用时（小时）
   */
  private calculateTimeSpent(submittedAt: Date, createdAt: Date): number {
    if (!submittedAt || !createdAt) return 0;
    
    const diffMs = new Date(submittedAt).getTime() - new Date(createdAt).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, Math.round(diffHours));
  }

  /**
   * 创建师徒反馈
   */
  async createMentorshipFeedback(
    projectId: string,
    studentId: string,
    feedbackDto: any,
    currentUserId?: string
  ) {
    try {
      console.log('🔍 ProjectMentorshipService: 创建师徒反馈', { projectId, studentId });

      // 1. 验证师徒关系是否存在
      const mentorshipRelation = await this.prisma.mentorshipRelationship.findFirst({
        where: {
          projectId: { startsWith: projectId },
          studentId,
          status: { not: 'TERMINATED' }
        },
        include: {
          mentor: { select: { id: true, name: true } },
          student: { select: { id: true, name: true } }
        }
      });

      if (!mentorshipRelation) {
        throw new Error('师徒关系不存在或已终止');
      }

      // 2. 获取反馈提供者信息
      const feedbackBy = currentUserId || 'admin-001';
      const feedbackProvider = await this.prisma.user.findUnique({
        where: { id: feedbackBy },
        select: { id: true, name: true, level: true }
      });

      // 3. 创建简化的反馈记录（暂时不依赖成长档案系统）
      const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 4. 记录详细的师徒反馈信息
      const detailedFeedback = {
        id: feedbackId,
        relationshipId: mentorshipRelation.id,
        projectId,
        studentId,
        studentName: mentorshipRelation.student.name,
        mentorId: mentorshipRelation.mentorId,
        mentorName: mentorshipRelation.mentor?.name,
        feedbackBy,
        feedbackByName: feedbackProvider?.name,
        feedbackDate: new Date(),
        feedbackType: feedbackDto.feedbackType,
        feedbackFocus: feedbackDto.feedbackFocus,
        specificPerformance: feedbackDto.specificPerformance,
        improvementSuggestions: feedbackDto.improvementSuggestions,
        nextStageGoals: feedbackDto.nextStageGoals,
        recommendedResources: feedbackDto.recommendedResources,
        followUpPlan: feedbackDto.followUpPlan,
        rating: feedbackDto.rating,
        createdAt: new Date()
      };

      // 5. 暂时将反馈数据保存在内存中（后续可以扩展数据库表存储）
      console.log('📝 师徒反馈详情:', JSON.stringify(detailedFeedback, null, 2));

      console.log('✅ ProjectMentorshipService: 师徒反馈创建成功', detailedFeedback.id);
      return detailedFeedback;

    } catch (error) {
      console.error('❌ ProjectMentorshipService: 创建师徒反馈失败:', error);
      throw new Error(`创建师徒反馈失败: ${error.message}`);
    }
  }

  /**
   * 获取学员的反馈记录
   */
  async getStudentFeedback(projectId: string, studentId: string, currentUserId?: string) {
    try {
      console.log('🔍 ProjectMentorshipService: 获取学员反馈记录', { projectId, studentId });

      // 暂时返回空数组，因为反馈目前保存在内存中
      // 后续可以扩展数据库表来持久化存储师徒反馈
      console.log('📋 反馈功能开发中，暂时返回空列表');
      
      const formattedFeedbacks = [
        // 示例反馈数据
        {
          id: 'sample-feedback-1',
          feedbackDate: new Date(),
          feedbackType: 'positive',
          feedbackFocus: ['learning_attitude', 'task_completion'],
          content: '学员学习态度积极，任务完成质量较高',
          rating: 4,
          providerName: '李导师',
          providerRole: 'mentor',
          title: 'positive - 师徒反馈',
          status: 'submitted',
          visibility: 'shared',
          createdAt: new Date()
        }
      ];

      console.log('✅ ProjectMentorshipService: 获取反馈记录成功，数量:', formattedFeedbacks.length);
      return formattedFeedbacks;

    } catch (error) {
      console.error('❌ ProjectMentorshipService: 获取反馈记录失败:', error);
      throw new Error(`获取反馈记录失败: ${error.message}`);
    }
  }

  // 辅助方法 - 生成模拟数据（保留作为后备）
  private getRandomProgress(): number {
    return Math.floor(Math.random() * 100);
  }

  private getRandomTaskStatus(): string {
    const statuses = ['not_started', 'in_progress', 'completed', 'overdue'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getRandomTaskType(): string {
    const types = ['theory', 'practice', 'homework', 'exam'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getRandomTaskName(): string {
    const tasks = [
      '基础理论学习',
      '实践操作练习',
      '项目实战作业',
      '阶段性测验',
      '技能考核',
      '案例分析',
      '小组讨论',
      '个人总结'
    ];
    return tasks[Math.floor(Math.random() * tasks.length)];
  }

  private getRandomStudyTime(): number {
    return Math.floor(Math.random() * 50) + 5; // 5-55小时
  }

  private getRandomDeadline(): Date {
    const now = new Date();
    const daysAhead = Math.floor(Math.random() * 30) + 1; // 1-30天后
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + daysAhead);
    return deadline;
  }

  private getRandomActivity(): string {
    const activities = [
      '提交了作业',
      '完成了测验',
      '参与了讨论',
      '查看了资料',
      '请求了指导',
      '更新了进度'
    ];
    return activities[Math.floor(Math.random() * activities.length)];
  }

  private getRandomActivityTime(): Date {
    const now = new Date();
    const hoursAgo = Math.floor(Math.random() * 72); // 最近3天内
    const activityTime = new Date(now);
    activityTime.setHours(activityTime.getHours() - hoursAgo);
    return activityTime;
  }

  private generateRisks(progress: number, studyTime: number, taskStatus: string): any[] {
    const risks = [];
    
    // 进度落后风险
    if (progress < 30) {
      risks.push({
        type: 'progress',
        level: 'high',
        description: '学习进度明显落后，需要加强指导'
      });
    } else if (progress < 60) {
      risks.push({
        type: 'progress',
        level: 'medium',
        description: '学习进度有所滞后，建议关注'
      });
    }
    
    // 学习时长不足
    if (studyTime < 20) {
      risks.push({
        type: 'time',
        level: 'medium',
        description: '学习时长不足，建议增加学习投入'
      });
    }
    
    // 任务逾期风险
    if (taskStatus === 'overdue') {
      risks.push({
        type: 'deadline',
        level: 'high',
        description: '任务已逾期，需要立即处理'
      });
    }
    
    return risks;
  }

  /**
   * 更新师徒关系状态
   */
  async updateRelationshipStatus(
    projectId: string,
    relationshipId: string,
    status: string,
    reason?: string,
    currentUserId?: string
  ) {
    console.log('📝 ProjectMentorshipService: 更新师徒关系状态 - 关系ID:', relationshipId, '新状态:', status);

    try {
      // 首先尝试在数据库中查找并更新关系
      const existingRelationship = await this.prisma.mentorshipRelationship.findUnique({
        where: { id: relationshipId }
      });

      let updatedRelationship;

      if (existingRelationship) {
        // 状态映射：前端状态 -> 数据库枚举值
        const statusMapping: Record<string, string> = {
          'active': 'ACTIVE',
          'paused': 'PAUSED', 
          'completed': 'COMPLETED',
          'graduated': 'COMPLETED', // 出师映射为COMPLETED
          'terminated': 'TERMINATED',
          'dismissed': 'TERMINATED' // 接触映射为TERMINATED
        };

        const dbStatus = statusMapping[status.toLowerCase()] || status.toUpperCase();

        // 准备更新数据
        const updateData: any = {
          status: dbStatus,
          updatedAt: new Date()
        };

        // 如果是终止或完成状态，设置终止/完成相关字段
        if (dbStatus === 'TERMINATED') {
          updateData.terminationReason = reason || '用户操作';
          updateData.terminationDate = new Date();
        } else if (dbStatus === 'COMPLETED') {
          updateData.actualDuration = Math.floor((new Date().getTime() - existingRelationship.establishedDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        // 在数据库中更新状态
        const dbUpdatedRelationship = await this.prisma.mentorshipRelationship.update({
          where: { id: relationshipId },
          data: updateData,
          include: {
            mentor: {
              select: { id: true, name: true, department: true, position: true }
            },
            student: {
              select: { id: true, name: true, department: true, position: true }
            }
          }
        });

        updatedRelationship = {
          id: dbUpdatedRelationship.id,
          projectId: dbUpdatedRelationship.projectId,
          mentorId: dbUpdatedRelationship.mentorId,
          studentId: dbUpdatedRelationship.studentId,
          type: dbUpdatedRelationship.scope,
          status: status, // 保持前端传入的小写格式
          establishedDate: dbUpdatedRelationship.establishedDate,
          mentor: dbUpdatedRelationship.mentor,
          student: dbUpdatedRelationship.student,
          mentorName: dbUpdatedRelationship.mentorName,
          studentName: dbUpdatedRelationship.studentName,
          matchingType: dbUpdatedRelationship.matchingType,
          matchingScore: dbUpdatedRelationship.matchingScore ? Number(dbUpdatedRelationship.matchingScore) : null,
          matchingReasons: Array.isArray(dbUpdatedRelationship.matchingReasons) ? dbUpdatedRelationship.matchingReasons : [],
          terminationReason: dbUpdatedRelationship.terminationReason,
          terminationDate: dbUpdatedRelationship.terminationDate,
          actualDuration: dbUpdatedRelationship.actualDuration
        };

        console.log('✅ 已更新数据库中的师徒关系状态 - 新状态:', status);
      } else {
        // 如果数据库中没有找到，则更新内存中的数据（向后兼容）
        if (this.createdRelationships.has(relationshipId)) {
          const relationship = this.createdRelationships.get(relationshipId);
          relationship.status = status;
          relationship.updatedAt = new Date();
          relationship.updatedBy = currentUserId || 'admin-001';
          relationship.statusReason = reason;
          
          // 更新存储的关系
          this.createdRelationships.set(relationshipId, relationship);
          console.log('✅ 已更新内存中的关系状态 - 新状态:', status);
        }

        updatedRelationship = {
          id: relationshipId,
          status: status,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUserId || 'admin-001',
          reason: reason
        };
      }

      console.log('✅ 师徒关系状态更新成功 - 新状态:', status);
      return updatedRelationship;
    } catch (error) {
      console.error('❌ 更新师徒关系状态失败:', error);
      throw new Error(`更新状态失败: ${error.message}`);
    }
  }

  /**
   * 更换师徒关系中的导师
   */
  async changeMentor(
    projectId: string,
    relationshipId: string,
    newMentorId: string,
    reason: string,
    currentUserId?: string
  ) {
    console.log('📝 ProjectMentorshipService: 更换师徒关系导师 - 关系ID:', relationshipId, '新导师ID:', newMentorId);

    try {
      // 验证新导师是否存在
      const newMentor = await this.prisma.user.findUnique({
        where: { id: newMentorId },
        select: { id: true, name: true, department: true, position: true }
      });

      if (!newMentor) {
        throw new Error('指定的导师不存在');
      }

      // 首先尝试在数据库中查找并更新关系
      const existingRelationship = await this.prisma.mentorshipRelationship.findUnique({
        where: { id: relationshipId }
      });

      let updatedRelationship;

      if (existingRelationship) {
        // 在数据库中更新导师信息
        const dbUpdatedRelationship = await this.prisma.mentorshipRelationship.update({
          where: { id: relationshipId },
          data: {
            mentorId: newMentorId,
            mentorName: newMentor.name,
            updatedAt: new Date()
          },
          include: {
            mentor: {
              select: { id: true, name: true, department: true, position: true }
            },
            student: {
              select: { id: true, name: true, department: true, position: true }
            }
          }
        });

        updatedRelationship = {
          id: dbUpdatedRelationship.id,
          projectId: dbUpdatedRelationship.projectId,
          mentorId: dbUpdatedRelationship.mentorId,
          studentId: dbUpdatedRelationship.studentId,
          type: dbUpdatedRelationship.scope,
          status: 'active',
          establishedDate: dbUpdatedRelationship.establishedDate,
          mentor: dbUpdatedRelationship.mentor,
          student: dbUpdatedRelationship.student,
          mentorName: dbUpdatedRelationship.mentorName,
          studentName: dbUpdatedRelationship.studentName,
          matchingType: dbUpdatedRelationship.matchingType,
          matchingScore: dbUpdatedRelationship.matchingScore ? Number(dbUpdatedRelationship.matchingScore) : null,
          matchingReasons: Array.isArray(dbUpdatedRelationship.matchingReasons) ? dbUpdatedRelationship.matchingReasons : []
        };

        console.log('✅ 已更新数据库中的师徒关系 - 新导师:', newMentor.name);
      } else {
        // 如果数据库中没有找到，则更新内存中的数据（向后兼容）
        if (this.createdRelationships.has(relationshipId)) {
          const relationship = this.createdRelationships.get(relationshipId);
          relationship.mentorId = newMentorId;
          relationship.mentor = newMentor;
          relationship.mentorName = newMentor.name;
          relationship.updatedAt = new Date();
          relationship.updatedBy = currentUserId || 'admin-001';
          relationship.changeReason = reason;
          
          // 更新存储的关系
          this.createdRelationships.set(relationshipId, relationship);
          console.log('✅ 已更新内存中的关系数据 - 新导师:', newMentor.name);
        }

        updatedRelationship = {
          id: relationshipId,
          mentorId: newMentorId,
          mentor: newMentor,
          mentorName: newMentor.name,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUserId || 'admin-001',
          changeReason: reason
        };
      }

      console.log('✅ 师徒关系导师更换成功 - 新导师:', newMentor.name);
      return updatedRelationship;
    } catch (error) {
      console.error('❌ 更换师徒关系导师失败:', error);
      throw new Error(`更换导师失败: ${error.message}`);
    }
  }

  /**
   * 删除师徒关系
   * 软删除：在数据库中更新状态为TERMINATED
   */
  async deleteRelationship(
    projectId: string,
    relationshipId: string,
    reason?: string,
    currentUserId?: string
  ) {
    console.log('🗑️ ProjectMentorshipService: 删除师徒关系 - 关系ID:', relationshipId);

    try {
      // 首先尝试在数据库中查找并更新关系
      const existingRelationship = await this.prisma.mentorshipRelationship.findUnique({
        where: { id: relationshipId }
      });

      if (existingRelationship) {
        // 在数据库中软删除：更新状态为TERMINATED
        const updatedRelationship = await this.prisma.mentorshipRelationship.update({
          where: { id: relationshipId },
          data: {
            status: 'TERMINATED',
            terminationReason: reason || '用户删除',
            terminationDate: new Date(),
            updatedAt: new Date()
          },
          include: {
            mentor: {
              select: { id: true, name: true, department: true, position: true }
            },
            student: {
              select: { id: true, name: true, department: true, position: true }
            }
          }
        });

        console.log('✅ 数据库中师徒关系已软删除 - ID:', relationshipId);

        return {
          id: updatedRelationship.id,
          status: 'deleted',
          deletedAt: updatedRelationship.terminationDate?.toISOString(),
          deletedBy: currentUserId || 'system',
          deleteReason: updatedRelationship.terminationReason,
          projectId: updatedRelationship.projectId,
          mentorId: updatedRelationship.mentorId,
          studentId: updatedRelationship.studentId
        };
      }

      // 如果数据库中没找到，检查内存中是否存在
      if (this.createdRelationships.has(relationshipId)) {
        // 从内存中删除
        this.createdRelationships.delete(relationshipId);
        console.log('✅ 内存中师徒关系已删除 - ID:', relationshipId);
      }

      // 将关系ID添加到已删除列表中（保持向后兼容）
      this.deletedRelationships.add(relationshipId);
      
      const deletedRelationship = {
        id: relationshipId,
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        deletedBy: currentUserId || 'system',
        deleteReason: reason || '用户删除'
      };

      console.log('✅ 师徒关系删除成功 - ID:', relationshipId);
      return deletedRelationship;
    } catch (error) {
      console.error('❌ 删除师徒关系失败:', error);
      throw new Error(`删除关系失败: ${error.message}`);
    }
  }

  // ===============================
  // 阶段指派模式相关方法
  // ===============================

  /**
   * 获取项目的师徒阶段列表
   */
  async getProjectMentorshipPhases(projectId: string, currentUserId?: string) {
    try {
      console.log('🔍 ProjectMentorshipService: 获取项目师徒阶段', projectId);

      // 1. 确保MentorshipProject存在
      let mentorshipProject = await this.prisma.mentorshipProject.findFirst({
        where: {
          sourceTrainingProjectId: projectId
        }
      });

      if (!mentorshipProject) {
        // 获取TrainingProject信息
        const trainingProject = await this.prisma.trainingProject.findUnique({
          where: { id: projectId },
          select: {
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            ownerId: true
          }
        });

        if (!trainingProject) {
          throw new Error('培训项目不存在');
        }

                // 获取用户信息用于创建MentorshipProject
        const ownerUser = await this.prisma.user.findUnique({
          where: { id: trainingProject.ownerId },
          select: { name: true }
        });

        // 创建MentorshipProject
        mentorshipProject = await this.prisma.mentorshipProject.create({
          data: {
            sourceTrainingProjectId: projectId,
            sourceTrainingProjectName: trainingProject.name,
            mentorId: trainingProject.ownerId,
            mentorName: ownerUser?.name || '项目负责人',
            studentId: trainingProject.ownerId, // 暂时使用项目负责人，后续可调整
            studentName: ownerUser?.name || '项目负责人',
            title: trainingProject.name,
            description: trainingProject.description || '',
            projectType: 'TRAINING_BASED',
            plannedDuration: 90, // 默认90天
            startDate: trainingProject.startDate || new Date(),
            plannedEndDate: trainingProject.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            status: 'DRAFT',
            createdBy: currentUserId || 'admin-001'
          }
        });

        console.log('✅ 创建MentorshipProject成功:', mentorshipProject.id);
      }

      // 2. 获取项目的培训阶段
      const trainingStages = await this.prisma.trainingStage.findMany({
        where: {
          projectId
        },
        orderBy: {
          orderIndex: 'asc'
        },
        include: {
          tasks: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              estimatedHours: true
            }
          }
        }
      });

      // 3. 获取或创建对应的师徒阶段
      const mentorshipPhases = [];

      for (const stage of trainingStages) {
        // 查找或创建对应的师徒阶段
        let mentorshipPhase = await this.prisma.mentorshipPhase.findFirst({
          where: {
            projectId: mentorshipProject.id, // 使用MentorshipProject的ID，与创建时保持一致
            name: stage.name
          }
        });

        if (!mentorshipPhase) {
          // 如果不存在，创建新的师徒阶段
          mentorshipPhase = await this.prisma.mentorshipPhase.create({
            data: {
              projectId: mentorshipProject.id, // 使用MentorshipProject的ID
              name: stage.name,
              description: stage.description || '',
              phaseNumber: stage.orderIndex + 1,
              plannedDuration: Math.max(1, Math.floor(stage.estimatedDuration / 7)), // 转换为周
              objectives: [],
              expectedOutcomes: [],
              keyActivities: [],
              successCriteria: [],
                             status: stage.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'
            }
          });
        }

        // 4. 获取该阶段的指派关系
        console.log('🔍 查询阶段指派关系 - MentorshipProject ID:', mentorshipProject.id, 'MentorshipPhase ID:', mentorshipPhase.id);
        
        const assignments = await this.prisma.mentorshipRelationship.findMany({
          where: {
            projectId: mentorshipProject.id, // 使用MentorshipProject的ID
            phaseId: mentorshipPhase.id, // 添加阶段ID过滤
            status: { not: 'TERMINATED' } // 排除已终止的关系
          },
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                department: true
              }
            },
            student: {
              select: {
                id: true,
                name: true,
                department: true
              }
            }
          }
        });

        console.log('🔍 查询到的师徒关系数量:', assignments.length);
        
        // 不再按导师分组，直接构建一对一师徒关系列表
        const oneToOneAssignments = assignments.map(assignment => {
          // 状态映射：数据库枚举值 -> 前端期望值
          const statusMapping: Record<string, string> = {
            'ACTIVE': 'active',
            'PAUSED': 'paused', 
            'COMPLETED': 'graduated', // 完成映射为已出师
            'TERMINATED': 'terminated',
            'PENDING': 'pending'
          };

          const frontendStatus = statusMapping[assignment.status] || assignment.status.toLowerCase();

          return {
            id: assignment.id, // 使用真实的师徒关系ID
            mentorId: assignment.mentorId,
            mentorName: assignment.mentor.name,
            mentorDepartment: assignment.mentor.department,
            mentorType: assignment.mentorType || 'department_assigned',
            studentId: assignment.studentId,
            studentName: assignment.student.name,
            studentDepartment: assignment.student.department,
            relationshipId: assignment.id, // 保存关系ID用于操作
            status: frontendStatus, // 使用映射后的状态
            establishedDate: assignment.establishedDate,
            scope: assignment.scope
          };
        });

        console.log('🔍 构建一对一师徒关系列表，数量:', oneToOneAssignments.length);

        mentorshipPhases.push({
          id: mentorshipPhase.id,
          name: mentorshipPhase.name,
          description: mentorshipPhase.description,
          status: mentorshipPhase.status,
          startDate: mentorshipPhase.startDate,
          endDate: mentorshipPhase.endDate,
          createdAt: mentorshipPhase.createdAt,
          assignments: oneToOneAssignments // 使用一对一列表
        });
      }

      console.log('✅ 获取师徒阶段成功，共', mentorshipPhases.length, '个阶段');
      return mentorshipPhases;

    } catch (error) {
      console.error('❌ 获取师徒阶段失败:', error);
      throw new Error(`获取师徒阶段失败: ${error.message}`);
    }
  }

    /**
   * 创建阶段指派
   */
  async createPhaseAssignment(
    projectId: string,
    phaseId: string,
    createDto: any,
    currentUserId?: string
  ) {
    try {
      console.log('🔍 ProjectMentorshipService: 创建阶段指派', { projectId, phaseId, createDto });

      // 1. 验证阶段是否存在
      const phase = await this.prisma.mentorshipPhase.findUnique({
        where: { id: phaseId }
      });

      if (!phase) {
        throw new Error('指定的阶段不存在');
      }

      // 2. 处理前端传递的指派数据
      const assignments = createDto.assignments || [];
      if (assignments.length === 0) {
        throw new Error('没有指派数据');
      }

      // 3. 获取MentorshipProject
      const mentorshipProject = await this.prisma.mentorshipProject.findUnique({
        where: { id: phase.projectId }
      });

      if (!mentorshipProject) {
        throw new Error('找不到对应的师徒项目');
      }

      // 4. 创建师徒关系
      const relationships = [];

      for (const assignment of assignments) {
        if (!assignment.mentorId || !assignment.studentIds || assignment.studentIds.length === 0) {
          console.log('跳过无效的指派数据:', assignment);
          continue;
        }

        // 验证导师是否存在
        const mentor = await this.prisma.user.findUnique({
          where: { id: assignment.mentorId }
        });

        if (!mentor) {
          throw new Error(`导师不存在: ${assignment.mentorId}`);
        }

        // 为每个学员创建师徒关系
        for (const studentId of assignment.studentIds) {
          const student = await this.prisma.user.findUnique({
            where: { id: studentId }
          });

          if (!student) {
            console.warn('学员不存在，跳过:', studentId);
            continue;
          }

          // 🔧 修复：检查是否已存在关系并使用upsert模式
          console.log('🔍 创建师徒关系 - MentorshipProject ID:', mentorshipProject.id, 'PhaseId:', phaseId, '导师:', assignment.mentorId, '学员:', studentId);
          
          // 使用upsert来处理可能的唯一约束冲突
          const relationship = await this.prisma.mentorshipRelationship.upsert({
            where: {
              uk_project_mentor_student: {
                projectId: mentorshipProject.id,
                mentorId: assignment.mentorId,
                studentId: studentId
              }
            },
            update: {
              // 如果记录已存在，更新为新的阶段关系
              phaseId: phaseId,
              scope: 'SPECIFIC_PHASE',
              status: 'ACTIVE',
              expectedDuration: phase.plannedDuration * 7,
              updatedAt: new Date()
            },
            create: {
              projectId: mentorshipProject.id,
              phaseId: phaseId,
              mentorId: assignment.mentorId,
              mentorName: mentor.name,
              mentorType: 'DEPARTMENT_ASSIGNED',
              studentId: studentId,
              studentName: student.name,
              relationshipType: 'ONE_TO_ONE',
              scope: 'SPECIFIC_PHASE',
              matchingType: 'MANUAL',
              establishedDate: new Date(),
              expectedDuration: phase.plannedDuration * 7,
              status: 'ACTIVE',
              createdBy: currentUserId || 'admin-001'
            }
          });

          console.log('✅ 师徒关系创建成功 - ID:', relationship.id);
          relationships.push(relationship);
        }
      }

      console.log('✅ 阶段指派创建成功，共创建', relationships.length, '个关系');
      return {
        phaseId,
        assignments: assignments.length,
        createdRelationships: relationships.length,
        relationships: relationships.map(r => ({
          id: r.id,
          mentorId: r.mentorId,
          mentorName: r.mentorName,
          studentId: r.studentId,
          studentName: r.studentName,
          status: r.status,
          establishedDate: r.establishedDate
        }))
      };

    } catch (error) {
      console.error('❌ 创建阶段指派失败:', error);
      throw new Error(`创建阶段指派失败: ${error.message}`);
    }
  }

  /**
   * 获取阶段的指派关系
   */
  async getPhaseAssignments(
    projectId: string,
    phaseId: string,
    currentUserId?: string
  ) {
    try {
      console.log('🔍 ProjectMentorshipService: 获取阶段指派', { projectId, phaseId });

      // 获取该阶段的所有师徒关系
      const relationships = await this.prisma.mentorshipRelationship.findMany({
        where: {
          projectId: `${projectId}-phase-${phaseId}`,
          status: { not: 'TERMINATED' }
        },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              department: true,
              email: true
            }
          },
          student: {
            select: {
              id: true,
              name: true,
              department: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 按导师分组
      const groupedByMentor = relationships.reduce((acc, rel) => {
        if (!acc[rel.mentorId]) {
          acc[rel.mentorId] = {
            mentorId: rel.mentorId,
            mentorName: rel.mentor.name,
            mentorDepartment: rel.mentor.department,
            students: []
          };
        }
        
        acc[rel.mentorId].students.push({
          relationshipId: rel.id,
          studentId: rel.studentId,
          studentName: rel.student.name,
          studentDepartment: rel.student.department,
          status: rel.status,
          establishedDate: rel.establishedDate
        });
        
        return acc;
      }, {});

      const assignments = Object.values(groupedByMentor);

      console.log('✅ 获取阶段指派成功，共', assignments.length, '个指派');
      return assignments;

    } catch (error) {
      console.error('❌ 获取阶段指派失败:', error);
      throw new Error(`获取阶段指派失败: ${error.message}`);
    }
  }

  /**
   * 删除阶段指派关系
   */
  async removePhaseAssignment(relationshipId: string, currentUserId?: string) {
    try {
      console.log('🔍 ProjectMentorshipService: 删除阶段指派', relationshipId);

      // 1. 查找关系
      const relationship = await this.prisma.mentorshipRelationship.findUnique({
        where: { id: relationshipId }
      });

      if (!relationship) {
        throw new Error('指定的师徒关系不存在');
      }

      // 2. 软删除（更新状态为TERMINATED）
      const updatedRelationship = await this.prisma.mentorshipRelationship.update({
        where: { id: relationshipId },
        data: {
          status: 'TERMINATED',
          terminationReason: '阶段指派解除',
          terminationDate: new Date()
        }
      });

      console.log('✅ 阶段指派删除成功');
      return {
        id: relationshipId,
        status: 'terminated',
        terminationDate: updatedRelationship.terminationDate
      };

    } catch (error) {
      console.error('❌ 删除阶段指派失败:', error);
      throw new Error(`删除阶段指派失败: ${error.message}`);
    }
  }

  /**
   * 删除带教评价
   */
  async deleteEvaluation(evaluationId: string, currentUserId?: string) {
    console.log('🗑️ ProjectMentorshipService: 删除带教评价 - 评价ID:', evaluationId);

    try {
      // 检查评价是否存在
      const evaluation = await this.prisma.mentorshipEvaluation.findUnique({
        where: { id: evaluationId },
        include: {
          relationship: {
            include: {
              mentor: { select: { id: true, name: true } },
              student: { select: { id: true, name: true } }
            }
          }
        }
      });

      if (!evaluation) {
        console.log('❌ 评价不存在:', evaluationId);
        throw new Error('评价不存在');
      }

      console.log('🔍 找到评价:', {
        id: evaluation.id,
        relationshipId: evaluation.relationshipId,
        evaluatorType: evaluation.evaluatorType,
        status: evaluation.status
      });

      // 删除评价
      await this.prisma.mentorshipEvaluation.delete({
        where: { id: evaluationId }
      });

      console.log('✅ 评价删除成功:', evaluationId);

      return {
        id: evaluationId,
        message: '评价删除成功'
      };

    } catch (error) {
      console.error('❌ 删除带教评价失败:', error);
      throw new Error(`删除带教评价失败: ${error.message}`);
    }
  }
} 