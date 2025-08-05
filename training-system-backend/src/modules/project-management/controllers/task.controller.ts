import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Delete,
  HttpStatus,
  HttpCode,
  HttpException,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { CreateTaskDto, UpdateTaskDto } from '../dto/task.dto';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';
import { GetCurrentUserId } from '../../../shared/auth/decorators/current-user.decorator';

@Controller('tasks')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 创建任务
   * POST /api/tasks
   */
  @Post()
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    try {
      console.log('📝 创建任务 - 数据:', createTaskDto);
      
      const task = await this.taskService.createTask(createTaskDto);
      
      return {
        code: 201,
        data: task,
        message: '任务创建成功',
      };
    } catch (error) {
      console.error('❌ 创建任务失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '创建任务失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 简化的任务创建API（用于测试）
   * POST /api/tasks/simple
   */
  @Post('simple')
  async createTaskSimple(@Body() body: any) {
    try {
      console.log('📝 简化创建任务 - 原始数据:', body);
      
      // 简单的数据验证
      if (!body.projectId || !body.name || !body.type) {
        throw new HttpException(
          {
            code: 400,
            message: '缺少必需字段：projectId, name, type',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // 构造任务数据（优先使用指定的阶段ID）
      const simpleTaskData: CreateTaskDto = {
        projectId: body.projectId,
        stageId: body.stageId || body.projectId, // 🔧 优先使用指定的stageId，如果没有才使用projectId作为fallback
        name: body.name,
        description: body.description || '',
        type: body.type,
        required: body.required ?? true,
        orderIndex: body.orderIndex || 0,
        config: body.config || {},
        assignedTo: body.assignedTo,
        reviewerRole: body.reviewerRole,
        dueDate: body.dueDate,
        estimatedHours: body.estimatedHours || 1,
      };

      console.log('📝 简化任务数据:', simpleTaskData);
      
      const task = await this.taskService.createTask(simpleTaskData);
      
      return {
        code: 201,
        data: task,
        message: '任务创建成功',
      };
    } catch (error) {
      console.error('❌ 简化创建任务失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '创建任务失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取待审核任务列表
   * GET /api/tasks/review?role=counselor&counselorId=user-hr-001
   */
  @Get('review')
  async getTasksToReview(
    @Query('role') role: 'counselor' | 'teacher' | 'admin' = 'counselor',
    @Query('projectId') projectId?: string,
    @Query('counselorId') counselorId?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取待审核任务 - 角色:', role, '项目ID:', projectId);
      
      // 确定实际的辅导员ID
      let actualCounselorId: string | undefined;
      
      if (role === 'counselor') {
        // 优先使用查询参数中的辅导员ID，然后是当前用户ID，最后是localStorage中的默认值
        actualCounselorId = counselorId || currentUserId || 'user-hr-001';
        console.log('🔍 使用的辅导员ID:', actualCounselorId);
      }
      
      const tasks = await this.taskService.getTasksForReview(role, projectId, actualCounselorId);
      
      return {
        code: 200,
        data: tasks,
        message: '获取待审核任务成功',
      };
    } catch (error) {
      console.error('❌ 获取待审核任务失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取待审核任务失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取已批阅任务列表
   * GET /api/tasks/reviewed?role=counselor&counselorId=user-hr-001
   */
  @Get('reviewed')
  async getReviewedTasks(
    @Query('role') role: 'counselor' | 'teacher' | 'admin' = 'counselor',
    @Query('projectId') projectId?: string,
    @Query('counselorId') counselorId?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取已批阅任务 - 角色:', role, '项目ID:', projectId);
      
      // 确定实际的辅导员ID
      let actualCounselorId: string | undefined;
      
      if (role === 'counselor') {
        // 优先使用查询参数中的辅导员ID，然后是当前用户ID，最后是localStorage中的默认值
        actualCounselorId = counselorId || currentUserId || 'user-hr-001';
        console.log('🔍 使用的辅导员ID:', actualCounselorId);
      }
      
      const tasks = await this.taskService.getReviewedTasks(role, projectId, actualCounselorId);
      
      return {
        code: 200,
        data: tasks,
        message: '获取已批阅任务成功',
      };
    } catch (error) {
      console.error('❌ 获取已批阅任务失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取已批阅任务失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 学生提交作业
   * POST /api/tasks/:taskId/submit
   */
  @Post(':taskId/submit')
  async submitTask(
    @Param('taskId') taskId: string,
    @Body() body: { 
      content: string; 
      studentId: string;
      filePaths?: string[];
    },
  ) {
    try {
      console.log('📝 学生提交作业 - 任务ID:', taskId, '学生ID:', body.studentId);
      
      const { content, studentId, filePaths = [] } = body;
      
      if (!content || !content.trim()) {
        throw new BadRequestException('作业内容不能为空');
      }

      const submission = await this.taskService.submitTask(taskId, studentId, content, filePaths);
      
      return {
        code: 200,
        data: submission,
        message: '作业提交成功',
      };
    } catch (error) {
      console.error('❌ 学生提交作业失败:', error);
      throw new BadRequestException(`提交作业失败: ${error.message}`);
    }
  }

  /**
   * 提交任务评分
   * POST /api/tasks/:taskId/submissions/:userId/score
   */
  @Post(':taskId/submissions/:userId/score')
  async submitScore(
    @Param('taskId') taskId: string,
    @Param('userId') userId: string,
    @Body() body: { score: number; feedback?: string },
  ) {
    try {
      console.log('📝 提交评分 - 任务ID:', taskId, '学员ID:', userId, '分数:', body.score);
      
      const { score, feedback } = body;
      
      if (typeof score !== 'number' || score < 0 || score > 100) {
        throw new HttpException(
          {
            code: 400,
            message: '分数必须在0-100之间',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.taskService.submitScore(taskId, userId, score, feedback);
      
      return {
        code: 200,
        message: '评分提交成功',
      };
    } catch (error) {
      console.error('❌ 提交评分失败:', error);
              throw new HttpException(
          {
            code: 500,
            message: error.message || '评分提交失败',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }

  /**
   * 更新任务
   * PUT /api/tasks/:taskId
   */
  @Put(':taskId')
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto
  ) {
    try {
      console.log('✏️ 更新任务 - 任务ID:', taskId, '数据:', updateTaskDto);
      
      const task = await this.taskService.updateTask(taskId, updateTaskDto);
      
      return {
        code: 200,
        data: task,
        message: '任务更新成功',
      };
    } catch (error) {
      console.error('❌ 更新任务失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '更新任务失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取任务详情（用于批阅界面）
   * GET /api/tasks/:taskId
   */
  @Get(':taskId')
  async getTaskDetail(@Param('taskId') taskId: string) {
    try {
      console.log('🔍 获取任务详情 - 任务ID:', taskId);
      
      const task = await this.taskService.getTaskDetail(taskId);
      
      return {
        code: 200,
        data: task,
        message: '获取任务详情成功',
      };
    } catch (error) {
      console.error('❌ 获取任务详情失败:', error);
              throw new HttpException(
          {
            code: 500,
            message: error.message || '获取任务详情失败',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }

  /**
   * 获取学生的作业任务 (个人中心用)
   */
  @Get('student/:userId')
  async getStudentTasks(
    @Param('userId') paramUserId: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      // 开发阶段：如果没有当前用户，使用参数中的用户ID
      // 生产阶段：应该验证currentUserId与paramUserId的权限关系
      const targetUserId = currentUserId || paramUserId;
      
      console.log(`获取学生作业任务 - 当前用户: ${currentUserId}, 目标用户: ${targetUserId}`);
      
      const tasks = await this.taskService.getStudentTasks(targetUserId);
      
      return {
        code: 200,
        message: '获取学生作业任务成功',
        data: tasks,
      };
    } catch (error) {
      console.error('获取学生作业任务失败:', error);
      throw new BadRequestException(`获取学生作业任务失败: ${error.message}`);
    }
  }

  /**
   * 删除任务
   * DELETE /api/tasks/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(
    @Param('id') id: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🗑️ 删除任务 - 任务ID:', id);
      
      await this.taskService.deleteTask(id, currentUserId || 'user-admin-001');
      
      console.log('✅ 任务删除成功');
    } catch (error) {
      console.error('❌ 删除任务失败:', error);
      throw new BadRequestException(`删除任务失败: ${error.message}`);
    }
  }
} 