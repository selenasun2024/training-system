import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectService, UpdateStageDto } from '../services/project.service';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/auth/guards/roles.guard';
import { GetCurrentUserId } from '../../../shared/auth/decorators/current-user.decorator';

@Controller('stages')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class StageController {
  constructor(private readonly projectService: ProjectService) {}

  /**
   * 获取阶段详情
   * GET /api/stages/:id
   */
  @Get(':id')
  async getStageById(@Param('id') id: string) {
    try {
      console.log('🔍 获取阶段详情 - 阶段ID:', id);
      
      const stage = await this.projectService.getStageById(id);
      
      return {
        code: 200,
        message: '获取阶段详情成功',
        data: stage,
      };
    } catch (error) {
      console.error('❌ 获取阶段详情失败:', error);
      throw new NotFoundException(`获取阶段详情失败: ${error.message}`);
    }
  }

  /**
   * 更新阶段
   * PUT /api/stages/:id
   */
  @Put(':id')
  // @UseGuards(RolesGuard)  // 暂时关闭角色权限验证
  // @Roles('ADMIN', 'TEACHER')
  async updateStage(
    @Param('id') id: string,
    @Body() updateDto: UpdateStageDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 更新阶段 - 阶段ID:', id, '更新数据:', updateDto);
      
      // 临时使用默认用户ID (管理员用户)
      const defaultUserId = 'user-admin-001';
      const stage = await this.projectService.updateStage(id, updateDto, currentUserId || defaultUserId);
      
      return {
        code: 200,
        message: '阶段更新成功',
        data: stage,
      };
    } catch (error) {
      console.error('❌ 更新阶段失败:', error);
      throw new BadRequestException(`更新阶段失败: ${error.message}`);
    }
  }

  /**
   * 删除阶段
   * DELETE /api/stages/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  // @UseGuards(RolesGuard)  // 暂时关闭角色权限验证
  // @Roles('ADMIN', 'TEACHER')
  async deleteStage(
    @Param('id') id: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🗑️ 删除阶段 - 阶段ID:', id);
      
      // 临时使用默认用户ID (管理员用户)
      const defaultUserId = 'user-admin-001';
      await this.projectService.deleteStage(id, currentUserId || defaultUserId);
      
      console.log('✅ 阶段删除成功');
    } catch (error) {
      console.error('❌ 删除阶段失败:', error);
      throw new BadRequestException(`删除阶段失败: ${error.message}`);
    }
  }

  /**
   * 完成阶段
   * POST /api/stages/:id/complete
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(RolesGuard)  // 暂时关闭角色权限验证
  // @Roles('ADMIN', 'TEACHER')
  async completeStage(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('✅ 完成阶段 - 阶段ID:', id, '备注:', body.notes);
      
      // 临时使用默认用户ID (管理员用户)
      const defaultUserId = 'user-admin-001';
      const stage = await this.projectService.completeStage(id, body.notes, currentUserId || defaultUserId);
      
      return {
        code: 200,
        message: '阶段完成成功',
        data: stage,
      };
    } catch (error) {
      console.error('❌ 完成阶段失败:', error);
      throw new BadRequestException(`完成阶段失败: ${error.message}`);
    }
  }

  /**
   * 重新激活阶段
   * POST /api/stages/:id/reactivate
   */
  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(RolesGuard)  // 暂时关闭角色权限验证
  // @Roles('ADMIN', 'TEACHER')
  async reactivateStage(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔄 重新激活阶段 - 阶段ID:', id, '备注:', body.notes);
      
      // 临时使用默认用户ID (管理员用户)
      const defaultUserId = 'user-admin-001';
      const stage = await this.projectService.reactivateStage(id, body.notes, currentUserId || defaultUserId);
      
      return {
        code: 200,
        message: '阶段重新激活成功',
        data: stage,
      };
    } catch (error) {
      console.error('❌ 重新激活阶段失败:', error);
      throw new BadRequestException(`重新激活阶段失败: ${error.message}`);
    }
  }

  /**
   * 获取阶段任务列表
   * GET /api/stages/:id/tasks
   */
  @Get(':id/tasks')
  async getStageTasks(@Param('id') stageId: string) {
    try {
      console.log('🔍 获取阶段任务列表 - 阶段ID:', stageId);
      
      const tasks = await this.projectService.getStageTasks(stageId);
      
      return {
        code: 200,
        message: '获取阶段任务列表成功',
        data: tasks,
      };
    } catch (error) {
      console.error('❌ 获取阶段任务列表失败:', error);
      throw new NotFoundException(`获取阶段任务列表失败: ${error.message}`);
    }
  }
} 