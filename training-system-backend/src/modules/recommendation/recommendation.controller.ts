import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,

  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';
import { RecommendationService } from './recommendation.service';
import { GetCurrentUserId } from '../../shared/auth/decorators/current-user.decorator';

// 暂时使用字符串类型，等 Prisma 客户端重新生成后再改回来
type RecommendationType = 'YULIN' | 'JINYI';
type RecommendationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

@Controller('recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * 获取有观察记录的学员表现数据
   * 根据标准：只有辅导员给学员做过观察记录并提交的学员，才显示在人才推荐页面
   */
  @Get('projects/:projectId/students')
  async getStudentPerformanceWithObservations(
    @Param('projectId') projectId: string,
    @Query('counselorId') counselorId?: string,
    @GetCurrentUserId() currentUserId?: string
  ) {
    try {
      // 使用查询参数中的辅导员ID，或者当前用户ID，或者默认辅导员ID
      const actualCounselorId = counselorId || currentUserId || 'user-hr-001';
      
      const students = await this.recommendationService.getStudentPerformanceWithObservations(
        projectId, 
        actualCounselorId
      );
      
      return {
        success: true,
        data: students,
        message: `找到 ${students.length} 名有观察记录的学员`
      };
    } catch (error) {
      console.error('获取学员表现数据失败:', error);
      return {
        success: false,
        data: [],
        message: '获取学员表现数据失败: ' + error.message
      };
    }
  }

  /**
   * 获取辅导员的推荐记录
   */
  @Get('projects/:projectId/my-recommendations')
  async getCounselorRecommendations(
    @Param('projectId') projectId: string,
    @Query('counselorId') counselorId?: string,
    @GetCurrentUserId() currentUserId?: string
  ) {
    try {
      // 使用查询参数中的辅导员ID，或者当前用户ID，或者默认辅导员ID
      const actualCounselorId = counselorId || currentUserId || 'user-hr-001';
      
      const recommendations = await this.recommendationService.getCounselorRecommendations(
        projectId,
        actualCounselorId
      );
      
      return {
        success: true,
        data: recommendations,
        message: `找到 ${recommendations.length} 条推荐记录`
      };
    } catch (error) {
      console.error('获取辅导员推荐记录失败:', error);
      return {
        success: false,
        data: [],
        message: '获取推荐记录失败: ' + error.message
      };
    }
  }

  /**
   * 提交推荐
   */
  @Post('projects/:projectId')
  async submitRecommendations(
    @Param('projectId') projectId: string,
    @Body() recommendations: any,
    @Query('counselorId') counselorId?: string,
    @GetCurrentUserId() currentUserId?: string
  ) {
    try {
      // 使用查询参数中的辅导员ID，或者当前用户ID，或者默认辅导员ID
      const actualCounselorId = counselorId || currentUserId || 'user-hr-001';
      
      console.log('🔍 提交推荐 - 项目ID:', projectId);
      console.log('🔍 提交推荐 - 辅导员ID:', actualCounselorId);
      console.log('🔍 提交推荐 - 推荐数据:', recommendations);
      
      await this.recommendationService.submitRecommendations(
        projectId,
        actualCounselorId,
        recommendations
      );
      
      return {
        success: true,
        message: '推荐提交成功'
      };
    } catch (error) {
      console.error('提交推荐失败:', error);
      return {
        success: false,
        message: '提交推荐失败: ' + error.message
      };
    }
  }

  /**
   * 获取有推荐记录的项目列表（管理员专用）
   */
  @Get('admin/projects-with-recommendations')
  async getProjectsWithRecommendations() {
    try {
      console.log('🔍 获取有推荐记录的项目列表');
      
      // 查询所有推荐记录，检查数据是否存在
      const allRecommendations = await this.prisma.recommendation.findMany({
        select: {
          id: true,
          projectId: true,
          studentId: true,
          type: true,
          status: true,
        }
      });
      
      console.log('🔍 推荐记录总数:', allRecommendations.length);
      console.log('🔍 推荐记录示例:', allRecommendations.slice(0, 3));
      
      if (allRecommendations.length === 0) {
        console.log('⚠️ 数据库中没有任何推荐记录');
        return {
          success: true,
          data: [],
          message: '数据库中暂无推荐记录'
        };
      }
      
      // 手动统计每个项目的推荐数量
      const projectStats = new Map<string, number>();
      allRecommendations.forEach(rec => {
        if (rec.projectId) {
          projectStats.set(rec.projectId, (projectStats.get(rec.projectId) || 0) + 1);
        }
      });
      
      const uniqueProjectIds = Array.from(projectStats.keys());
      console.log('🔍 有推荐记录的项目ID列表:', uniqueProjectIds);
      console.log('🔍 项目推荐统计:', Object.fromEntries(projectStats));

      if (uniqueProjectIds.length === 0) {
        console.log('⚠️ 推荐记录中没有有效的项目ID');
        return {
          success: true,
          data: [],
          message: '推荐记录中没有有效的项目ID'
        };
      }

      // 获取项目详细信息
      const projects = await this.prisma.trainingProject.findMany({
        where: {
          id: {
            in: uniqueProjectIds
          }
        },
        select: {
          id: true,
          name: true,
          projectNo: true,
          status: true,
          currentStage: true
        }
      });

      console.log('🔍 查询到的项目详情:', projects);

      // 合并项目信息和推荐数量
      const result = projects.map(project => ({
        id: project.id,
        name: project.name,
        projectNo: project.projectNo,
        status: project.status,
        currentStage: project.currentStage,
        recommendationCount: projectStats.get(project.id) || 0
      }));

      console.log('🔍 返回的项目列表:', result);

      return {
        success: true,
        data: result,
        message: `找到 ${result.length} 个有推荐记录的项目`
      };
    } catch (error) {
      console.error('❌ 获取有推荐记录的项目失败:', error);
      return {
        success: false,
        data: [],
        message: '获取项目列表失败: ' + error.message
      };
    }
  }

  /**
   * 获取推荐列表（管理员专用）
   */
  @Get('admin/projects/:projectId')
  async getRecommendations(
    @Param('projectId') projectId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      console.log('🔍 管理员查询推荐列表 - 项目ID:', projectId);
      console.log('🔍 查询参数:', { page, limit, status, type, search });

      // 构建查询条件
      const whereCondition: any = {
        projectId: projectId
      };

      if (status && status !== 'all') {
        whereCondition.status = status;
      }

      if (type && type !== 'all') {
        whereCondition.type = type;
      }

      // 获取推荐列表 - 使用Prisma ORM查询
      const recommendations = await this.prisma.recommendation.findMany({
        where: whereCondition,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              position: true
            }
          },
          counselor: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              position: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: skip,
        take: take
      });

      // 获取总数
      const total = await this.prisma.recommendation.count({
        where: whereCondition
      });

      console.log('🔍 查询结果:', {
        找到推荐记录: recommendations.length,
        总记录数: total,
        页码: parseInt(page),
        每页条数: parseInt(limit)
      });

      // 格式化数据以匹配前端期望的格式
      const formattedRecommendations = recommendations.map(rec => ({
        id: rec.id,
        projectId: rec.projectId,
        studentId: rec.studentId,
        counselorId: rec.counselorId,
        type: rec.type,
        status: rec.status,
        leadership: rec.leadership,
        innovation: rec.innovation,
        execution: rec.execution,
        teamwork: rec.teamwork,
        reason: rec.reason,
        reviewerId: rec.reviewerId,
        reviewComment: rec.reviewComment,
        reviewedAt: rec.reviewedAt,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt,
        // 学员信息
        student_name: rec.student?.name || `未找到学员 ${rec.studentId}`,
        student_email: rec.student?.email || 'N/A',
        student_department: rec.student?.department || 'N/A',
        // 辅导员信息
        counselor_name: rec.counselor?.name || `未找到辅导员 ${rec.counselorId}`,
        counselor_email: rec.counselor?.email || 'N/A',
        counselor_department: rec.counselor?.department || 'N/A',
        // 审核员信息
        reviewer_name: rec.reviewer?.name || (rec.reviewerId ? `未找到审核员 ${rec.reviewerId}` : null)
      }));

      // 检查数据完整性并记录警告
      formattedRecommendations.forEach(rec => {
        if (rec.student_name.includes('未找到')) {
          console.warn(`⚠️ 警告：学员ID ${rec.studentId} 在users表中不存在`);
        }
        if (rec.counselor_name.includes('未找到')) {
          console.warn(`⚠️ 警告：辅导员ID ${rec.counselorId} 在users表中不存在`);
        }
      });

      return {
        success: true,
        data: {
          recommendations: formattedRecommendations,
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      };

    } catch (error) {
      console.error('获取推荐列表失败:', error);
      throw error;
    }
  }

  /**
   * 审核推荐
   */
  @Post('admin/projects/:projectId/recommendations/:recommendationId/review')
  async reviewRecommendation(
    @Param('projectId') projectId: string,
    @Param('recommendationId') recommendationId: string,
    @Body() reviewData: { status: 'APPROVED' | 'REJECTED'; comment?: string },
    @GetCurrentUserId() reviewerId?: string
  ) {
    try {
      const actualReviewerId = reviewerId || 'user-admin-001';
      
      await this.prisma.recommendation.update({
        where: { id: recommendationId },
        data: {
          status: reviewData.status,
          reviewerId: actualReviewerId,
          reviewComment: reviewData.comment,
          reviewedAt: new Date()
        }
      });

      return {
        success: true,
        message: '审核完成'
      };
    } catch (error) {
      console.error('审核推荐失败:', error);
      return {
        success: false,
        message: '审核推荐失败: ' + error.message
      };
    }
  }

  /**
   * 获取推荐统计数据
   */
  @Get('admin/projects/:projectId/stats')
  async getRecommendationStats(@Param('projectId') projectId: string) {
    try {
      const stats = await this.prisma.recommendation.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { status: true }
      });

      const result = {
        total: stats.reduce((sum, stat) => sum + stat._count.status, 0),
        pending: stats.find(s => s.status === 'PENDING')?._count.status || 0,
        approved: stats.find(s => s.status === 'APPROVED')?._count.status || 0,
        rejected: stats.find(s => s.status === 'REJECTED')?._count.status || 0
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('获取推荐统计失败:', error);
      return {
        success: false,
        data: { total: 0, pending: 0, approved: 0, rejected: 0 },
        message: '获取推荐统计失败: ' + error.message
      };
    }
  }

  /**
   * 更新学员表现数据
   */
  @Post('projects/:projectId/students/:studentId/performance')
  async updateStudentPerformance(
    @Param('projectId') projectId: string,
    @Param('studentId') studentId: string,
    @Body() performance: any
  ) {
    try {
      await this.recommendationService.updateStudentPerformance(
        projectId,
        studentId,
        performance
      );
      
      return {
        success: true,
        message: '学员表现数据更新成功'
      };
    } catch (error) {
      console.error('更新学员表现数据失败:', error);
      return {
        success: false,
        message: '更新学员表现数据失败: ' + error.message
      };
    }
  }

  /**
   * 生成 UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 提交最终推荐名单
   */
  @Post('admin/projects/:projectId/submit-final')
  @HttpCode(HttpStatus.OK)
  async submitFinalList(
    @Param('projectId') projectId: string,
    @Body() finalList: { yulinList: string[]; jinyiList: string[] }
  ) {
    try {
      // 这里可以添加提交最终名单的逻辑
      // 比如更新推荐状态、发送通知等
      
      console.log('🔍 提交最终推荐名单:', finalList);
      
      return {
        success: true,
        message: '最终推荐名单提交成功'
      };
    } catch (error) {
      console.error('提交最终推荐名单失败:', error);
      return {
        success: false,
        message: '提交最终推荐名单失败: ' + error.message
      };
    }
  }
} 