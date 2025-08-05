import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService, DashboardQueryDto } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/auth/guards/roles.guard';
import { GetCurrentUserId, GetCurrentUserRoles } from '../../../shared/auth/decorators/current-user.decorator';

@Controller('workbench')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class WorkbenchController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * 获取管理员工作台数据
   */
  @Get('admin/dashboard')
  // @UseGuards(RolesGuard)  // 暂时关闭角色权限验证
  // @Roles('ADMIN', 'TEACHER')
  async getAdminDashboard(
    @Query() query: DashboardQueryDto,
    @GetCurrentUserId() userId?: string,
  ) {
    const defaultUserId = 'user-admin-001';
    const dashboard = await this.dashboardService.getAdminDashboard(userId || defaultUserId, query);
    return {
      code: 200,
      message: '获取管理员工作台成功',
      data: dashboard,
    };
  }

  /**
   * 获取辅导员工作台数据
   */
  @Get('counselor/dashboard')
  // @UseGuards(RolesGuard)  // 暂时关闭角色权限验证
  // @Roles('COUNSELOR', 'TEACHER', 'ADMIN')
  async getCounselorDashboard(
    @Query() query: DashboardQueryDto,
    @GetCurrentUserId() userId?: string,
  ) {
    // 使用辅导员ID作为默认值
    const defaultUserId = 'counselor-001';
    const dashboard = await this.dashboardService.getCounselorDashboard(userId || defaultUserId, query);
    return {
      code: 200,
      message: '获取辅导员工作台成功',
      data: dashboard,
    };
  }

  /**
   * 获取用户可访问的项目列表（用于筛选）
   */
  @Get('projects')
  async getProjectsForDashboard(
    @GetCurrentUserId() userId?: string,
    @Query('userId') queryUserId?: string,
  ) {
    // 优先使用查询参数中的用户ID，然后是认证用户ID，最后是真实存在的辅导员默认ID
    const actualUserId = queryUserId || userId || 'user-hr-001';
    console.log('🔍 获取项目列表 - 用户ID:', actualUserId);
    
    const projects = await this.dashboardService.getProjectsForDashboard(actualUserId);
    console.log('🔍 获取到的项目:', projects);
    
    return {
      code: 200,
      message: '获取项目列表成功',
      data: projects,
    };
  }

  /**
   * 获取用户快速统计数据
   */
  @Get('stats')
  async getQuickStats(@GetCurrentUserId() userId?: string) {
    const defaultUserId = 'user-admin-001';
    const stats = await this.dashboardService.getQuickStats(userId || defaultUserId);
    return {
      code: 200,
      message: '获取统计数据成功',
      data: stats,
    };
  }

  /**
   * 通用工作台数据（根据用户角色自动选择）
   */
  @Get('dashboard')
  async getDashboard(
    @Query() query: DashboardQueryDto,
    @GetCurrentUserId() userId?: string,
    @GetCurrentUserRoles() roles?: Array<{ name: string; projectId: string | null }>,
  ) {
    const defaultUserId = 'user-admin-001';
    const defaultRoles = [{ name: 'ADMIN', projectId: null }];
    const userRoleNames = (roles || defaultRoles).map(role => role.name);

    // 根据用户角色确定工作台类型
    if (userRoleNames.includes('ADMIN') || userRoleNames.includes('TEACHER')) {
      const dashboard = await this.dashboardService.getAdminDashboard(userId || defaultUserId, query);
      return {
        code: 200,
        message: '获取工作台数据成功',
        data: {
          type: 'admin',
          ...dashboard,
        },
      };
    } else if (userRoleNames.includes('COUNSELOR')) {
      const dashboard = await this.dashboardService.getCounselorDashboard(userId || defaultUserId, query);
      return {
        code: 200,
        message: '获取工作台数据成功',
        data: {
          type: 'counselor',
          ...dashboard,
        },
      };
    } else {
      // 学员或其他角色，返回简化的工作台数据
      const stats = await this.dashboardService.getQuickStats(userId || defaultUserId);
      const projects = await this.dashboardService.getProjectsForDashboard(userId || defaultUserId);
      
      return {
        code: 200,
        message: '获取工作台数据成功',
        data: {
          type: 'student',
          overview: stats,
          projects,
        },
      };
    }
  }
} 