import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import {
  CreateMentorshipPlanDto,
  CreateMentorshipTaskDto,
  CreateMentorEvaluationDto,
  CreateInteractionDto,
  MentorDashboardQueryDto,
  StudentQueryDto,
  PlanQueryDto,
  TaskQueryDto,
  EvaluationQueryDto,
  ResourceQueryDto,
  CommunicationQueryDto,
  MentorDashboardStatsDto
} from '../dto/mentor-workbench.dto';

@Injectable()
export class MentorWorkbenchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取导师工作台概览
   */
  async getMentorDashboard(mentorId: string, queryDto: MentorDashboardQueryDto) {
    console.log('🔍 MentorWorkbenchService: 获取导师工作台概览 - 导师ID:', mentorId);

    try {
      // 🔧 使用Mock数据
      const mockDashboard = {
        mentorInfo: {
          id: mentorId,
          name: '冯芹',
          department: '人力资源部',
          position: '培训师',
          experience: '5年',
          specialties: ['新员工培训', '职业发展指导', '团队管理'],
        },
        statistics: {
          activeStudents: 8,
          totalStudents: 15,
          averageProgress: 72,
          pendingEvaluations: 3,
          completedEvaluations: 12,
          thisWeekCommunications: 15,
          pendingTasks: 5,
          completedTasks: 28,
          activeProjects: 4,
        },
        recentActivities: [
          {
            id: 'activity-001',
            type: 'evaluation',
            title: '吴静月度评价',
            studentName: '吴静',
            date: new Date().toISOString(),
            status: 'pending',
          },
          {
            id: 'activity-002',
            type: 'communication',
            title: '与李明沟通项目进展',
            studentName: '李明',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
          },
        ],
        upcomingTasks: [
          {
            id: 'task-001',
            title: '审阅吴静的项目报告',
            studentName: '吴静',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'HIGH',
            type: 'REVIEW',
          },
          {
            id: 'task-002',
            title: '制定下月带教计划',
            studentName: '李明',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'MEDIUM',
            type: 'PLANNING',
          },
        ],
      };

      console.log('✅ 获取导师工作台概览成功');
      return mockDashboard;
    } catch (error) {
      console.error('❌ 获取导师工作台概览失败:', error);
      throw new Error(`获取导师工作台概览失败: ${error.message}`);
    }
  }

  /**
   * 获取我的学员列表
   */
  async getMyStudents(mentorId: string, queryDto: StudentQueryDto) {
    console.log('🔍 MentorWorkbenchService: 获取我的学员列表 - 导师ID:', mentorId);

    try {
      // 🔧 使用Mock数据
      const mockStudents = [
        {
          id: 'user-market-001',
          name: '吴静',
          department: '市场部',
          position: '市场专员',
          joinedDate: '2025-01-15',
          projectName: '新员工入职培训',
          currentPhase: '实践阶段',
          overallProgress: 75,
          status: 'ACTIVE',
          lastCommunication: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          nextMilestone: '项目总结汇报',
          strengths: ['学习能力强', '沟通积极'],
          needsImprovement: ['实践经验需加强'],
          avatar: '/avatars/wujing.jpg',
        },
        {
          id: 'user-tech-005',
          name: '李明',
          department: '技术部',
          position: '初级工程师',
          joinedDate: '2025-01-20',
          projectName: '技术技能提升',
          currentPhase: '学习阶段',
          overallProgress: 60,
          status: 'ACTIVE',
          lastCommunication: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          nextMilestone: '技术考核',
          strengths: ['技术基础扎实'],
          needsImprovement: ['需要更多实战经验'],
          avatar: '/avatars/liming.jpg',
        },
      ];

      console.log('✅ 获取我的学员列表成功，数量:', mockStudents.length);
      return mockStudents;
    } catch (error) {
      console.error('❌ 获取我的学员列表失败:', error);
      throw new Error(`获取我的学员列表失败: ${error.message}`);
    }
  }

  /**
   * 获取学员详情
   */
  async getStudentDetail(mentorId: string, studentId: string) {
    console.log('🔍 MentorWorkbenchService: 获取学员详情 - 导师ID:', mentorId, '学员ID:', studentId);

    try {
      // 🔧 使用Mock数据
      const mockStudentDetail = {
        id: studentId,
        name: studentId === 'user-market-001' ? '吴静' : '李明',
        department: studentId === 'user-market-001' ? '市场部' : '技术部',
        position: studentId === 'user-market-001' ? '市场专员' : '初级工程师',
        email: `${studentId}@company.com`,
        phone: '138****8888',
        joinedDate: '2025-01-15',
        emergencyContact: '张女士 139****9999',
        
        // 项目信息
        currentProject: {
          id: 'proj-001',
          name: '新员工入职培训',
          startDate: '2025-01-15',
          expectedEndDate: '2025-04-15',
          progress: 75,
          currentPhase: '实践阶段',
        },

        // 学习进度
        learningProgress: {
          totalTasks: 12,
          completedTasks: 9,
          pendingTasks: 3,
          overallProgress: 75,
          phases: [
            { name: '基础学习', progress: 100, status: 'COMPLETED' },
            { name: '实践阶段', progress: 80, status: 'IN_PROGRESS' },
            { name: '总结汇报', progress: 0, status: 'PENDING' },
          ],
        },

        // 评价历史
        evaluationHistory: [
          {
            id: 'eval-001',
            period: 'MONTHLY',
            date: '2025-01-31',
            overallScore: 4.2,
            strengths: ['学习态度积极', '沟通能力强'],
            improvements: ['需要加强实践经验'],
            evaluator: '冯芹',
          },
        ],

        // 沟通记录
        communicationRecords: [
          {
            id: 'comm-001',
            type: 'MEETING',
            date: '2025-02-15',
            duration: 60,
            topic: '项目进度讨论',
            summary: '讨论了当前项目进展，制定了下一步计划',
            actionItems: ['完成市场调研报告', '准备客户访谈'],
          },
        ],

        // 个人档案
        personalProfile: {
          education: '本科 - 市场营销',
          previousExperience: '2年销售经验',
          careerGoals: ['成为资深市场专员', '学习数字营销'],
          interests: ['数据分析', '用户体验'],
          learningStyle: '视觉学习者',
          preferredCommunication: '面对面交流',
        },
      };

      console.log('✅ 获取学员详情成功');
      return mockStudentDetail;
    } catch (error) {
      console.error('❌ 获取学员详情失败:', error);
      throw new Error(`获取学员详情失败: ${error.message}`);
    }
  }

  /**
   * 获取带教计划
   */
  async getMentorshipPlans(mentorId: string, queryDto: PlanQueryDto) {
    console.log('🔍 MentorWorkbenchService: 获取带教计划 - 导师ID:', mentorId);

    try {
      // 🔧 使用Mock数据
      const mockPlans = [
        {
          id: 'plan-001',
          planTitle: '吴静个人发展计划',
          projectId: 'proj-001',
          relationshipId: 'rel-001',
          studentName: '吴静',
          overallGoal: '培养综合市场能力，成为独立的市场专员',
          totalDuration: 90,
          plannedStartDate: '2025-01-15',
          plannedEndDate: '2025-04-15',
          currentProgress: 75,
          status: 'ACTIVE',
          specificObjectives: [
            '掌握市场调研方法',
            '学会数据分析技能',
            '提升客户沟通能力',
            '了解产品营销策略',
          ],
          expectedOutcomes: [
            '能独立完成市场调研',
            '能制作专业的数据报告',
            '能有效进行客户沟通',
          ],
          createdAt: '2025-01-15',
          lastUpdated: '2025-02-15',
        },
      ];

      console.log('✅ 获取带教计划成功，数量:', mockPlans.length);
      return mockPlans;
    } catch (error) {
      console.error('❌ 获取带教计划失败:', error);
      throw new Error(`获取带教计划失败: ${error.message}`);
    }
  }

  /**
   * 创建带教计划
   */
  async createMentorshipPlan(createDto: CreateMentorshipPlanDto) {
    console.log('📝 MentorWorkbenchService: 创建带教计划 - 数据:', createDto);

    try {
      // 🔧 使用Mock返回
      const mockPlan = {
        id: `plan-${Date.now()}`,
        ...createDto,
        status: 'DRAFT',
        currentProgress: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      console.log('✅ 带教计划创建成功 - ID:', mockPlan.id);
      return mockPlan;
    } catch (error) {
      console.error('❌ 创建带教计划失败:', error);
      throw new Error(`创建带教计划失败: ${error.message}`);
    }
  }

  /**
   * 获取带教任务
   */
  async getMentorshipTasks(mentorId: string, queryDto: TaskQueryDto) {
    console.log('🔍 MentorWorkbenchService: 获取带教任务 - 导师ID:', mentorId);

    try {
      // 🔧 使用Mock数据
      const mockTasks = [
        {
          id: 'task-001',
          title: '市场调研报告',
          description: '完成目标客户群体的市场调研分析',
          taskType: 'PRACTICE',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          assignedTo: 'STUDENT',
          studentName: '吴静',
          projectName: '新员工入职培训',
          estimatedHours: 20,
          actualHours: 15,
          progress: 75,
          dueDate: '2025-02-20',
          startedAt: '2025-02-10',
          requirements: [
            '调研至少50个潜在客户',
            '分析客户需求和偏好',
            '制作专业的PPT报告',
          ],
          deliverables: [
            '市场调研数据表',
            '分析报告PPT',
            '客户画像文档',
          ],
          createdAt: '2025-02-08',
        },
        {
          id: 'task-002',
          title: '技术文档审阅',
          description: '审阅学员提交的技术方案文档',
          taskType: 'REVIEW',
          priority: 'MEDIUM',
          status: 'PENDING',
          assignedTo: 'MENTOR',
          studentName: '李明',
          projectName: '技术技能提升',
          estimatedHours: 5,
          progress: 0,
          dueDate: '2025-02-18',
          requirements: [
            '检查技术方案的可行性',
            '提供详细的反馈意见',
            '给出改进建议',
          ],
          deliverables: [
            '审阅报告',
            '改进建议文档',
          ],
          createdAt: '2025-02-15',
        },
      ];

      console.log('✅ 获取带教任务成功，数量:', mockTasks.length);
      return mockTasks;
    } catch (error) {
      console.error('❌ 获取带教任务失败:', error);
      throw new Error(`获取带教任务失败: ${error.message}`);
    }
  }

  /**
   * 创建带教任务
   */
  async createMentorshipTask(createDto: CreateMentorshipTaskDto) {
    console.log('📝 MentorWorkbenchService: 创建带教任务 - 数据:', createDto);

    try {
      // 🔧 使用Mock返回
      const mockTask = {
        id: `task-${Date.now()}`,
        ...createDto,
        status: 'PENDING',
        progress: 0,
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
      };

      console.log('✅ 带教任务创建成功 - ID:', mockTask.id);
      return mockTask;
    } catch (error) {
      console.error('❌ 创建带教任务失败:', error);
      throw new Error(`创建带教任务失败: ${error.message}`);
    }
  }

  /**
   * 获取导师评价
   */
  async getMentorEvaluations(mentorId: string, queryDto: EvaluationQueryDto) {
    console.log('🔍 MentorWorkbenchService: 获取导师评价 - 导师ID:', mentorId);

    try {
      // 🔧 使用Mock数据
      const mockEvaluations = [
        {
          id: 'eval-001',
          projectId: 'proj-001',
          relationshipId: 'rel-001',
          studentName: '吴静',
          evaluationType: 'REGULAR',
          evaluationTitle: '二月份阶段性评价',
          evaluationPeriod: 'MONTHLY',
          technicalSkillsScore: 4.2,
          communicationScore: 4.5,
          learningAttitudeScore: 4.8,
          problemSolvingScore: 4.0,
          collaborationScore: 4.3,
          overallScore: 4.36,
          strengths: '学习能力强，态度积极主动，沟通表达清晰',
          improvementAreas: '需要加强实践经验，提高解决复杂问题的能力',
          specificFeedback: '本月表现整体良好，在市场调研项目中展现了不错的分析能力。建议多参与实际客户接触，提升实战经验。',
          suggestions: '下月重点关注客户沟通技巧的提升',
          nextPhaseGoals: ['完成客户访谈', '制作产品推广方案'],
          status: 'SUBMITTED',
          evaluationDate: '2025-02-28',
          createdAt: '2025-02-28',
        },
      ];

      console.log('✅ 获取导师评价成功，数量:', mockEvaluations.length);
      return mockEvaluations;
    } catch (error) {
      console.error('❌ 获取导师评价失败:', error);
      throw new Error(`获取导师评价失败: ${error.message}`);
    }
  }

  /**
   * 提交导师评价
   */
  async submitMentorEvaluation(createDto: CreateMentorEvaluationDto) {
    console.log('📝 MentorWorkbenchService: 提交导师评价 - 数据:', createDto);

    try {
      // 🔧 使用Mock返回
      const mockEvaluation = {
        id: `eval-${Date.now()}`,
        ...createDto,
        evaluatorName: '冯芹',
        evaluateeName: '学员姓名',
        status: 'SUBMITTED',
        evaluationDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      console.log('✅ 导师评价提交成功 - ID:', mockEvaluation.id);
      return mockEvaluation;
    } catch (error) {
      console.error('❌ 提交导师评价失败:', error);
      throw new Error(`提交导师评价失败: ${error.message}`);
    }
  }

  /**
   * 获取带教资源
   */
  async getMentorshipResources(mentorId: string, queryDto: ResourceQueryDto) {
    console.log('🔍 MentorWorkbenchService: 获取带教资源 - 导师ID:', mentorId);

    try {
      // 🔧 使用Mock数据
      const mockResources = [
        {
          id: 'res-001',
          title: '新员工培训手册',
          description: '详细的新员工入职培训指导手册',
          category: 'TRAINING_MATERIALS',
          resourceType: 'DOCUMENT',
          fileUrl: '/resources/training-manual.pdf',
          fileSize: '2.5MB',
          downloadCount: 156,
          tags: ['新员工', '培训', '手册'],
          createdAt: '2025-01-01',
          updatedAt: '2025-02-01',
        },
        {
          id: 'res-002',
          title: '市场分析模板',
          description: '标准的市场调研分析Excel模板',
          category: 'TEMPLATES',
          resourceType: 'SPREADSHEET',
          fileUrl: '/resources/market-analysis-template.xlsx',
          fileSize: '156KB',
          downloadCount: 89,
          tags: ['市场分析', '模板', 'Excel'],
          createdAt: '2025-01-15',
          updatedAt: '2025-01-15',
        },
        {
          id: 'res-003',
          title: '沟通技巧培训视频',
          description: '职场沟通技巧在线培训视频课程',
          category: 'VIDEO_COURSES',
          resourceType: 'VIDEO',
          fileUrl: '/resources/communication-skills.mp4',
          duration: '45分钟',
          viewCount: 234,
          tags: ['沟通技巧', '视频', '培训'],
          createdAt: '2025-01-20',
          updatedAt: '2025-01-20',
        },
      ];

      console.log('✅ 获取带教资源成功，数量:', mockResources.length);
      return mockResources;
    } catch (error) {
      console.error('❌ 获取带教资源失败:', error);
      throw new Error(`获取带教资源失败: ${error.message}`);
    }
  }

  /**
   * 获取沟通记录
   */
  async getCommunicationRecords(mentorId: string, queryDto: CommunicationQueryDto) {
    console.log('🔍 MentorWorkbenchService: 获取沟通记录 - 导师ID:', mentorId);

    try {
      // 🔧 使用Mock数据
      const mockCommunications = [
        {
          id: 'comm-001',
          studentId: 'user-market-001',
          studentName: '吴静',
          interactionType: 'MEETING',
          title: '月度进度回顾会议',
          interactionDate: '2025-02-15',
          startTime: '14:00',
          endTime: '15:30',
          duration: 90,
          method: 'FACE_TO_FACE',
          location: '会议室A',
          topics: ['项目进展回顾', '下阶段计划', '问题解决'],
          content: '回顾了吴静本月的学习进展，讨论了市场调研项目的完成情况，制定了下月的学习计划。吴静在沟通表达方面有明显进步，需要继续加强实践经验。',
          actionItems: [
            '完成客户访谈计划制定',
            '准备下周的项目汇报',
            '阅读推荐的市场分析书籍',
          ],
          effectivenessRating: 4.5,
          status: 'COMPLETED',
          createdAt: '2025-02-15',
        },
        {
          id: 'comm-002',
          studentId: 'user-market-001',
          studentName: '吴静',
          interactionType: 'GUIDANCE',
          title: '项目难点指导',
          interactionDate: '2025-02-12',
          startTime: '10:00',
          endTime: '10:45',
          duration: 45,
          method: 'VIDEO_CALL',
          location: '线上',
          topics: ['数据分析方法', '报告撰写技巧'],
          content: '针对吴静在数据分析中遇到的困难进行了详细指导，教授了Excel高级功能的使用方法，帮助她更好地处理调研数据。',
          actionItems: [
            '练习Excel数据透视表',
            '完成数据分析案例练习',
          ],
          effectivenessRating: 4.8,
          status: 'COMPLETED',
          createdAt: '2025-02-12',
        },
      ];

      console.log('✅ 获取沟通记录成功，数量:', mockCommunications.length);
      return mockCommunications;
    } catch (error) {
      console.error('❌ 获取沟通记录失败:', error);
      throw new Error(`获取沟通记录失败: ${error.message}`);
    }
  }

  /**
   * 记录师徒交互
   */
  async recordInteraction(createDto: CreateInteractionDto) {
    console.log('📝 MentorWorkbenchService: 记录师徒交互 - 数据:', createDto);

    try {
      // 🔧 使用Mock返回
      const mockInteraction = {
        id: `interaction-${Date.now()}`,
        ...createDto,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('✅ 师徒交互记录成功 - ID:', mockInteraction.id);
      return mockInteraction;
    } catch (error) {
      console.error('❌ 记录师徒交互失败:', error);
      throw new Error(`记录师徒交互失败: ${error.message}`);
    }
  }
} 