import {
  Controller,
  Get,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ScoreService } from '../services/score.service';

@Controller('scores')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  /**
   * 获取项目成绩数据
   * GET /api/scores/projects/:projectId
   */
  @Get('projects/:projectId')
  async getProjectScores(
    @Param('projectId') projectId: string,
    @Query('groupId') groupId?: string,
  ) {
    try {
      console.log('🔍 获取项目成绩 - 项目ID:', projectId, '分组ID:', groupId);
      
      if (!projectId) {
        throw new HttpException(
          {
            code: 400,
            message: '项目ID不能为空',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const scores = await this.scoreService.getProjectScores(projectId, groupId);
      
      return {
        code: 200,
        data: scores,
        message: '获取成绩数据成功',
      };
    } catch (error) {
      console.error('❌ 获取项目成绩失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取成绩数据失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取学员个人成绩详情
   * GET /api/scores/projects/:projectId/students/:studentId
   */
  @Get('projects/:projectId/students/:studentId')
  async getStudentScore(
    @Param('projectId') projectId: string,
    @Param('studentId') studentId: string,
  ) {
    try {
      console.log('🔍 获取学员成绩 - 项目ID:', projectId, '学员ID:', studentId);
      
      const studentScore = await this.scoreService.getStudentScore(projectId, studentId);
      
      return {
        code: 200,
        data: studentScore,
        message: '获取学员成绩成功',
      };
    } catch (error) {
      console.error('❌ 获取学员成绩失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取学员成绩失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 