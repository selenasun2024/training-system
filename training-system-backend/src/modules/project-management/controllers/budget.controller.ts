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
import { BudgetService, CreateBudgetLineDto, UpdateBudgetLineDto, BudgetQueryDto } from '../services/budget.service';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/auth/guards/roles.guard';
import { GetCurrentUserId } from '../../../shared/auth/decorators/current-user.decorator';

@Controller('projects/:projectId/budget-lines')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  /**
   * 获取项目预算明细
   */
  @Get()
  async getBudgetLines(
    @Param('projectId') projectId: string,
    @Query() query: BudgetQueryDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID
    const defaultUserId = '550e8400-e29b-41d4-a716-446655440001';
    const budgetLines = await this.budgetService.getBudgetLines(projectId, query, currentUserId || defaultUserId);
    return {
      code: 200,
      message: '获取预算明细成功',
      data: budgetLines,
    };
  }

  /**
   * 创建预算明细
   */
  @Post()
  // @UseGuards(RolesGuard)  // 暂时关闭角色守卫
  // @Roles('ADMIN', 'TEACHER')
  async createBudgetLines(
    @Param('projectId') projectId: string,
    @Body() createDto: CreateBudgetLineDto[],
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID
    const defaultUserId = '550e8400-e29b-41d4-a716-446655440001';
    const budgetLines = await this.budgetService.createBudgetLines(projectId, createDto, currentUserId || defaultUserId);
    return {
      code: 201,
      message: '创建预算明细成功',
      data: budgetLines,
    };
  }

  /**
   * 更新预算明细
   */
  @Patch(':id')
  // @UseGuards(RolesGuard)  // 暂时关闭角色守卫
  // @Roles('ADMIN', 'TEACHER')
  async updateBudgetLine(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateBudgetLineDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID
    const defaultUserId = '550e8400-e29b-41d4-a716-446655440001';
    const budgetLine = await this.budgetService.updateBudgetLine(projectId, id, updateDto, currentUserId || defaultUserId);
    return {
      code: 200,
      message: '更新预算明细成功',
      data: budgetLine,
    };
  }

  /**
   * 删除预算明细
   */
  @Delete(':id')
  // @UseGuards(RolesGuard)  // 暂时关闭角色守卫
  // @Roles('ADMIN', 'TEACHER')
  async deleteBudgetLine(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID
    const defaultUserId = '550e8400-e29b-41d4-a716-446655440001';
    await this.budgetService.deleteBudgetLine(projectId, id, currentUserId || defaultUserId);
    return {
      code: 200,
      message: '删除预算明细成功',
    };
  }
}

@Controller('projects/:projectId/budget-summary')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class BudgetSummaryController {
  constructor(private readonly budgetService: BudgetService) {}

  /**
   * 获取项目预算汇总
   */
  @Get()
  async getBudgetSummary(
    @Param('projectId') projectId: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID
    const defaultUserId = '550e8400-e29b-41d4-a716-446655440001';
    const summary = await this.budgetService.getBudgetSummary(projectId, currentUserId || defaultUserId);
    return {
      code: 200,
      message: '获取预算汇总成功',
      data: summary,
    };
  }
} 