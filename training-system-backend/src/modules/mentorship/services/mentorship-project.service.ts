import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import {
  CreateMentorshipProjectDto,
  UpdateMentorshipProjectDto,
  ProjectQueryDto,
  ProjectStatisticsQueryDto,
} from '../dto/mentorship-project.dto';

@Injectable()
export class MentorshipProjectService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取带教项目列表（分页）
   */
  async findAll(queryDto: ProjectQueryDto) {
    console.log('🔍 MentorshipProjectService: 获取带教项目列表 - 参数:', queryDto);

    try {
      // 🔧 使用Mock数据
      const mockProjects = [
        {
          id: 'mp-001',
          title: '新员工综合带教项目',
          description: '针对新入职员工的全方位带教培养项目',
          projectType: 'training_based',
          status: 'active',
          department: '人力资源部',
          objectives: [
            '快速适应公司文化',
            '掌握基本业务技能',
            '建立职业发展规划',
          ],
          expectedOutcomes: [
            '能独立完成基础工作',
            '具备团队协作能力',
            '明确职业发展方向',
          ],
          plannedDuration: 90,
          plannedStartDate: '2025-01-01',
          plannedEndDate: '2025-03-31',
          mentorRequirements: ['3年以上工作经验', '具备培训能力'],
          studentRequirements: ['新入职6个月内', '积极学习态度'],
          participantCount: 15,
          mentorCount: 5,
          completionRate: 0.73,
          createdBy: 'admin',
          createdAt: '2025-01-01',
          updatedAt: '2025-02-15',
        },
        {
          id: 'mp-002',
          title: '销售技能专项提升',
          description: '针对销售人员的专业技能提升带教项目',
          projectType: 'skill_development',
          status: 'active',
          department: '销售部',
          objectives: [
            '提升销售沟通技巧',
            '掌握客户关系管理',
            '提高成交转化率',
          ],
          expectedOutcomes: [
            '销售业绩提升30%',
            '客户满意度提升',
            '建立稳定客户群',
          ],
          plannedDuration: 60,
          plannedStartDate: '2025-02-01',
          plannedEndDate: '2025-03-31',
          mentorRequirements: ['销售经验5年以上', '业绩表现优秀'],
          studentRequirements: ['销售岗位1年以上', '有提升意愿'],
          participantCount: 8,
          mentorCount: 3,
          completionRate: 0.45,
          createdBy: 'admin',
          createdAt: '2025-02-01',
          updatedAt: '2025-02-15',
        },
      ];

      // 模拟分页和筛选
      let filteredProjects = mockProjects;

      if (queryDto.status) {
        filteredProjects = filteredProjects.filter(p => p.status === queryDto.status);
      }

      if (queryDto.type) {
        filteredProjects = filteredProjects.filter(p => p.projectType === queryDto.type);
      }

      if (queryDto.search) {
        filteredProjects = filteredProjects.filter(p => 
          p.title.includes(queryDto.search) || 
          p.description.includes(queryDto.search)
        );
      }

      const total = filteredProjects.length;
      const startIndex = (queryDto.page - 1) * queryDto.limit;
      const endIndex = startIndex + queryDto.limit;
      const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

      const result = {
        data: paginatedProjects,
        pagination: {
          page: queryDto.page,
          limit: queryDto.limit,
          total,
          pages: Math.ceil(total / queryDto.limit),
        },
      };

      console.log('✅ 获取带教项目列表成功，总数:', total);
      return result;
    } catch (error) {
      console.error('❌ 获取带教项目列表失败:', error);
      throw new Error(`获取带教项目列表失败: ${error.message}`);
    }
  }

  /**
   * 获取带教项目详情
   */
  async findOne(id: string, currentUserId?: string) {
    console.log('🔍 MentorshipProjectService: 获取带教项目详情 - ID:', id);

    try {
      // 🔧 使用Mock数据
      if (id === 'mp-001') {
        const mockProject = {
          id: 'mp-001',
          title: '新员工综合带教项目',
          description: '针对新入职员工的全方位带教培养项目，包括公司文化、业务技能、职业发展等多个维度的培养。',
          projectType: 'training_based',
          status: 'active',
          department: '人力资源部',
          objectives: [
            '快速适应公司文化和工作环境',
            '掌握岗位基本业务技能',
            '建立清晰的职业发展规划',
            '培养团队协作能力',
          ],
          expectedOutcomes: [
            '能独立完成基础工作任务',
            '具备良好的团队协作能力',
            '明确个人职业发展方向',
            '建立稳定的工作关系网络',
          ],
          plannedDuration: 90,
          actualDuration: 85,
          plannedStartDate: '2025-01-01',
          plannedEndDate: '2025-03-31',
          actualStartDate: '2025-01-01',
          actualEndDate: null,
          mentorRequirements: [
            '3年以上相关工作经验',
            '具备培训指导能力',
            '良好的沟通表达能力',
            '积极的工作态度',
          ],
          studentRequirements: [
            '新入职员工（6个月内）',
            '积极主动的学习态度',
            '良好的学习能力',
            '遵守公司规章制度',
          ],
          participantCount: 15,
          mentorCount: 5,
          completionRate: 0.73,
          averageRating: 4.5,
          
          // 详细的阶段规划
          phases: [
            {
              id: 'phase-001',
              name: '入职适应期',
              duration: 30,
              objectives: ['了解公司文化', '熟悉工作环境'],
              status: 'completed',
            },
            {
              id: 'phase-002',
              name: '技能学习期',
              duration: 45,
              objectives: ['掌握基础技能', '完成实践项目'],
              status: 'in_progress',
            },
            {
              id: 'phase-003',
              name: '独立工作期',
              duration: 15,
              objectives: ['独立完成工作', '总结提升'],
              status: 'pending',
            },
          ],

          // 参与人员
          participants: [
            {
              id: 'user-market-001',
              name: '吴静',
              role: 'student',
              department: '市场部',
              joinDate: '2025-01-15',
              progress: 75,
              status: 'active',
            },
            {
              id: 'user-tech-005',
              name: '李明',
              role: 'student',
              department: '技术部',
              joinDate: '2025-01-20',
              progress: 60,
              status: 'active',
            },
            {
              id: 'user-hr-001',
              name: '冯芹',
              role: 'mentor',
              department: '人力资源部',
              studentCount: 3,
              experience: '5年',
            },
          ],

          // 项目统计
          statistics: {
            totalRelationships: 15,
            activeRelationships: 11,
            completedRelationships: 4,
            averageProgress: 73,
            totalTasks: 156,
            completedTasks: 114,
            pendingEvaluations: 8,
            completedEvaluations: 47,
          },

          createdBy: 'admin',
          createdAt: '2025-01-01',
          updatedAt: '2025-02-15',
        };

        console.log('✅ 获取带教项目详情成功');
        return mockProject;
      }

      // 其他项目的Mock数据
      const mockProject = {
        id: id,
        title: '带教项目示例',
        description: '这是一个示例带教项目',
        projectType: 'training_based',
        status: 'active',
        department: '示例部门',
        participantCount: 5,
        mentorCount: 2,
        completionRate: 0.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('✅ 获取带教项目详情成功');
      return mockProject;
    } catch (error) {
      console.error('❌ 获取带教项目详情失败:', error);
      throw new Error(`获取带教项目详情失败: ${error.message}`);
    }
  }

  /**
   * 创建带教项目
   */
  async create(createDto: CreateMentorshipProjectDto) {
    console.log('📝 MentorshipProjectService: 创建带教项目 - 数据:', createDto);

    try {
      // 🔧 使用Mock返回
      const mockProject = {
        id: `mp-${Date.now()}`,
        ...createDto,
        status: createDto.status || 'draft',
        participantCount: 0,
        mentorCount: 0,
        completionRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('✅ 带教项目创建成功 - ID:', mockProject.id);
      return mockProject;
    } catch (error) {
      console.error('❌ 创建带教项目失败:', error);
      throw new Error(`创建带教项目失败: ${error.message}`);
    }
  }

  /**
   * 更新带教项目
   */
  async update(id: string, updateDto: UpdateMentorshipProjectDto) {
    console.log('📝 MentorshipProjectService: 更新带教项目 - ID:', id, '数据:', updateDto);

    try {
      // 先检查项目是否存在
      const existingProject = await this.findOne(id);
      if (!existingProject) {
        throw new NotFoundException('带教项目不存在');
      }

      // 🔧 使用Mock返回
      const mockProject = {
        ...existingProject,
        ...updateDto,
        updatedAt: new Date().toISOString(),
      };

      console.log('✅ 带教项目更新成功 - ID:', id);
      return mockProject;
    } catch (error) {
      console.error('❌ 更新带教项目失败:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`更新带教项目失败: ${error.message}`);
    }
  }

  /**
   * 删除带教项目
   */
  async remove(id: string, currentUserId?: string) {
    console.log('🗑️ MentorshipProjectService: 删除带教项目 - ID:', id);

    try {
      // 先检查项目是否存在
      const existingProject = await this.findOne(id);
      if (!existingProject) {
        throw new NotFoundException('带教项目不存在');
      }

      // 🔧 Mock删除操作
      console.log('✅ 带教项目删除成功 - ID:', id);
      return { deleted: true, id };
    } catch (error) {
      console.error('❌ 删除带教项目失败:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`删除带教项目失败: ${error.message}`);
    }
  }

  /**
   * 批量删除带教项目
   */
  async batchRemove(ids: string[], currentUserId?: string) {
    console.log('🗑️ MentorshipProjectService: 批量删除带教项目 - IDs:', ids);

    try {
      // 🔧 Mock批量删除
      const result = {
        deleted: ids.length,
        failed: 0,
        ids: ids,
      };

      console.log('✅ 批量删除带教项目成功，删除数量:', ids.length);
      return result;
    } catch (error) {
      console.error('❌ 批量删除带教项目失败:', error);
      throw new Error(`批量删除带教项目失败: ${error.message}`);
    }
  }

  /**
   * 获取项目统计信息
   */
  async getStatistics(queryDto: ProjectStatisticsQueryDto) {
    console.log('📊 MentorshipProjectService: 获取带教项目统计 - 参数:', queryDto);

    try {
      // 🔧 使用Mock统计数据
      const mockStatistics = {
        overview: {
          totalProjects: 5,
          activeProjects: 3,
          completedProjects: 2,
          draftProjects: 0,
          pausedProjects: 0,
          cancelledProjects: 0,
        },
        participants: {
          totalMentors: 8,
          activeMentors: 6,
          totalStudents: 23,
          activeStudents: 19,
          averageStudentsPerMentor: 3.2,
        },
        progress: {
          averageCompletionRate: 0.64,
          totalRelationships: 23,
          activeRelationships: 19,
          completedRelationships: 4,
        },
        tasks: {
          totalTasks: 256,
          completedTasks: 183,
          pendingTasks: 73,
          averageTasksPerStudent: 11.1,
        },
        evaluations: {
          totalEvaluations: 89,
          pendingEvaluations: 12,
          averageRating: 4.3,
          satisfactionRate: 0.92,
        },
        timeStats: {
          averageProjectDuration: 78,
          quickestCompletion: 45,
          longestActive: 120,
        },
        departmentStats: [
          { department: '人力资源部', projects: 2, students: 8 },
          { department: '销售部', projects: 1, students: 6 },
          { department: '技术部', projects: 1, students: 5 },
          { department: '市场部', projects: 1, students: 4 },
        ],
        monthlyTrends: [
          { month: '2025-01', newProjects: 3, completedProjects: 0 },
          { month: '2025-02', newProjects: 2, completedProjects: 1 },
          { month: '2025-03', newProjects: 0, completedProjects: 1 },
        ],
      };

      console.log('✅ 获取带教项目统计成功');
      return mockStatistics;
    } catch (error) {
      console.error('❌ 获取带教项目统计失败:', error);
      throw new Error(`获取带教项目统计失败: ${error.message}`);
    }
  }
} 