import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ResourceService, CreateResourceDto, UpdateResourceDto, ResourceQueryDto } from '../services/resource.service';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/auth/guards/roles.guard';
import { GetCurrentUserId } from '../../../shared/auth/decorators/current-user.decorator';

@Controller('projects/:projectId/resources')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  /**
   * 获取项目资源列表
   */
  @Get()
  async getResources(
    @Param('projectId') projectId: string,
    @Query() query: ResourceQueryDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID
    const defaultUserId = '550e8400-e29b-41d4-a716-446655440001';
    const result = await this.resourceService.getResources(projectId, query, currentUserId || defaultUserId);
    
    // 直接返回资源数组，简化前端处理
    return result.resources || [];
  }

  /**
   * 创建项目资源
   */
  @Post()
  // @UseGuards(RolesGuard)  // 暂时关闭角色守卫
  // @Roles('ADMIN', 'TEACHER')
  async createResource(
    @Param('projectId') projectId: string,
    @Body() createDto: CreateResourceDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID
    const defaultUserId = '550e8400-e29b-41d4-a716-446655440001';
    const resource = await this.resourceService.createResource(projectId, createDto, currentUserId || defaultUserId);
    return {
      code: 201,
      message: '创建资源成功',
      data: resource,
    };
  }

  /**
   * 更新项目资源
   */
  @Patch(':id')
  // @UseGuards(RolesGuard)  // 暂时关闭角色守卫
  // @Roles('ADMIN', 'TEACHER')
  async updateResource(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateResourceDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID
    const defaultUserId = '550e8400-e29b-41d4-a716-446655440001';
    const resource = await this.resourceService.updateResource(projectId, id, updateDto, currentUserId || defaultUserId);
    return {
      code: 200,
      message: '更新资源成功',
      data: resource,
    };
  }

  /**
   * 删除项目资源
   */
  @Delete(':id')
  // @UseGuards(RolesGuard)  // 暂时关闭角色守卫
  // @Roles('ADMIN', 'TEACHER')
  async deleteResource(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID
    const defaultUserId = '550e8400-e29b-41d4-a716-446655440001';
    await this.resourceService.deleteResource(projectId, id, currentUserId || defaultUserId);
    return {
      code: 200,
      message: '删除资源成功',
    };
  }
} 