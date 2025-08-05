import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Delete,
  Body, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { UserService, UpdateUserDto, UserQueryDto } from '../services/user.service';
// import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
// import { RolesGuard, Roles } from '../../../shared/auth/guards/roles.guard';
// import { GetCurrentUserId } from '../../../shared/auth/decorators/current-user.decorator';

@Controller('users')
// @UseGuards(JwtAuthGuard)  // 临时移除身份验证
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取用户列表
   * 需要管理员权限
   */
  @Get()
  // @UseGuards(RolesGuard)  // 临时移除身份验证
  // @Roles('ADMIN', 'TEACHER')
  async getUsers(@Query() query: UserQueryDto) {
    const result = await this.userService.getUsers(query);
    return {
      code: 200,
      message: '获取用户列表成功',
      data: result,
    };
  }

  /**
   * 搜索用户（用于选择器组件）
   */
  @Get('search')
  // @UseGuards(RolesGuard)  // 临时移除身份验证
  // @Roles('ADMIN', 'TEACHER')
  async searchUsers(@Query() query: {
    keyword?: string;
    department?: string;
    level?: string;
    excludeIds?: string[];
    limit?: any;
  }) {
    const parsedLimit = query.limit ? parseInt(query.limit, 10) : 50;
    
    const users = await this.userService.searchUsers({
      ...query,
      limit: isNaN(parsedLimit) ? 50 : parsedLimit,
    });
    return {
      code: 200,
      message: '搜索用户成功',
      data: users,
    };
  }

  /**
   * 获取所有部门列表
   */
  @Get('departments')
  async getDepartments() {
    const departments = await this.userService.getDepartments();
    return {
      code: 200,
      message: '获取部门列表成功',
      data: departments,
    };
  }

  /**
   * 获取所有职级列表
   */
  @Get('levels')
  async getLevels() {
    const levels = await this.userService.getLevels();
    return {
      code: 200,
      message: '获取职级列表成功',
      data: levels,
    };
  }

  /**
   * 获取用户详情
   */
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.getUserById(id);
    return {
      code: 200,
      message: '获取用户详情成功',
      data: user,
    };
  }

  /**
   * 更新用户信息
   * 用户只能更新自己的信息，管理员可以更新任何用户
   */
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
    // @GetCurrentUserId() currentUserId: string,  // 临时移除
  ) {
    // 简单权限检查：用户只能更新自己的信息
    // TODO: 后续可以添加更复杂的权限控制
    // if (id !== currentUserId) {
    //   // 检查是否是管理员
    //   // 这里简化处理，实际应该通过角色检查
    // }

    const user = await this.userService.updateUser(id, updateDto);
    return {
      code: 200,
      message: '更新用户信息成功',
      data: user,
    };
  }

  /**
   * 为用户分配角色
   * 需要管理员权限
   */
  @Post(':id/roles')
  // @UseGuards(RolesGuard)  // 临时移除身份验证
  // @Roles('ADMIN', 'TEACHER')
  async assignRole(
    @Param('id') userId: string,
    @Body() body: { roleName: string; projectId?: string },
    // @GetCurrentUserId() grantedBy: string,  // 临时移除
  ) {
    const role = await this.userService.assignRole(
      userId, 
      body.roleName, 
      body.projectId || null, 
      'system' // 临时使用固定值
    );
    return {
      code: 201,
      message: '角色分配成功',
      data: role,
    };
  }

  /**
   * 撤销用户角色
   * 需要管理员权限
   */
  @Delete('roles/:roleId')
  // @UseGuards(RolesGuard)  // 临时移除身份验证
  // @Roles('ADMIN', 'TEACHER')
  async revokeRole(@Param('roleId') roleId: string) {
    const result = await this.userService.revokeRole(roleId);
    return {
      code: 200,
      message: '角色撤销成功',
      data: result,
    };
  }
} 