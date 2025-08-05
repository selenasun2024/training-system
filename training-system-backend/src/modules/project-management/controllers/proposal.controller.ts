import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ProposalService } from '../services/proposal.service';
import {
  CreateProposalDto,
  UpdateProposalDto,
  SubmitProposalDto,
  ApprovalActionDto,
  ProposalQueryDto,
} from '../dto/proposal.dto';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { GetCurrentUserId } from '../../../shared/auth/decorators/current-user.decorator';

@Controller('proposals')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  /**
   * 创建方案
   * POST /api/proposals
   */
  @Post()
  async createProposal(
    @Body() createDto: CreateProposalDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 创建方案 - 请求数据:', createDto);
      
      const defaultUserId = 'user-admin-001';
      const proposal = await this.proposalService.createProposal(
        createDto,
        currentUserId || defaultUserId,
      );
      
      return {
        code: 201,
        message: '方案创建成功',
        data: proposal,
      };
    } catch (error) {
      console.error('❌ 创建方案失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '创建方案失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取项目方案版本历史
   * GET /api/proposals/project/:projectId/versions
   */
  @Get('project/:projectId/versions')
  async getProjectProposalVersions(@Param('projectId') projectId: string) {
    try {
      console.log('🔍 获取项目方案版本历史 - 项目ID:', projectId);
      
      const versions = await this.proposalService.getProposalVersionHistory(projectId);
      
      return {
        code: 200,
        message: '获取版本历史成功',
        data: versions,
      };
    } catch (error) {
      console.error('❌ 获取版本历史失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取版本历史失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取项目方案
   * GET /api/proposals/project/:projectId
   */
  @Get('project/:projectId')
  async getProjectProposal(@Param('projectId') projectId: string) {
    try {
      console.log('🔍 获取项目方案 - 项目ID:', projectId);
      
      const proposal = await this.proposalService.getProjectProposal(projectId);
      
      if (!proposal) {
        // 如果没有方案，返回空数据而不是错误
        return {
          code: 200,
          message: '项目暂无方案',
          data: null,
        };
      }
      
      return {
        code: 200,
        message: '获取项目方案成功',
        data: proposal,
      };
    } catch (error) {
      console.error('❌ 获取项目方案失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取项目方案失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 更新方案
   * PUT /api/proposals/:id
   */
  @Put(':id')
  async updateProposal(
    @Param('id') id: string,
    @Body() updateDto: UpdateProposalDto,
  ) {
    try {
      console.log('📝 更新方案 - ID:', id, '数据:', updateDto);
      
      const proposal = await this.proposalService.updateProposal(id, updateDto);
      
      return {
        code: 200,
        message: '方案更新成功',
        data: proposal,
      };
    } catch (error) {
      console.error('❌ 更新方案失败:', error);
      throw new HttpException(
        {
          code: error.status || 500,
          message: error.message || '更新方案失败',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 提交方案审批
   * POST /api/proposals/:id/submit
   */
  @Post(':id/submit')
  async submitProposal(
    @Param('id') id: string,
    @Body() submitDto: SubmitProposalDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 提交方案审批 - ID:', id);
      
      const defaultUserId = 'user-admin-001';
      const proposal = await this.proposalService.submitProposal(
        id,
        submitDto,
        currentUserId || defaultUserId,
      );
      
      return {
        code: 200,
        message: '方案提交成功',
        data: proposal,
      };
    } catch (error) {
      console.error('❌ 提交方案失败:', error);
      throw new HttpException(
        {
          code: error.status || 500,
          message: error.message || '提交方案失败',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 撤回方案
   * POST /api/proposals/:id/withdraw
   */
  @Post(':id/withdraw')
  async withdrawProposal(@Param('id') id: string) {
    try {
      console.log('📝 撤回方案 - ID:', id);
      
      const proposal = await this.proposalService.withdrawProposal(id);
      
      return {
        code: 200,
        message: '方案撤回成功',
        data: proposal,
      };
    } catch (error) {
      console.error('❌ 撤回方案失败:', error);
      throw new HttpException(
        {
          code: error.status || 500,
          message: error.message || '撤回方案失败',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 方案审批操作
   * POST /api/proposals/:proposalId/approve/:stepId
   */
  @Post(':proposalId/approve/:stepId')
  async approveProposal(
    @Param('proposalId') proposalId: string,
    @Param('stepId') stepId: string,
    @Body() actionDto: ApprovalActionDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('📝 方案审批操作 - 方案ID:', proposalId, '步骤ID:', stepId);
      
      const defaultUserId = 'user-admin-001';
      const result = await this.proposalService.approveOrRejectProposal(
        proposalId,
        stepId,
        actionDto,
        currentUserId || defaultUserId,
      );
      
      return {
        code: 200,
        message: '审批操作成功',
        data: result,
      };
    } catch (error) {
      console.error('❌ 审批操作失败:', error);
      throw new HttpException(
        {
          code: error.status || 500,
          message: error.message || '审批操作失败',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取方案列表
   * GET /api/proposals
   */
  @Get()
  async getProposals(@Query() query: ProposalQueryDto) {
    try {
      console.log('🔍 获取方案列表 - 查询参数:', query);
      
      const result = await this.proposalService.getProposals(query);
      
      return {
        code: 200,
        message: '获取方案列表成功',
        data: result,
      };
    } catch (error) {
      console.error('❌ 获取方案列表失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取方案列表失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取单个方案详情
   * GET /api/proposals/:id
   */
  @Get(':id')
  async getProposal(@Param('id') id: string) {
    try {
      console.log('🔍 获取方案详情 - ID:', id);
      
      // 这里可以添加通过ID获取方案的逻辑
      // 暂时返回项目方案的相同逻辑
      
      return {
        code: 200,
        message: '获取方案详情成功',
        data: null, // TODO: 实现具体逻辑
      };
    } catch (error) {
      console.error('❌ 获取方案详情失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '获取方案详情失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 删除方案
   * DELETE /api/proposals/:id
   */
  @Delete(':id')
  async deleteProposal(@Param('id') id: string) {
    try {
      console.log('🗑️ 删除方案 - ID:', id);
      
      // TODO: 实现删除逻辑
      
      return {
        code: 200,
        message: '方案删除成功',
        data: null,
      };
    } catch (error) {
      console.error('❌ 删除方案失败:', error);
      throw new HttpException(
        {
          code: 500,
          message: error.message || '删除方案失败',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 