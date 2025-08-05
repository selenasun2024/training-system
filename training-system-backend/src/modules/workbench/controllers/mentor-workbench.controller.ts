import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  HttpException,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MentorWorkbenchService } from '../services/mentor-workbench.service';
import { 
  CreateMentorshipPlanDto,
  CreateMentorshipTaskDto,
  CreateMentorEvaluationDto,
  CreateInteractionDto,
  MentorDashboardQueryDto
} from '../dto/mentor-workbench.dto';
import { GetCurrentUserId } from '../../../shared/auth/decorators/current-user.decorator';

@Controller('workbench/mentor')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class MentorWorkbenchController {
  constructor(
    private readonly mentorWorkbenchService: MentorWorkbenchService,
  ) {}

  /**
   * 导师工作台概览
   * GET /api/workbench/mentor/dashboard
   * 对应：mentorWorkbench.ts - 工作台首页
   */
  @Get('dashboard')
  async getMentorDashboard(
    @Query() queryDto: MentorDashboardQueryDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001'; // 默认导师ID
      console.log('🔍 获取导师工作台概览 - 导师ID:', mentorId);
      
      const dashboard = await this.mentorWorkbenchService.getMentorDashboard(mentorId, queryDto);
      
      return {
        code: 200,
        data: dashboard,
        message: '获取导师工作台概览成功',
      };
    } catch (error) {
      console.error('❌ 获取导师工作台概览失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取工作台概览失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 我的学员列表
   * GET /api/workbench/mentor/students
   * 对应：StudentManagementPanel.vue - 学员管理
   */
  @Get('students')
  async getMyStudents(
    @Query('status') status?: string,
    @Query('project') project?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001';
      console.log('🔍 获取我的学员列表 - 导师ID:', mentorId, '状态:', status, '项目:', project);
      
      const students = await this.mentorWorkbenchService.getMyStudents(mentorId, {
        status,
        project,
      });
      
      return {
        code: 200,
        data: students,
        message: '获取学员列表成功',
      };
    } catch (error) {
      console.error('❌ 获取学员列表失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取学员列表失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 学员详情
   * GET /api/workbench/mentor/students/{studentId}
   * 对应：StudentManagementPanel.vue - 学员详细信息
   */
  @Get('students/:studentId')
  async getStudentDetail(
    @Param('studentId') studentId: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001';
      console.log('🔍 获取学员详情 - 导师ID:', mentorId, '学员ID:', studentId);
      
      const studentDetail = await this.mentorWorkbenchService.getStudentDetail(mentorId, studentId);
      
      return {
        code: 200,
        data: studentDetail,
        message: '获取学员详情成功',
      };
    } catch (error) {
      console.error('❌ 获取学员详情失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取学员详情失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 带教计划管理
   * GET /api/workbench/mentor/plans
   * 对应：MentorshipExecutionPanel.vue - 计划管理Tab
   */
  @Get('plans')
  async getMentorshipPlans(
    @Query('status') status?: string,
    @Query('studentId') studentId?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001';
      console.log('🔍 获取带教计划 - 导师ID:', mentorId, '状态:', status, '学员ID:', studentId);
      
      const plans = await this.mentorWorkbenchService.getMentorshipPlans(mentorId, {
        status,
        studentId,
      });
      
      return {
        code: 200,
        data: plans,
        message: '获取带教计划成功',
      };
    } catch (error) {
      console.error('❌ 获取带教计划失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取带教计划失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 创建带教计划
   * POST /api/workbench/mentor/plans
   * 对应：MentorshipExecutionPanel.vue - 新建计划
   */
  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  async createMentorshipPlan(
    @Body() createDto: CreateMentorshipPlanDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001';
      console.log('📝 创建带教计划 - 导师ID:', mentorId, '数据:', createDto);
      
      createDto.createdBy = mentorId;
      
      const plan = await this.mentorWorkbenchService.createMentorshipPlan(createDto);
      
      return {
        code: 201,
        data: plan,
        message: '带教计划创建成功',
      };
    } catch (error) {
      console.error('❌ 创建带教计划失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '创建带教计划失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 任务分配管理
   * GET /api/workbench/mentor/tasks
   * 对应：MentorshipExecutionPanel.vue - 任务分配Tab
   */
  @Get('tasks')
  async getMentorshipTasks(
    @Query('status') status?: string,
    @Query('studentId') studentId?: string,
    @Query('type') type?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001';
      console.log('🔍 获取带教任务 - 导师ID:', mentorId, '状态:', status, '学员ID:', studentId, '类型:', type);
      
      const tasks = await this.mentorWorkbenchService.getMentorshipTasks(mentorId, {
        status,
        studentId,
        type,
      });
      
      return {
        code: 200,
        data: tasks,
        message: '获取带教任务成功',
      };
    } catch (error) {
      console.error('❌ 获取带教任务失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取带教任务失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 创建带教任务
   * POST /api/workbench/mentor/tasks
   * 对应：MentorshipExecutionPanel.vue - 任务分配
   */
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  async createMentorshipTask(
    @Body() createDto: CreateMentorshipTaskDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001';
      console.log('📝 创建带教任务 - 导师ID:', mentorId, '数据:', createDto);
      
      createDto.createdBy = mentorId;
      
      const task = await this.mentorWorkbenchService.createMentorshipTask(createDto);
      
      return {
        code: 201,
        data: task,
        message: '带教任务创建成功',
      };
    } catch (error) {
      console.error('❌ 创建带教任务失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '创建带教任务失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 阶段评价管理
   * GET /api/workbench/mentor/evaluations
   * 对应：MentorshipExecutionPanel.vue - 阶段评价Tab
   */
  @Get('evaluations')
  async getMentorEvaluations(
    @Query('status') status?: string,
    @Query('studentId') studentId?: string,
    @Query('period') period?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001';
      console.log('🔍 获取阶段评价 - 导师ID:', mentorId, '状态:', status, '学员ID:', studentId, '周期:', period);
      
      const evaluations = await this.mentorWorkbenchService.getMentorEvaluations(mentorId, {
        status,
        studentId,
        period,
      });
      
      return {
        code: 200,
        data: evaluations,
        message: '获取阶段评价成功',
      };
    } catch (error) {
      console.error('❌ 获取阶段评价失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取阶段评价失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 提交阶段评价
   * POST /api/workbench/mentor/evaluations
   * 对应：MentorshipExecutionPanel.vue - 评价提交
   */
  @Post('evaluations')
  @HttpCode(HttpStatus.CREATED)
  async submitMentorEvaluation(
    @Body() createDto: CreateMentorEvaluationDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001';
      console.log('📝 提交阶段评价 - 导师ID:', mentorId, '数据:', createDto);
      
      createDto.evaluatorId = mentorId;
      
      const evaluation = await this.mentorWorkbenchService.submitMentorEvaluation(createDto);
      
      return {
        code: 201,
        data: evaluation,
        message: '阶段评价提交成功',
      };
    } catch (error) {
      console.error('❌ 提交阶段评价失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '提交阶段评价失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 带教资源管理
   * GET /api/workbench/mentor/resources
   * 对应：ResourceToolsPanel.vue - 资源工具Tab
   */
  @Get('resources')
  async getMentorshipResources(
    @Query('category') category?: string,
    @Query('type') type?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001';
      console.log('🔍 获取带教资源 - 导师ID:', mentorId, '分类:', category, '类型:', type);
      
      const resources = await this.mentorWorkbenchService.getMentorshipResources(mentorId, {
        category,
        type,
      });
      
      return {
        code: 200,
        data: resources,
        message: '获取带教资源成功',
      };
    } catch (error) {
      console.error('❌ 获取带教资源失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取带教资源失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 沟通记录管理
   * GET /api/workbench/mentor/communications
   * 对应：StudentManagementPanel.vue - 沟通记录Tab
   */
  @Get('communications')
  async getCommunicationRecords(
    @Query('studentId') studentId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001';
      console.log('🔍 获取沟通记录 - 导师ID:', mentorId, '学员ID:', studentId, '类型:', type);
      
      const communications = await this.mentorWorkbenchService.getCommunicationRecords(mentorId, {
        studentId,
        type,
        startDate,
        endDate,
      });
      
      return {
        code: 200,
        data: communications,
        message: '获取沟通记录成功',
      };
    } catch (error) {
      console.error('❌ 获取沟通记录失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取沟通记录失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 记录师徒交互
   * POST /api/workbench/mentor/interactions
   * 对应：StudentManagementPanel.vue - 交互记录
   */
  @Post('interactions')
  @HttpCode(HttpStatus.CREATED)
  async recordInteraction(
    @Body() createDto: CreateInteractionDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const mentorId = currentUserId || 'user-hr-001';
      console.log('📝 记录师徒交互 - 导师ID:', mentorId, '数据:', createDto);
      
      createDto.recordedBy = mentorId;
      
      const interaction = await this.mentorWorkbenchService.recordInteraction(createDto);
      
      return {
        code: 201,
        data: interaction,
        message: '师徒交互记录成功',
      };
    } catch (error) {
      console.error('❌ 记录师徒交互失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '记录师徒交互失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 