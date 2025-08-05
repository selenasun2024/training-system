import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ObservationService } from '../services/observation.service';
import { CreateObservationDto, UpdateObservationDto, ObservationQueryDto, AdminObserveQueryDto } from '../dto/observation.dto';

@Controller('observations')
export class ObservationController {
  constructor(private readonly observationService: ObservationService) {}

  /**
   * 获取辅导员的观察目标列表
   * GET /api/observations/counselor/:counselorId
   * 支持管理员访问任意辅导员的数据
   */
  @Get('counselor/:counselorId')
  async getObservationsForCounselor(
    @Param('counselorId') counselorId: string,
    @Query('requesterId') requesterId?: string
  ) {
    return await this.observationService.getObservationsForCounselor(counselorId, requesterId);
  }

  /**
   * 提交观察记录
   * POST /api/observations/submit
   */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitObservation(
    @Body() body: {
      observerId: string;
      target: any;
      content: string;
      tags?: string[];
    }
  ) {
    const { observerId, target, content, tags = [] } = body;
    await this.observationService.submitObservation(observerId, target, content, tags);
    return { message: '观察记录提交成功' };
  }

  /**
   * 创建观察记录
   * POST /api/observations
   */
  @Post()
  async createObservation(
    @Body() createDto: CreateObservationDto,
    @Query('observerId') observerId: string
  ) {
    return await this.observationService.createObservation(observerId, createDto);
  }

  /**
   * 获取观察记录列表
   * GET /api/observations
   */
  @Get()
  async getObservations(@Query() query: ObservationQueryDto) {
    return await this.observationService.getObservations(query);
  }

  /**
   * 更新观察记录
   * PUT /api/observations/:id
   */
  @Put(':id')
  async updateObservation(
    @Param('id') id: string,
    @Body() updateDto: UpdateObservationDto
  ) {
    return await this.observationService.updateObservation(id, updateDto);
  }

  /**
   * 删除观察记录
   * DELETE /api/observations/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteObservation(@Param('id') id: string) {
    await this.observationService.deleteObservation(id);
  }

  /**
   * 管理员获取项目观察记录
   * GET /api/observations/projects/:projectId/admin
   */
  @Get('projects/:projectId/admin')
  async getObservationRecordsForAdmin(
    @Param('projectId') projectId: string,
    @Query() query: AdminObserveQueryDto
  ) {
    return await this.observationService.getObservationRecordsForAdmin(projectId, query);
  }

  /**
   * 获取项目观察统计
   * GET /api/observations/projects/:projectId/stats
   */
  @Get('projects/:projectId/stats')
  async getProjectObservationStats(@Param('projectId') projectId: string) {
    return await this.observationService.getProjectObservationStats(projectId);
  }

  /**
   * 教务管理员获取所有辅导员观察数据概览
   * GET /api/observations/admin/overview
   * 专为开发阶段和管理员测试使用
   */
  @Get('admin/overview')
  async getAdminObservationOverview(@Query('adminId') adminId: string) {
    if (!adminId) {
      throw new Error('需要提供管理员ID');
    }
    return await this.observationService.getAllCounselorsObservationOverview(adminId);
  }
} 