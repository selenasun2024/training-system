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
  Put,
  Delete,
} from '@nestjs/common';
import { ProjectMentorshipService } from '../services/project-mentorship.service';
import { 
  CreateMentorshipRelationshipDto,
  CreateMentorshipEvaluationDto,
  MentorshipProgressQueryDto,
  CreateMentorshipFeedbackDto
} from '../dto/project-mentorship.dto';
import { GetCurrentUserId } from '../../../shared/auth/decorators/current-user.decorator';

@Controller('projects/:projectId/mentorship')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class ProjectMentorshipController {
  constructor(
    private readonly projectMentorshipService: ProjectMentorshipService,
  ) {}

  /**
   * 获取项目师徒关系
   * GET /api/projects/{projectId}/mentorship/relationships
   * 对应：MentoringManagement.vue - 指派关系Tab
   */
  @Get('relationships')
  async getProjectRelationships(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取项目师徒关系 - 项目ID:', projectId, '状态:', status);
      
      const relationships = await this.projectMentorshipService.getProjectRelationships(
        projectId,
        status,
        currentUserId
      );
      
      return {
        code: 200,
        data: relationships,
        message: '获取项目师徒关系成功',
      };
    } catch (error) {
      console.error('❌ 获取项目师徒关系失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取师徒关系失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 创建师徒关系
   * POST /api/projects/{projectId}/mentorship/relationships
   * 对应：AssignmentRelationTab.vue - 师徒配对
   */
  @Post('relationships')
  @HttpCode(HttpStatus.CREATED)
  async createMentorshipRelationship(
    @Param('projectId') projectId: string,
    @Body() createDto: CreateMentorshipRelationshipDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 创建师徒关系请求接收:');
      console.log('  - 项目ID (URL参数):', projectId);
      console.log('  - 请求体数据:', JSON.stringify(createDto, null, 2));
      console.log('  - 当前用户ID:', currentUserId);
      
      // 验证必需字段
      if (!createDto.mentorId) {
        console.error('❌ 验证失败: mentorId 为空');
        throw new BadRequestException('导师ID不能为空');
      }
      
      if (!createDto.studentId) {
        console.error('❌ 验证失败: studentId 为空');
        throw new BadRequestException('学员ID不能为空');
      }
      
      // 验证项目ID匹配
      if (createDto.projectId && createDto.projectId !== projectId) {
        console.error('❌ 验证失败: 项目ID不匹配');
        throw new BadRequestException('项目ID不匹配');
      }
      
      // 确保projectId在DTO中
      createDto.projectId = projectId;
      createDto.createdBy = currentUserId || 'admin-001';
      
      console.log('✅ 验证通过，创建师徒关系...');
      const relationship = await this.projectMentorshipService.createMentorshipRelationship(createDto);
      
      return {
        code: 201,
        data: relationship,
        message: '师徒关系创建成功',
      };
    } catch (error) {
      console.error('❌ 创建师徒关系失败:', error);
      
      // 如果是BadRequestException，保持原状
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new HttpException(
        {
          code: 500,
          message: error.message || '创建师徒关系失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取带教进度
   * GET /api/projects/{projectId}/mentorship/progress
   * 对应：StudentTaskProgressTab.vue - 任务状态Tab
   */
  @Get('progress')
  async getMentorshipProgress(
    @Param('projectId') projectId: string,
    @Query() queryDto: MentorshipProgressQueryDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取带教进度 - 项目ID:', projectId, '查询条件:', queryDto);
      
      const progress = await this.projectMentorshipService.getMentorshipProgress(
        projectId,
        queryDto,
        currentUserId
      );
      
      return {
        code: 200,
        data: progress,
        message: '获取带教进度成功',
      };
    } catch (error) {
      console.error('❌ 获取带教进度失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取带教进度失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取带教评价
   * GET /api/projects/{projectId}/mentorship/evaluations
   * 对应：ProjectEvaluationTab.vue - 带教评价Tab
   */
  @Get('evaluations')
  async getProjectEvaluations(
    @Param('projectId') projectId: string,
    @Query('type') type?: string,
    @Query('evaluatorId') evaluatorId?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取带教评价 - 项目ID:', projectId, '类型:', type, '评价者:', evaluatorId);
      
      const evaluations = await this.projectMentorshipService.getProjectEvaluations(
        projectId,
        type,
        evaluatorId,
        currentUserId
      );
      
      return {
        code: 200,
        data: evaluations,
        message: '获取带教评价成功',
      };
    } catch (error) {
      console.error('❌ 获取带教评价失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取带教评价失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 提交带教评价
   * POST /api/projects/{projectId}/mentorship/evaluations
   * 对应：ProjectEvaluationTab.vue - 评价提交
   */
  @Post('evaluations')
  @HttpCode(HttpStatus.CREATED)
  async submitEvaluation(
    @Param('projectId') projectId: string,
    @Body() evaluationDto: CreateMentorshipEvaluationDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 提交带教评价 - 项目ID:', projectId, '数据:', evaluationDto);
      
      // 验证项目ID匹配
      if (evaluationDto.projectId && evaluationDto.projectId !== projectId) {
        throw new BadRequestException('项目ID不匹配');
      }
      
      // 确保projectId和评价者ID在DTO中
      evaluationDto.projectId = projectId;
      evaluationDto.evaluatorId = currentUserId || 'system';
      
      const evaluation = await this.projectMentorshipService.submitEvaluation(projectId, evaluationDto, currentUserId);
      
      return {
        code: 201,
        data: evaluation,
        message: '带教评价提交成功',
      };
    } catch (error) {
      console.error('❌ 提交带教评价失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '提交评价失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 删除带教评价
   * DELETE /api/projects/{projectId}/mentorship/evaluations/{evaluationId}
   * 对应：ProjectEvaluationTab.vue - 删除评价按钮
   */
  @Delete('evaluations/:evaluationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvaluation(
    @Param('projectId') projectId: string,
    @Param('evaluationId') evaluationId: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🗑️ 删除带教评价 - 项目ID:', projectId, '评价ID:', evaluationId);
      
      const result = await this.projectMentorshipService.deleteEvaluation(evaluationId, currentUserId);
      
      console.log('✅ 删除带教评价成功:', result);
      
      return {
        code: 200,
        data: result,
        message: '评价删除成功',
      };
    } catch (error) {
      console.error('❌ 删除带教评价失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '删除评价失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取带教标准
   * GET /api/projects/{projectId}/mentorship/standards
   * 对应：ProjectStandardsTab.vue - 带教标准Tab
   */
  @Get('standards')
  async getMentorshipStandards(
    @Param('projectId') projectId: string,
    @Query('category') category?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取带教标准 - 项目ID:', projectId, '分类:', category);
      
      const standards = await this.projectMentorshipService.getMentorshipStandards(
        projectId,
        category,
        currentUserId
      );
      
      return {
        code: 200,
        data: standards,
        message: '获取带教标准成功',
      };
    } catch (error) {
      console.error('❌ 获取带教标准失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取带教标准失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 更新师徒关系状态
   * PUT /api/projects/{projectId}/mentorship/relationships/{relationshipId}/status
   */
  @Put('relationships/:relationshipId/status')
  async updateRelationshipStatus(
    @Param('projectId') projectId: string,
    @Param('relationshipId') relationshipId: string,
    @Body() updateDto: { status: string; reason?: string; updatedAt: string },
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 更新师徒关系状态 - 关系ID:', relationshipId, '新状态:', updateDto.status);
      
      const result = await this.projectMentorshipService.updateRelationshipStatus(
        projectId,
        relationshipId,
        updateDto.status,
        updateDto.reason,
        currentUserId
      );
      
      return {
        code: 200,
        data: result,
        message: '师徒关系状态更新成功',
      };
    } catch (error) {
      console.error('❌ 更新师徒关系状态失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '更新状态失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 更换师徒关系中的导师
   * PUT /api/projects/{projectId}/mentorship/relationships/{relationshipId}/mentor
   */
  @Put('relationships/:relationshipId/mentor')
  async changeMentor(
    @Param('projectId') projectId: string,
    @Param('relationshipId') relationshipId: string,
    @Body() changeDto: { newMentorId: string; reason: string; updatedAt: string },
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 更换师徒关系导师 - 关系ID:', relationshipId, '新导师ID:', changeDto.newMentorId);
      
      const result = await this.projectMentorshipService.changeMentor(
        projectId,
        relationshipId,
        changeDto.newMentorId,
        changeDto.reason,
        currentUserId
      );
      
      return {
        code: 200,
        data: result,
        message: '带教老师更换成功',
      };
    } catch (error) {
      console.error('❌ 更换带教老师失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '更换导师失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 删除师徒关系
   * DELETE /api/projects/{projectId}/mentorship/relationships/{relationshipId}
   */
  @Delete('relationships/:relationshipId')
  async deleteRelationship(
    @Param('projectId') projectId: string,
    @Param('relationshipId') relationshipId: string,
    @Body() deleteDto: { reason?: string },
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🗑️ 删除师徒关系 - 关系ID:', relationshipId, '原因:', deleteDto.reason);
      
      const result = await this.projectMentorshipService.deleteRelationship(
        projectId,
        relationshipId,
        deleteDto.reason,
        currentUserId
      );
      
      return {
        code: 200,
        data: result,
        message: '师徒关系已解除',
      };
    } catch (error) {
      console.error('❌ 删除师徒关系失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '删除关系失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取学员在项目中的任务详情
   * GET /api/projects/{projectId}/mentorship/students/{studentId}/tasks
   */
  @Get('students/:studentId/tasks')
  async getStudentTaskDetails(
    @Param('projectId') projectId: string,
    @Param('studentId') studentId: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📋 获取学员任务详情 - 项目ID:', projectId, '学员ID:', studentId);
      
      const result = await this.projectMentorshipService.getStudentTaskDetails(
        projectId,
        studentId,
        currentUserId || 'admin-001'
      );
      
      return {
        code: 200,
        data: result,
        message: '获取学员任务详情成功',
      };
    } catch (error) {
      console.error('❌ 获取学员任务详情失败:', error);
      
      // 确保总是返回JSON响应而不是抛出异常
      return {
        code: 500,
        message: error.message || '获取学员任务详情失败',
        data: null,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  /**
   * 创建师徒反馈
   * POST /api/projects/{projectId}/mentorship/students/{studentId}/feedback
   */
  @Post('students/:studentId/feedback')
  @HttpCode(HttpStatus.CREATED)
  async createMentorshipFeedback(
    @Param('projectId') projectId: string,
    @Param('studentId') studentId: string,
    @Body() createDto: CreateMentorshipFeedbackDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 创建师徒反馈 - 项目ID:', projectId, '学员ID:', studentId);
      
      const result = await this.projectMentorshipService.createMentorshipFeedback(
        projectId,
        studentId,
        createDto,
        currentUserId || 'admin-001'
      );
      
      return {
        code: 201,
        data: result,
        message: '师徒反馈创建成功',
      };
    } catch (error) {
      console.error('❌ 创建师徒反馈失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '创建师徒反馈失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取学员反馈列表
   * GET /api/projects/{projectId}/mentorship/students/{studentId}/feedback
   */
  @Get('students/:studentId/feedback')
  async getStudentFeedback(
    @Param('projectId') projectId: string,
    @Param('studentId') studentId: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📋 获取学员反馈 - 项目ID:', projectId, '学员ID:', studentId);
      
      const result = await this.projectMentorshipService.getStudentFeedback(
        projectId,
        studentId,
        currentUserId || 'admin-001'
      );
      
      return {
        code: 200,
        data: result,
        message: '获取学员反馈成功',
      };
    } catch (error) {
      console.error('❌ 获取学员反馈失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取学员反馈失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ===============================
  // 阶段指派模式相关API
  // ===============================

  /**
   * 获取项目的师徒阶段列表
   * GET /api/projects/{projectId}/mentorship/phases
   */
  @Get('phases')
  async getProjectMentorshipPhases(
    @Param('projectId') projectId: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📋 获取项目师徒阶段 - 项目ID:', projectId);
      
      const result = await this.projectMentorshipService.getProjectMentorshipPhases(
        projectId,
        currentUserId || 'admin-001'
      );
      
      return {
        code: 200,
        data: result,
        message: '获取师徒阶段成功',
      };
    } catch (error) {
      console.error('❌ 获取师徒阶段失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取师徒阶段失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 创建阶段师徒关系
   * POST /api/projects/{projectId}/mentorship/phases/{phaseId}/relationships
   */
  @Post('phases/:phaseId/relationships')
  @HttpCode(HttpStatus.CREATED)
  async createPhaseAssignment(
    @Param('projectId') projectId: string,
    @Param('phaseId') phaseId: string,
    @Body() createDto: any, // TODO: 创建专门的DTO
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 创建阶段指派 - 项目ID:', projectId, '阶段ID:', phaseId);
      console.log('📝 指派数据:', createDto);
      
      const result = await this.projectMentorshipService.createPhaseAssignment(
        projectId,
        phaseId,
        createDto,
        currentUserId || 'admin-001'
      );
      
      return {
        code: 201,
        data: result,
        message: '阶段指派创建成功',
      };
    } catch (error) {
      console.error('❌ 创建阶段指派失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '创建阶段指派失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取阶段的师徒关系
   * GET /api/projects/{projectId}/mentorship/phases/{phaseId}/relationships
   */
  @Get('phases/:phaseId/relationships')
  async getPhaseAssignments(
    @Param('projectId') projectId: string,
    @Param('phaseId') phaseId: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📋 获取阶段指派 - 项目ID:', projectId, '阶段ID:', phaseId);
      
      const result = await this.projectMentorshipService.getPhaseAssignments(
        projectId,
        phaseId,
        currentUserId || 'admin-001'
      );
      
      return {
        code: 200,
        data: result,
        message: '获取阶段指派成功',
      };
    } catch (error) {
      console.error('❌ 获取阶段指派失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取阶段指派失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 删除阶段师徒关系
   * DELETE /api/projects/{projectId}/mentorship/phases/{phaseId}/relationships/{relationshipId}
   */
  @Delete('phases/:phaseId/relationships/:relationshipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePhaseAssignment(
    @Param('projectId') projectId: string,
    @Param('phaseId') phaseId: string,
    @Param('relationshipId') relationshipId: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🗑️ 删除阶段指派 - 项目ID:', projectId, '阶段ID:', phaseId, '关系ID:', relationshipId);
      
      await this.projectMentorshipService.removePhaseAssignment(
        relationshipId,
        currentUserId || 'admin-001'
      );
      
      return {
        code: 204,
        message: '阶段指派删除成功',
      };
    } catch (error) {
      console.error('❌ 删除阶段指派失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '删除阶段指派失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 