import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { MentorshipProjectService } from '../services/mentorship-project.service';
import { CreateMentorshipProjectDto, UpdateMentorshipProjectDto } from '../dto/mentorship-project.dto';
import { GetCurrentUserId } from '../../../shared/auth/decorators/current-user.decorator';

@Controller('mentorship/projects')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class MentorshipProjectController {
  constructor(
    private readonly mentorshipProjectService: MentorshipProjectService,
  ) {}

  /**
   * 获取带教项目列表
   * GET /api/mentorship/projects
   */
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取带教项目列表 - 参数:', { page, limit, status, type, search });
      
      const result = await this.mentorshipProjectService.findAll({
        page: page || 1,
        limit: limit || 20,
        status,
        type,
        search,
        currentUserId,
      });
      
      return {
        code: 200,
        data: result.data,
        pagination: result.pagination,
        message: '获取带教项目列表成功',
      };
    } catch (error) {
      console.error('❌ 获取带教项目列表失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取项目列表失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取带教项目详情
   * GET /api/mentorship/projects/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取带教项目详情 - ID:', id);
      
      const project = await this.mentorshipProjectService.findOne(id, currentUserId);
      
      if (!project) {
        throw new NotFoundException('带教项目不存在');
      }
      
      return {
        code: 200,
        data: project,
        message: '获取带教项目详情成功',
      };
    } catch (error) {
      console.error('❌ 获取带教项目详情失败:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取项目详情失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 创建带教项目
   * POST /api/mentorship/projects
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateMentorshipProjectDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 创建带教项目 - 数据:', createDto);
      
      createDto.createdBy = currentUserId || 'system';
      
      const project = await this.mentorshipProjectService.create(createDto);
      
      return {
        code: 201,
        data: project,
        message: '带教项目创建成功',
      };
    } catch (error) {
      console.error('❌ 创建带教项目失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '创建项目失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 更新带教项目
   * PUT /api/mentorship/projects/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMentorshipProjectDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 更新带教项目 - ID:', id, '数据:', updateDto);
      
      updateDto.updatedBy = currentUserId || 'system';
      
      const project = await this.mentorshipProjectService.update(id, updateDto);
      
      return {
        code: 200,
        data: project,
        message: '带教项目更新成功',
      };
    } catch (error) {
      console.error('❌ 更新带教项目失败:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        {
          code: 500,
          message: error.message || '更新项目失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 删除带教项目
   * DELETE /api/mentorship/projects/:id
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🗑️ 删除带教项目 - ID:', id);
      
      await this.mentorshipProjectService.remove(id, currentUserId);
      
      return {
        code: 200,
        message: '带教项目删除成功',
      };
    } catch (error) {
      console.error('❌ 删除带教项目失败:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        {
          code: 500,
          message: error.message || '删除项目失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 批量删除带教项目
   * DELETE /api/mentorship/projects
   */
  @Delete()
  async batchRemove(
    @Body() { ids }: { ids: string[] },
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🗑️ 批量删除带教项目 - IDs:', ids);
      
      if (!ids || ids.length === 0) {
        throw new BadRequestException('请提供要删除的项目ID列表');
      }
      
      const result = await this.mentorshipProjectService.batchRemove(ids, currentUserId);
      
      return {
        code: 200,
        data: result,
        message: '批量删除带教项目成功',
      };
    } catch (error) {
      console.error('❌ 批量删除带教项目失败:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        {
          code: 500,
          message: error.message || '批量删除项目失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取项目统计信息
   * GET /api/mentorship/projects/statistics
   */
  @Get('statistics/overview')
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📊 获取带教项目统计 - 时间范围:', startDate, '到', endDate);
      
      const statistics = await this.mentorshipProjectService.getStatistics({
        startDate,
        endDate,
        currentUserId,
      });
      
      return {
        code: 200,
        data: statistics,
        message: '获取项目统计信息成功',
      };
    } catch (error) {
      console.error('❌ 获取带教项目统计失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取统计信息失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 