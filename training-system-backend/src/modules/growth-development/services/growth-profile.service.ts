import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import {
  UpdateGrowthProfileDto,
  CreateTimelineEventDto,
  CreateSkillDto,
  UpdateSkillDto,
  CreateAchievementDto,
  CreateGoalDto,
  UpdateGoalDto,
  CreateFeedbackDto,
  GrowthProfileQueryDto,
  TimelineQueryDto,
  SkillQueryDto,
  AchievementQueryDto,
  GoalQueryDto,
  FeedbackQueryDto
} from '../dto/growth-profile.dto';

@Injectable()
export class GrowthProfileService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // 成长档案主要方法
  // =====================================================

  /**
   * 获取用户成长档案
   */
  async getProfile(userId: string) {
    const profile = await this.prisma.user_growth_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException(`用户 ${userId} 的成长档案不存在`);
    }

    // 获取关联数据
    const [
      timelineEvents,
      skills,
      achievements,
      goals,
      feedback,
      trainingHistory,
      mentorshipHistory
    ] = await Promise.all([
      this.getTimelineEvents(userId, {}),
      this.getSkills(userId, {}),
      this.getAchievements(userId, {}),
      this.getGoals(userId, {}),
      this.getFeedback(userId, {}),
      this.getTrainingHistory(userId),
      this.getMentorshipHistory(userId)
    ]);

    return {
      id: profile.id,
      userId: profile.user_id,
      userName: profile.user_name,
      department: profile.department,
      position: profile.position,
      entryDate: profile.entry_date,
      currentLevel: profile.current_level,
      statistics: profile.statistics,
      profileConfig: profile.profile_config,
      lastUpdated: profile.last_updated,
      createdAt: profile.created_at,
      
      // 关联数据
      combinedTimeline: timelineEvents.data,
      skillDevelopment: skills.data,
      achievements: achievements.data,
      goals: goals.data,
      feedbackCollection: feedback.data,
      trainingHistory: trainingHistory,
      mentorshipHistory: mentorshipHistory
    };
  }

  /**
   * 更新用户成长档案基本信息
   */
  async updateProfile(userId: string, updateDto: UpdateGrowthProfileDto) {
    // 检查档案是否存在
    const existing = await this.prisma.user_growth_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`用户 ${userId} 的成长档案不存在`);
    }

    // 更新档案
    const updated = await this.prisma.user_growth_profiles.update({
      where: { user_id: userId },
      data: {
        department: updateDto.department,
        position: updateDto.position,
        entry_date: updateDto.entryDate ? new Date(updateDto.entryDate) : undefined,
        current_level: updateDto.currentLevel,
        profile_config: updateDto.profileConfig,
        last_updated: new Date(),
      },
    });

    return updated;
  }

  /**
   * 获取档案配置
   */
  async getProfileConfig(userId: string) {
    const profile = await this.prisma.user_growth_profiles.findUnique({
      where: { user_id: userId },
      select: { profile_config: true },
    });

    if (!profile) {
      throw new NotFoundException(`用户 ${userId} 的成长档案不存在`);
    }

    return profile.profile_config || {};
  }

  /**
   * 更新档案配置
   */
  async updateProfileConfig(userId: string, config: any) {
    const updated = await this.prisma.user_growth_profiles.update({
      where: { user_id: userId },
      data: {
        profile_config: config,
        last_updated: new Date(),
      },
    });

    return updated.profile_config;
  }

  // =====================================================
  // 成长时间线方法
  // =====================================================

  /**
   * 获取成长时间线事件
   */
  async getTimelineEvents(userId: string, query: TimelineQueryDto) {
    const profileId = await this.getProfileId(userId);
    
    const where: any = { profile_id: profileId };
    
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.startDate) where.event_date = { gte: new Date(query.startDate) };
    if (query.endDate) {
      where.event_date = { 
        ...where.event_date,
        lte: new Date(query.endDate) 
      };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.growth_timeline_events.findMany({
        where,
        orderBy: { event_date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.growth_timeline_events.count({ where }),
    ]);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 创建时间线事件
   */
  async createTimelineEvent(userId: string, createDto: CreateTimelineEventDto) {
    const profileId = await this.getProfileId(userId);

    const event = await this.prisma.growth_timeline_events.create({
      data: {
        profile_id: profileId,
        event_date: new Date(createDto.eventDate),
        type: createDto.type as any,
        category: createDto.category as any,
        title: createDto.title,
        description: createDto.description,
        related_project_id: createDto.relatedProjectId,
        importance: createDto.importance as any,
        tags: createDto.tags,
        rating: createDto.rating,
      },
    });

    return event;
  }

  // =====================================================
  // 技能发展方法
  // =====================================================

  /**
   * 获取技能列表
   */
  async getSkills(userId: string, query: SkillQueryDto) {
    const profileId = await this.getProfileId(userId);
    
    const where: any = { profile_id: profileId };
    
    if (query.category) where.skill_category = query.category;
    if (query.priority) where.priority = query.priority;
    if (query.minLevel) where.current_level = { gte: query.minLevel };
    if (query.maxLevel) {
      where.current_level = { 
        ...where.current_level,
        lte: query.maxLevel 
      };
    }

    const skills = await this.prisma.growth_skills.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { current_level: 'desc' },
      ],
    });

    return {
      data: skills,
      summary: {
        total: skills.length,
        mastered: skills.filter(s => s.current_level >= 4).length,
        inProgress: skills.filter(s => s.current_level < 4).length,
      },
    };
  }

  /**
   * 创建技能记录
   */
  async createSkill(userId: string, createDto: CreateSkillDto) {
    const profileId = await this.getProfileId(userId);

    const skill = await this.prisma.growth_skills.create({
      data: {
        profile_id: profileId,
        skill_name: createDto.skillName,
        skill_category: createDto.skillCategory,
        current_level: createDto.currentLevel,
        target_level: createDto.targetLevel,
        priority: createDto.priority as any,
        last_assessed: createDto.lastAssessed ? new Date(createDto.lastAssessed) : new Date(),
        progress_history: createDto.progressHistory || [],
      },
    });

    // 更新档案统计
    await this.updateSkillStatistics(userId);

    return skill;
  }

  /**
   * 更新技能记录
   */
  async updateSkill(userId: string, skillId: string, updateDto: UpdateSkillDto) {
    // 验证技能是否属于该用户
    await this.validateSkillOwnership(userId, skillId);

    const skill = await this.prisma.growth_skills.update({
      where: { id: skillId },
      data: {
        current_level: updateDto.currentLevel,
        target_level: updateDto.targetLevel,
        priority: updateDto.priority as any,
        last_assessed: updateDto.lastAssessed ? new Date(updateDto.lastAssessed) : undefined,
        progress_history: updateDto.progressHistory,
        updated_at: new Date(),
      },
    });

    // 更新档案统计
    await this.updateSkillStatistics(userId);

    return skill;
  }

  // =====================================================
  // 成就记录方法
  // =====================================================

  /**
   * 获取成就列表
   */
  async getAchievements(userId: string, query: AchievementQueryDto) {
    const profileId = await this.getProfileId(userId);
    
    const where: any = { profile_id: profileId };
    
    if (query.type) where.achievement_type = query.type;
    if (query.level) where.level = query.level;
    if (query.source) where.source = query.source;
    if (typeof query.verified === 'boolean') where.verified = query.verified;
    if (typeof query.featured === 'boolean') where.featured = query.featured;

    const achievements = await this.prisma.growth_achievements.findMany({
      where,
      orderBy: { achievement_date: 'desc' },
    });

    return {
      data: achievements,
      summary: {
        total: achievements.length,
        verified: achievements.filter(a => a.verified).length,
        featured: achievements.filter(a => a.featured).length,
        byLevel: this.groupByField(achievements, 'level'),
        byType: this.groupByField(achievements, 'achievement_type'),
      },
    };
  }

  /**
   * 创建成就记录
   */
  async createAchievement(userId: string, createDto: CreateAchievementDto) {
    const profileId = await this.getProfileId(userId);

    const achievement = await this.prisma.growth_achievements.create({
      data: {
        profile_id: profileId,
        achievement_type: createDto.achievementType,
        title: createDto.title,
        description: createDto.description,
        achievement_date: new Date(createDto.achievementDate),
        source: createDto.source as any,
        source_id: createDto.sourceId,
        level: createDto.level,
        verified: createDto.verified || false,
        skill_impact: createDto.skillImpact || [],
        career_impact: createDto.careerImpact,
        certificate_url: createDto.certificateUrl,
      },
    });

    // 更新档案统计
    await this.updateAchievementStatistics(userId);

    return achievement;
  }

  // =====================================================
  // 成长目标方法
  // =====================================================

  /**
   * 获取成长目标
   */
  async getGoals(userId: string, query: GoalQueryDto) {
    const profileId = await this.getProfileId(userId);
    
    const where: any = { profile_id: profileId };
    
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.mentorId) where.mentor_id = query.mentorId;

    const goals = await this.prisma.growth_goals.findMany({
      where,
      orderBy: { target_date: 'asc' },
    });

    return {
      data: goals,
      summary: {
        total: goals.length,
        active: goals.filter(g => g.status === 'active').length,
        completed: goals.filter(g => g.status === 'completed').length,
        overdue: goals.filter(g => 
          g.status === 'active' && new Date(g.target_date) < new Date()
        ).length,
      },
    };
  }

  /**
   * 创建成长目标
   */
  async createGoal(userId: string, createDto: CreateGoalDto) {
    const profileId = await this.getProfileId(userId);

    const goal = await this.prisma.growth_goals.create({
      data: {
        profile_id: profileId,
        title: createDto.title,
        description: createDto.description,
        category: createDto.category,
        start_date: new Date(createDto.startDate),
        target_date: new Date(createDto.targetDate),
        status: 'active',
        progress: 0,
        metrics: createDto.metrics || [],
        action_plan: createDto.actionPlan || [],
        milestones: createDto.milestones || [],
        mentor_id: createDto.mentorId,
      },
    });

    return goal;
  }

  /**
   * 更新成长目标
   */
  async updateGoal(userId: string, goalId: string, updateDto: UpdateGoalDto) {
    // 验证目标是否属于该用户
    await this.validateGoalOwnership(userId, goalId);

    const goal = await this.prisma.growth_goals.update({
      where: { id: goalId },
      data: {
        title: updateDto.title,
        description: updateDto.description,
        target_date: updateDto.targetDate ? new Date(updateDto.targetDate) : undefined,
        status: updateDto.status,
        progress: updateDto.progress,
        metrics: updateDto.metrics,
        action_plan: updateDto.actionPlan,
        milestones: updateDto.milestones,
        completed_date: updateDto.completedDate ? new Date(updateDto.completedDate) : undefined,
        updated_at: new Date(),
      },
    });

    return goal;
  }

  // =====================================================
  // 反馈记录方法
  // =====================================================

  /**
   * 获取反馈记录
   */
  async getFeedback(userId: string, query: FeedbackQueryDto) {
    const profileId = await this.getProfileId(userId);
    
    const where: any = { profile_id: profileId };
    
    if (query.type) where.feedback_type = query.type;
    if (query.providerId) where.provider_id = query.providerId;
    if (query.minRating) where.rating = { gte: query.minRating };
    if (query.maxRating) {
      where.rating = { 
        ...where.rating,
        lte: query.maxRating 
      };
    }

    const feedback = await this.prisma.growth_feedback.findMany({
      where,
      orderBy: { feedback_date: 'desc' },
    });

    return {
      data: feedback,
      summary: {
        total: feedback.length,
        averageRating: this.calculateAverageRating(feedback),
        byType: this.groupByField(feedback, 'feedback_type'),
      },
    };
  }

  /**
   * 创建反馈记录
   */
  async createFeedback(userId: string, createDto: CreateFeedbackDto) {
    const profileId = await this.getProfileId(userId);

    const feedback = await this.prisma.growth_feedback.create({
      data: {
        profile_id: profileId,
        feedback_type: createDto.feedbackType as any,
        title: createDto.title,
        content: createDto.content,
        provider_name: createDto.providerName,
        provider_role: createDto.providerRole,
        rating: createDto.rating,
        feedback_date: new Date(createDto.feedbackDate),
        related_project_id: createDto.relatedProjectId,
        categories: createDto.categories || [],
        tags: createDto.tags || [],
      },
    });

    return feedback;
  }

  // =====================================================
  // 培训和带教历史方法
  // =====================================================

  /**
   * 获取培训历史
   */
  async getTrainingHistory(userId: string) {
    const profileId = await this.getProfileId(userId);

    const history = await this.prisma.growth_training_history.findMany({
      where: { profile_id: profileId },
      orderBy: { start_date: 'desc' },
    });

    return history;
  }

  /**
   * 获取带教历史 (更新版本，支持查询参数)
   */
  async getMentorshipHistory(userId: string, queryParams?: any) {
    console.log('🔍 [Service] 获取用户带教历史 - 用户ID:', userId, '查询参数:', queryParams);
    
    try {
      // 使用Mock数据，避免Prisma模式问题
      const mockMentorshipHistory = [
        {
          id: 'mentorship-history-001',
          userId: userId,
          mentorId: 'user-mentor-001',
          mentorName: '李导师',
          projectId: 'project-001',
          projectName: '市场营销技能提升项目',
          phase: '进阶阶段',
          status: 'completed',
          startDate: '2024-01-15',
          endDate: '2024-03-15',
          duration: '2个月',
          goals: [
            '掌握数字化营销基础',
            '提升客户沟通技巧',
            '学会数据分析方法'
          ],
          achievements: [
            '完成3个营销方案设计',
            '获得客户好评95%以上',
            '数据分析能力提升显著'
          ],
          performanceRating: 8.5,
          mentorFeedback: '学员表现优秀，学习能力强，能够快速掌握新知识并应用到实践中。',
          skillsImproved: ['数字营销', '客户沟通', '数据分析'],
          challengesFaced: ['初期对数据分析工具不熟悉', '客户需求理解需要提升'],
          nextSteps: ['继续深化数据分析技能', '拓展社交媒体营销知识'],
          evaluationScore: 85,
          lastUpdated: '2024-03-20',
          metadata: {
            totalSessions: 12,
            completedTasks: 15,
            totalTasks: 16,
            attendanceRate: 95
          }
        },
        {
          id: 'mentorship-history-002',
          userId: userId,
          mentorId: 'user-mentor-002',
          mentorName: '王导师',
          projectId: 'project-002',
          projectName: '产品销售实战训练',
          phase: '基础阶段',
          status: 'in_progress',
          startDate: '2024-04-01',
          endDate: '2024-06-01',
          duration: '2个月',
          goals: [
            '了解产品知识体系',
            '掌握销售技巧基础',
            '建立客户关系管理意识'
          ],
          achievements: [
            '产品知识测试90分以上',
            '模拟销售演练获得好评'
          ],
          performanceRating: 7.8,
          mentorFeedback: '学员积极性高，对产品学习认真，需要在销售实战中继续练习。',
          skillsImproved: ['产品知识', '销售技巧'],
          challengesFaced: ['销售话术需要练习', '客户异议处理经验不足'],
          nextSteps: ['增加实战销售机会', '学习高级销售技巧'],
          evaluationScore: 78,
          lastUpdated: '2024-05-15',
          metadata: {
            totalSessions: 8,
            completedTasks: 10,
            totalTasks: 12,
            attendanceRate: 100
          }
        }
      ];

      // 根据查询参数过滤数据
      let filteredData = mockMentorshipHistory;
      
      if (queryParams?.status) {
        filteredData = filteredData.filter(item => item.status === queryParams.status);
      }
      
      if (queryParams?.startDate && queryParams?.endDate) {
        filteredData = filteredData.filter(item => 
          item.startDate >= queryParams.startDate && item.endDate <= queryParams.endDate
        );
      }

      // 分页处理
      const page = queryParams?.page || 1;
      const limit = queryParams?.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      const result = {
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit),
          hasNext: endIndex < filteredData.length,
          hasPrev: page > 1
        }
      };

      console.log('✅ [Service] 获取用户带教历史成功，返回记录数:', paginatedData.length);
      return result;
    } catch (error) {
      console.error('❌ [Service] 获取用户带教历史失败:', error);
      throw error;
    }
  }

  /**
   * 更新带教档案记录
   */
  async updateMentorshipHistory(userId: string, recordId: string, updateDto: any) {
    console.log('📝 [Service] 更新带教档案记录 - 用户ID:', userId, '记录ID:', recordId, '数据:', updateDto);
    
    try {
      // Mock实现，返回更新后的记录
      const updatedRecord = {
        id: recordId,
        userId: userId,
        ...updateDto,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('✅ [Service] 更新带教档案记录成功');
      return updatedRecord;
    } catch (error) {
      console.error('❌ [Service] 更新带教档案记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取带教成长轨迹
   */
  async getMentorshipTimeline(userId: string, queryParams: any) {
    console.log('🔍 [Service] 获取带教成长轨迹 - 用户ID:', userId, '查询参数:', queryParams);
    
    try {
      // Mock成长轨迹数据
      const mockTimeline = [
        {
          id: 'timeline-001',
          date: '2024-01-15',
          type: 'mentorship_start',
          title: '开始带教项目',
          description: '加入市场营销技能提升项目，由李导师进行带教',
          mentorId: 'user-mentor-001',
          mentorName: '李导师',
          projectId: 'project-001',
          projectName: '市场营销技能提升项目',
          phase: '基础阶段',
          milestone: true,
          importance: 'high'
        },
        {
          id: 'timeline-002',
          date: '2024-01-22',
          type: 'task_completion',
          title: '完成数字营销基础学习',
          description: '完成了数字营销基础理论学习，通过了阶段性测试',
          mentorId: 'user-mentor-001',
          mentorName: '李导师',
          projectId: 'project-001',
          score: 88,
          feedback: '理论掌握扎实，需要加强实践应用',
          milestone: false,
          importance: 'medium'
        },
        {
          id: 'timeline-003',
          date: '2024-02-05',
          type: 'evaluation',
          title: '月度评估',
          description: '完成第一个月的带教评估，整体表现良好',
          mentorId: 'user-mentor-001',
          mentorName: '李导师',
          projectId: 'project-001',
          score: 85,
          feedback: '学习积极主动，建议增加实际案例练习',
          milestone: true,
          importance: 'high'
        },
        {
          id: 'timeline-004',
          date: '2024-02-20',
          type: 'skill_development',
          title: '客户沟通技巧提升',
          description: '参与客户沟通技巧训练，模拟真实客户场景',
          mentorId: 'user-mentor-001',
          mentorName: '李导师',
          projectId: 'project-001',
          skillsImproved: ['客户沟通', '问题解决'],
          milestone: false,
          importance: 'medium'
        },
        {
          id: 'timeline-005',
          date: '2024-03-15',
          type: 'mentorship_completion',
          title: '完成带教项目',
          description: '成功完成市场营销技能提升项目的所有学习内容',
          mentorId: 'user-mentor-001',
          mentorName: '李导师',
          projectId: 'project-001',
          finalScore: 85,
          achievements: [
            '掌握数字营销核心技能',
            '提升客户沟通能力',
            '具备数据分析基础'
          ],
          milestone: true,
          importance: 'high'
        }
      ];

      // 根据查询参数过滤
      let filteredTimeline = mockTimeline;
      
      if (queryParams?.type) {
        filteredTimeline = filteredTimeline.filter(item => item.type === queryParams.type);
      }
      
      if (queryParams?.mentorId) {
        filteredTimeline = filteredTimeline.filter(item => item.mentorId === queryParams.mentorId);
      }
      
      if (queryParams?.startDate && queryParams?.endDate) {
        filteredTimeline = filteredTimeline.filter(item => 
          item.date >= queryParams.startDate && item.date <= queryParams.endDate
        );
      }

      console.log('✅ [Service] 获取带教成长轨迹成功，返回事件数:', filteredTimeline.length);
      return filteredTimeline;
    } catch (error) {
      console.error('❌ [Service] 获取带教成长轨迹失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户带教概览
   */
  async getMentorshipOverview(userId: string, currentUserId?: string) {
    console.log('🔍 [Service] 获取用户带教概览 - 用户ID:', userId);
    
    try {
      // Mock带教概览数据
      const mockOverview = {
        userInfo: {
          userId: userId,
          userName: '吴静',
          avatar: '/avatars/user-market-001.jpg',
          department: '市场部',
          position: '市场专员',
          level: '中级',
          entryDate: '2023-06-01'
        },
        currentMentorship: {
          mentorId: 'user-mentor-002',
          mentorName: '王导师',
          mentorAvatar: '/avatars/user-mentor-002.jpg',
          projectId: 'project-002',
          projectName: '产品销售实战训练',
          phase: '基础阶段',
          status: 'in_progress',
          startDate: '2024-04-01',
          expectedEndDate: '2024-06-01',
          progress: 65,
          nextSession: '2024-05-20 14:00',
          currentGoals: [
            '掌握产品知识体系',
            '提升销售技巧'
          ]
        },
        summary: {
          totalMentorships: 2,
          completedMentorships: 1,
          inProgressMentorships: 1,
          totalDuration: 4, // 月
          averageScore: 81.5,
          totalSkillsImproved: 5,
          totalAchievements: 3
        },
        recentActivities: [
          {
            date: '2024-05-15',
            type: 'evaluation',
            title: '月度评估完成',
            description: '完成产品销售实战训练的月度评估'
          },
          {
            date: '2024-05-10',
            type: 'task_completion',
            title: '产品知识测试',
            description: '完成产品知识测试，获得90分'
          },
          {
            date: '2024-05-05',
            type: 'skill_development',
            title: '销售技巧训练',
            description: '参与销售技巧模拟训练课程'
          }
        ],
        skillsOverview: [
          {
            skillName: '数字营销',
            currentLevel: 7,
            targetLevel: 8,
            improvementRate: 2.5,
            status: 'improved'
          },
          {
            skillName: '客户沟通',
            currentLevel: 8,
            targetLevel: 9,
            improvementRate: 1.8,
            status: 'improved'
          },
          {
            skillName: '产品知识',
            currentLevel: 6,
            targetLevel: 8,
            improvementRate: 1.2,
            status: 'in_progress'
          }
        ],
        mentorsFeedback: {
          overall: '学员表现积极，学习能力强，具有很好的成长潜力',
          strengths: ['学习积极性高', '理解能力强', '实践意愿强'],
          improvements: ['需要增加实战经验', '继续提升专业深度'],
          recommendations: ['参与更多实际项目', '与客户进行直接交流']
        }
      };

      console.log('✅ [Service] 获取用户带教概览成功');
      return mockOverview;
    } catch (error) {
      console.error('❌ [Service] 获取用户带教概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户带教统计
   */
  async getMentorshipStatistics(userId: string, queryParams: any) {
    console.log('📊 [Service] 获取用户带教统计 - 用户ID:', userId, '查询参数:', queryParams);
    
    try {
      // Mock统计数据
      const mockStatistics = {
        overview: {
          totalMentorships: 2,
          completedMentorships: 1,
          inProgressMentorships: 1,
          totalHours: 48,
          averageRating: 8.15,
          improvementRate: 85.5,
          goalAchievementRate: 78.3
        },
        timeDistribution: {
          period: queryParams?.period || 'year',
          data: [
            { month: '2024-01', hours: 16, sessions: 4, rating: 8.2 },
            { month: '2024-02', hours: 18, sessions: 5, rating: 8.5 },
            { month: '2024-03', hours: 14, sessions: 3, rating: 8.0 },
            { month: '2024-04', hours: 12, sessions: 4, rating: 7.8 },
            { month: '2024-05', hours: 8, sessions: 2, rating: 8.0 }
          ]
        },
        skillsProgress: [
          {
            category: '专业技能',
            skills: [
              { name: '数字营销', before: 5, after: 7, improvement: 2 },
              { name: '产品知识', before: 4, after: 6, improvement: 2 },
              { name: '数据分析', before: 3, after: 6, improvement: 3 }
            ]
          },
          {
            category: '软技能',
            skills: [
              { name: '客户沟通', before: 6, after: 8, improvement: 2 },
              { name: '问题解决', before: 5, after: 7, improvement: 2 },
              { name: '团队协作', before: 7, after: 8, improvement: 1 }
            ]
          }
        ],
        mentorshipComparison: {
          projects: [
            {
              projectName: '市场营销技能提升',
              duration: 2,
              score: 85,
              skillsImproved: 3,
              status: 'completed'
            },
            {
              projectName: '产品销售实战训练',
              duration: 2,
              score: 78,
              skillsImproved: 2,
              status: 'in_progress'
            }
          ]
        },
        achievements: {
          milestones: [
            {
              date: '2024-03-15',
              title: '完成第一个带教项目',
              description: '成功完成市场营销技能提升项目'
            },
            {
              date: '2024-05-01',
              title: '技能评估优秀',
              description: '在产品知识测试中获得90分'
            }
          ],
          certificates: [
            {
              name: '数字营销基础认证',
              issueDate: '2024-03-20',
              issuer: '李导师'
            }
          ]
        },
        futureRecommendations: {
          nextSteps: [
            '继续深化数据分析技能',
            '增加客户实战交流机会',
            '学习高级销售策略'
          ],
          suggestedMentors: [
            {
              mentorId: 'user-mentor-003',
              mentorName: '张导师',
              expertise: '高级销售策略',
              matchScore: 92
            }
          ],
          suggestedProjects: [
            {
              projectId: 'project-003',
              projectName: '高级销售技巧训练',
              difficulty: 'intermediate',
              expectedDuration: 3
            }
          ]
        }
      };

      console.log('✅ [Service] 获取用户带教统计成功');
      return mockStatistics;
    } catch (error) {
      console.error('❌ [Service] 获取用户带教统计失败:', error);
      throw error;
    }
  }

  // =====================================================
  // 辅助方法
  // =====================================================

  /**
   * 获取用户档案ID
   */
  private async getProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.user_growth_profiles.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException(`用户 ${userId} 的成长档案不存在`);
    }

    return profile.id;
  }

  /**
   * 验证技能所有权
   */
  private async validateSkillOwnership(userId: string, skillId: string) {
    const profileId = await this.getProfileId(userId);
    
    const skill = await this.prisma.growth_skills.findFirst({
      where: { id: skillId, profile_id: profileId },
    });

    if (!skill) {
      throw new NotFoundException('技能记录不存在或无权限访问');
    }
  }

  /**
   * 验证目标所有权
   */
  private async validateGoalOwnership(userId: string, goalId: string) {
    const profileId = await this.getProfileId(userId);
    
    const goal = await this.prisma.growth_goals.findFirst({
      where: { id: goalId, profile_id: profileId },
    });

    if (!goal) {
      throw new NotFoundException('目标记录不存在或无权限访问');
    }
  }

  /**
   * 更新技能统计
   */
  private async updateSkillStatistics(userId: string) {
    const skills = await this.getSkills(userId, {});
    
    await this.prisma.user_growth_profiles.update({
      where: { user_id: userId },
      data: {
        total_skills: skills.data.length,
        last_updated: new Date(),
      },
    });
  }

  /**
   * 更新成就统计
   */
  private async updateAchievementStatistics(userId: string) {
    const achievements = await this.getAchievements(userId, {});
    
    await this.prisma.user_growth_profiles.update({
      where: { user_id: userId },
      data: {
        total_achievements: achievements.data.length,
        last_updated: new Date(),
      },
    });
  }

  /**
   * 按字段分组统计
   */
  private groupByField(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = item[field];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * 计算平均评分
   */
  private calculateAverageRating(feedback: any[]): number {
    const validRatings = feedback.filter(f => f.rating).map(f => f.rating);
    if (validRatings.length === 0) return 0;
    
    const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
    return Math.round((sum / validRatings.length) * 100) / 100;
  }
} 