import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { GrowthProfileService } from '../services/growth-profile.service';
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
  FeedbackQueryDto,
  UpdateMentorshipHistoryDto,
} from '../dto/growth-profile.dto';
// import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { GetCurrentUserId } from '../../../shared/auth/decorators/current-user.decorator';

@Controller('growth-profile')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class GrowthProfileController {
  constructor(private readonly growthProfileService: GrowthProfileService) {}

  // =====================================================
  // 成长档案主要接口
  // =====================================================

  /**
   * 获取用户成长档案
   */
  @Get(':userId')
  async getProfile(@Param('userId') userId: string) {
    return this.growthProfileService.getProfile(userId);
  }

  /**
   * 更新用户成长档案基本信息
   */
  @Put(':userId')
  async updateProfile(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateGrowthProfileDto,
  ) {
    return this.growthProfileService.updateProfile(userId, updateDto);
  }

  /**
   * 获取档案配置
   */
  @Get(':userId/config')
  async getProfileConfig(@Param('userId') userId: string) {
    return this.growthProfileService.getProfileConfig(userId);
  }

  /**
   * 更新档案配置
   */
  @Put(':userId/config')
  async updateProfileConfig(
    @Param('userId') userId: string,
    @Body() config: any,
  ) {
    return this.growthProfileService.updateProfileConfig(userId, config);
  }

  // =====================================================
  // 成长时间线接口
  // =====================================================

  /**
   * 获取成长时间线事件
   */
  @Get(':userId/timeline')
  async getTimelineEvents(
    @Param('userId') userId: string,
    @Query() query: TimelineQueryDto,
  ) {
    return this.growthProfileService.getTimelineEvents(userId, query);
  }

  /**
   * 创建时间线事件
   */
  @Post(':userId/timeline')
  @HttpCode(HttpStatus.CREATED)
  async createTimelineEvent(
    @Param('userId') userId: string,
    @Body() createDto: CreateTimelineEventDto,
  ) {
    return this.growthProfileService.createTimelineEvent(userId, createDto);
  }

  // =====================================================
  // 技能发展接口
  // =====================================================

  /**
   * 获取技能列表
   */
  @Get(':userId/skills')
  async getSkills(
    @Param('userId') userId: string,
    @Query() query: SkillQueryDto,
  ) {
    return this.growthProfileService.getSkills(userId, query);
  }

  /**
   * 创建技能记录
   */
  @Post(':userId/skills')
  @HttpCode(HttpStatus.CREATED)
  async createSkill(
    @Param('userId') userId: string,
    @Body() createDto: CreateSkillDto,
  ) {
    return this.growthProfileService.createSkill(userId, createDto);
  }

  /**
   * 更新技能记录
   */
  @Patch(':userId/skills/:skillId')
  async updateSkill(
    @Param('userId') userId: string,
    @Param('skillId') skillId: string,
    @Body() updateDto: UpdateSkillDto,
  ) {
    return this.growthProfileService.updateSkill(userId, skillId, updateDto);
  }

  // =====================================================
  // 成就记录接口
  // =====================================================

  /**
   * 获取成就列表
   */
  @Get(':userId/achievements')
  async getAchievements(
    @Param('userId') userId: string,
    @Query() query: AchievementQueryDto,
  ) {
    return this.growthProfileService.getAchievements(userId, query);
  }

  /**
   * 创建成就记录
   */
  @Post(':userId/achievements')
  @HttpCode(HttpStatus.CREATED)
  async createAchievement(
    @Param('userId') userId: string,
    @Body() createDto: CreateAchievementDto,
  ) {
    return this.growthProfileService.createAchievement(userId, createDto);
  }

  // =====================================================
  // 成长目标接口
  // =====================================================

  /**
   * 获取成长目标
   */
  @Get(':userId/goals')
  async getGoals(
    @Param('userId') userId: string,
    @Query() query: GoalQueryDto,
  ) {
    return this.growthProfileService.getGoals(userId, query);
  }

  /**
   * 创建成长目标
   */
  @Post(':userId/goals')
  @HttpCode(HttpStatus.CREATED)
  async createGoal(
    @Param('userId') userId: string,
    @Body() createDto: CreateGoalDto,
  ) {
    return this.growthProfileService.createGoal(userId, createDto);
  }

  /**
   * 更新成长目标
   */
  @Patch(':userId/goals/:goalId')
  async updateGoal(
    @Param('userId') userId: string,
    @Param('goalId') goalId: string,
    @Body() updateDto: UpdateGoalDto,
  ) {
    return this.growthProfileService.updateGoal(userId, goalId, updateDto);
  }

  // =====================================================
  // 反馈记录接口
  // =====================================================

  /**
   * 获取反馈记录
   */
  @Get(':userId/feedback')
  async getFeedback(
    @Param('userId') userId: string,
    @Query() query: FeedbackQueryDto,
  ) {
    return this.growthProfileService.getFeedback(userId, query);
  }

  /**
   * 创建反馈记录
   */
  @Post(':userId/feedback')
  @HttpCode(HttpStatus.CREATED)
  async createFeedback(
    @Param('userId') userId: string,
    @Body() createDto: CreateFeedbackDto,
  ) {
    return this.growthProfileService.createFeedback(userId, createDto);
  }

  // =====================================================
  // 培训和带教历史接口
  // =====================================================

  /**
   * 获取培训历史
   */
  @Get(':userId/training-history')
  async getTrainingHistory(@Param('userId') userId: string) {
    return this.growthProfileService.getTrainingHistory(userId);
  }

  /**
   * 获取用户带教历史
   * GET /api/growth-profile/{userId}/mentorship-history
   * 对应：学习中心 - 带教历史Tab
   */
  @Get(':userId/mentorship-history')
  async getMentorshipHistory(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取用户带教历史 - 用户ID:', userId, '参数:', { page, limit, status, startDate, endDate });
      
      const result = await this.growthProfileService.getMentorshipHistory(userId, {
        page: page || 1,
        limit: limit || 20,
        status,
        startDate,
        endDate,
        currentUserId,
      });
      
      return {
        code: 200,
        data: result.data,
        pagination: result.pagination,
        message: '获取用户带教历史成功',
      };
    } catch (error) {
      console.error('❌ 获取用户带教历史失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取带教历史失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 更新带教档案记录
   * PUT /api/growth-profile/{userId}/mentorship-history/{recordId}
   * 对应：学习中心 - 档案更新
   */
  @Put(':userId/mentorship-history/:recordId')
  async updateMentorshipHistory(
    @Param('userId') userId: string,
    @Param('recordId') recordId: string,
    @Body() updateDto: UpdateMentorshipHistoryDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 更新带教档案记录 - 用户ID:', userId, '记录ID:', recordId, '数据:', updateDto);
      
      updateDto.updatedBy = currentUserId || 'system';
      
      const result = await this.growthProfileService.updateMentorshipHistory(
        userId,
        recordId,
        updateDto
      );
      
      return {
        code: 200,
        data: result,
        message: '更新带教档案记录成功',
      };
    } catch (error) {
      console.error('❌ 更新带教档案记录失败:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        {
          code: 500,
          message: error.message || '更新带教档案失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取带教成长轨迹
   * GET /api/growth-profile/{userId}/mentorship/timeline
   * 对应：学习中心 - 成长时间线
   */
  @Get(':userId/mentorship/timeline')
  async getMentorshipTimeline(
    @Param('userId') userId: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('mentorId') mentorId?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取带教成长轨迹 - 用户ID:', userId, '参数:', { type, startDate, endDate, mentorId });
      
      const timeline = await this.growthProfileService.getMentorshipTimeline(userId, {
        type,
        startDate,
        endDate,
        mentorId,
        currentUserId,
      });
      
      return {
        code: 200,
        data: timeline,
        message: '获取带教成长轨迹成功',
      };
    } catch (error) {
      console.error('❌ 获取带教成长轨迹失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取成长轨迹失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取用户带教概览
   * GET /api/growth-profile/{userId}/mentorship/overview
   * 对应：学习中心 - 带教概览
   */
  @Get(':userId/mentorship/overview')
  async getMentorshipOverview(
    @Param('userId') userId: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取用户带教概览 - 用户ID:', userId);
      
      const overview = await this.growthProfileService.getMentorshipOverview(userId, currentUserId);
      
      return {
        code: 200,
        data: overview,
        message: '获取用户带教概览成功',
      };
    } catch (error) {
      console.error('❌ 获取用户带教概览失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取带教概览失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取用户带教统计
   * GET /api/growth-profile/{userId}/mentorship/statistics
   * 对应：学习中心 - 带教数据统计
   */
  @Get(':userId/mentorship/statistics')
  async getMentorshipStatistics(
    @Param('userId') userId: string,
    @Query('period') period?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📊 获取用户带教统计 - 用户ID:', userId, '周期:', period);
      
      const statistics = await this.growthProfileService.getMentorshipStatistics(userId, {
        period,
        currentUserId,
      });
      
      return {
        code: 200,
        data: statistics,
        message: '获取用户带教统计成功',
      };
    } catch (error) {
      console.error('❌ 获取用户带教统计失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取带教统计失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // =====================================================
  // 统计和分析接口
  // =====================================================

  /**
   * 获取档案统计数据
   */
  @Get(':userId/statistics')
  async getStatistics(@Param('userId') userId: string) {
    const profile = await this.growthProfileService.getProfile(userId);
    return {
      basicStats: {
        totalSkills: profile.skillDevelopment.length,
        totalAchievements: profile.achievements.length,
        totalGoals: profile.goals.length,
        totalFeedback: profile.feedbackCollection.length,
      },
      skillStats: {
        mastered: profile.skillDevelopment.filter(s => s.current_level >= 4).length,
        inProgress: profile.skillDevelopment.filter(s => s.current_level < 4).length,
      },
      goalStats: {
        active: profile.goals.filter(g => g.status === 'active').length,
        completed: profile.goals.filter(g => g.status === 'completed').length,
      },
      achievementStats: {
        verified: profile.achievements.filter(a => a.verified).length,
        featured: profile.achievements.filter(a => a.featured).length,
      },
      statistics: profile.statistics,
    };
  }

  /**
   * 获取成长趋势数据
   */
  @Get(':userId/trends')
  async getTrends(@Param('userId') userId: string) {
    const profile = await this.growthProfileService.getProfile(userId);
    
    // 按月统计时间线事件
    const monthlyEvents = profile.combinedTimeline.reduce((acc: any, event: any) => {
      const month = new Date(event.event_date).toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // 技能发展趋势
    const skillTrends = profile.skillDevelopment.map((skill: any) => ({
      skillName: skill.skill_name,
      currentLevel: skill.current_level,
      targetLevel: skill.target_level,
      progressHistory: skill.progress_history,
    }));

    return {
      monthlyActivity: monthlyEvents,
      skillDevelopmentTrends: skillTrends,
      goalProgress: profile.goals.map((goal: any) => ({
        title: goal.title,
        progress: goal.progress,
        status: goal.status,
        targetDate: goal.target_date,
      })),
    };
  }

  /**
   * 导出档案数据
   */
  @Get(':userId/export')
  async exportProfile(@Param('userId') userId: string) {
    const profile = await this.growthProfileService.getProfile(userId);
    
    return {
      exportDate: new Date().toISOString(),
      profile: {
        basicInfo: {
          userName: profile.userName,
          department: profile.department,
          position: profile.position,
          entryDate: profile.entryDate,
          currentLevel: profile.currentLevel,
        },
        summary: {
          totalSkills: profile.skillDevelopment.length,
          totalAchievements: profile.achievements.length,
          totalGoals: profile.goals.length,
          totalFeedback: profile.feedbackCollection.length,
        },
        data: {
          skills: profile.skillDevelopment,
          achievements: profile.achievements,
          goals: profile.goals,
          timeline: profile.combinedTimeline,
          feedback: profile.feedbackCollection,
        },
      },
    };
  }
} 