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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ProjectService, CreateProjectDto, UpdateProjectDto, ProjectQueryDto, CreateStageDto } from '../services/project.service';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/auth/guards/roles.guard';
import { GetCurrentUserId } from '../../../shared/auth/decorators/current-user.decorator';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';

@Controller('projects')
// @UseGuards(JwtAuthGuard)  // 暂时关闭认证，专注于核心功能调试
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 获取或创建默认用户
   */
  private async getOrCreateDefaultUser(): Promise<string> {
    // 先尝试查找现有的管理员用户
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: 'user-admin-001' },
          { username: 'admin' },
          { name: { contains: '管理员' } }
        ]
      }
    });
    
    if (existingUser) {
      return existingUser.id;
    }
    
    // 如果没有找到，创建一个默认用户
    const defaultUser = await this.prisma.user.create({
      data: {
        id: 'user-admin-001',
        username: 'admin',
        email: 'admin@training.com',
        passwordHash: '$2a$10$HbI0d4AvowjOoC0TXQF9ye3D1YQh/ARDb/wOcU3ePmdUOscTBjKvi', // 使用正确的哈希密码 (对应密码: admin123)
        name: '系统管理员',
        status: 'ACTIVE',
        department: '系统管理部',
        position: '系统管理员',
        level: '管理员',
      },
    });
    
    return defaultUser.id;
  }

  /**
   * 创建培训项目
   */
  @Post()
  // @UseGuards(RolesGuard)  // 暂时关闭角色权限验证
  // @Roles('ADMIN', 'TEACHER')
  async createProject(
    @Body() createDto: CreateProjectDto,
    @GetCurrentUserId() ownerId?: string,
  ) {
    try {
      // 获取或创建默认用户
      const defaultUserId = await this.getOrCreateDefaultUser();
      const project = await this.projectService.createProject(createDto, ownerId || defaultUserId);
      return {
        code: 201,
        message: '项目创建成功',
        data: project,
      };
    } catch (error) {
      console.error('❌ 项目创建失败:', error);
      return {
        code: 500,
        message: `项目创建失败: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * 获取项目列表
   */
  @Get()
  async getProjects(
    @Query() query: ProjectQueryDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      console.log('🔍 获取项目列表 - 查询参数:', query);
      console.log('🔍 当前用户ID:', currentUserId);
      
      // 临时使用默认用户ID (管理员用户)
      const defaultUserId = 'user-admin-001';
      const result = await this.projectService.getProjects(query, currentUserId || defaultUserId);
      
      console.log('✅ 项目列表获取成功, 项目数量:', result.projects?.length || 0);
      
      return {
        code: 200,
        message: '获取项目列表成功',
        data: result,
      };
    } catch (error) {
      console.error('❌ 获取项目列表失败:', error);
      console.error('❌ 错误详情:', error.message);
      console.error('❌ 错误堆栈:', error.stack);
      
      return {
        code: 500,
        message: `获取项目列表失败: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * 获取项目详情
   */
  @Get(':id')
  async getProjectById(@Param('id') id: string) {
    const project = await this.projectService.getProjectById(id);
    return {
      code: 200,
      message: '获取项目详情成功',
      data: project,
    };
  }

  /**
   * 更新项目信息
   */
  @Put(':id')
  // @UseGuards(RolesGuard)  // 暂时关闭角色权限验证
  // @Roles('ADMIN', 'TEACHER')
  async updateProject(
    @Param('id') id: string,
    @Body() updateDto: UpdateProjectDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID (管理员用户)
    const defaultUserId = 'user-admin-001';
    const project = await this.projectService.updateProject(id, updateDto, currentUserId || defaultUserId);
    return {
      code: 200,
      message: '项目更新成功',
      data: project,
    };
  }

  /**
   * 发布项目（将项目状态从DRAFT改为ACTIVE）
   */
  @Put(':id/publish')
  async publishProject(
    @Param('id') id: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID (管理员用户)
    const defaultUserId = 'user-admin-001';
    const project = await this.projectService.publishProject(id, currentUserId || defaultUserId);
    return {
      code: 200,
      message: '项目发布成功',
      data: project,
    };
  }

  /**
   * 删除项目
   */
  @Delete(':id')
  // @UseGuards(RolesGuard)  // 暂时关闭角色权限验证
  // @Roles('ADMIN', 'TEACHER')
  async deleteProject(
    @Param('id') id: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID (管理员用户)
    const defaultUserId = 'user-admin-001';
    const result = await this.projectService.deleteProject(id, currentUserId || defaultUserId);
    return {
      code: 200,
      message: '项目删除成功',
      data: result,
    };
  }

  /**
   * 创建项目阶段
   */
  @Post(':id/stages')
  // @UseGuards(RolesGuard)  // 暂时关闭角色权限验证
  // @Roles('ADMIN', 'TEACHER')
  async createStage(
    @Param('id') projectId: string,
    @Body() createDto: CreateStageDto,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    // 临时使用默认用户ID (管理员用户)
    const defaultUserId = 'user-admin-001';
    const stage = await this.projectService.createStage(projectId, createDto, currentUserId || defaultUserId);
    return {
      code: 201,
      message: '阶段创建成功',
      data: stage,
    };
  }

  /**
   * 获取项目阶段列表
   */
  @Get(':id/stages')
  async getProjectStages(@Param('id') projectId: string) {
    const stages = await this.projectService.getProjectStages(projectId);
    return {
      code: 200,
      message: '获取项目阶段成功',
      data: stages,
    };
  }

  /**
   * 获取项目参与者列表
   */
  @Get(':id/participants')
  async getProjectParticipants(@Param('id') projectId: string) {
    const participants = await this.projectService.getProjectParticipants(projectId);
    return {
      code: 200,
      message: '获取项目参与者成功',
      data: participants,
    };
  }

  /**
   * 添加项目参与者
   */
  @Post(':id/participants')
  async addProjectParticipant(
    @Param('id') projectId: string,
    @Body() data: {
      userId: string;
      role: 'OWNER' | 'TEACHER' | 'COUNSELOR' | 'STUDENT' | 'OBSERVER';
      notes?: string;
    },
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const defaultUserId = await this.getOrCreateDefaultUser();
      const participant = await this.projectService.addProjectParticipant(
        projectId, 
        data, 
        currentUserId || defaultUserId
      );
      return {
        code: 201,
        message: '参与者添加成功',
        data: participant,
      };
    } catch (error) {
      console.error('❌ 添加参与者失败:', error);
      return {
        code: 500,
        message: `添加参与者失败: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * 移除项目参与者
   */
  @Delete(':id/participants/:userId')
  async removeProjectParticipant(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const defaultUserId = await this.getOrCreateDefaultUser();
      await this.projectService.removeProjectParticipant(
        projectId, 
        userId, 
        currentUserId || defaultUserId
      );
      return {
        code: 200,
        message: '参与者移除成功',
        data: null,
      };
    } catch (error) {
      console.error('❌ 移除参与者失败:', error);
      return {
        code: 500,
        message: `移除参与者失败: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * 更新项目参与者信息
   */
  @Put(':id/participants/:userId')
  async updateProjectParticipant(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Body() data: {
      role?: 'OWNER' | 'TEACHER' | 'COUNSELOR' | 'STUDENT' | 'OBSERVER';
      status?: 'active' | 'inactive' | 'completed' | 'dropped';
      notes?: string;
    },
    @GetCurrentUserId() currentUserId?: string,
  ) {
    try {
      const defaultUserId = await this.getOrCreateDefaultUser();
      const participant = await this.projectService.updateProjectParticipant(
        projectId, 
        userId, 
        data, 
        currentUserId || defaultUserId
      );
      return {
        code: 200,
        message: '参与者更新成功',
        data: participant,
      };
    } catch (error) {
      console.error('❌ 更新参与者失败:', error);
      return {
        code: 500,
        message: `更新参与者失败: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * 获取项目任务列表
   * GET /api/projects/:id/tasks
   */
  @Get(':id/tasks')
  async getProjectTasks(@Param('id') projectId: string) {
    try {
      console.log('🔍 获取项目任务列表 - 项目ID:', projectId);
      
      const tasks = await this.prisma.trainingTask.findMany({
        where: { projectId: projectId },
        include: {
          stage: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: [
          { stage: { orderIndex: 'asc' } },
          { orderIndex: 'asc' },
        ],
      });

      console.log('✅ 项目任务列表获取成功，任务数量:', tasks.length);
      
      return {
        code: 200,
        data: tasks,
        message: '获取项目任务列表成功',
      };
    } catch (error) {
      console.error('❌ 获取项目任务列表失败:', error);
      return {
        code: 500,
        message: `获取项目任务列表失败: ${error.message}`,
        data: [],
      };
    }
  }

  /**
   * 获取有协同任务的项目列表
   */
  @Get('with-cooperation-tasks')
  async getProjectsWithCooperationTasks() {
    try {
      // 查询所有包含协同任务的项目
      const projectsWithCooperation = await this.prisma.trainingProject.findMany({
        where: {
          stages: {
            some: {
              tasks: {
                some: {
                  type: 'cooperation'
                }
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          status: true,
          _count: {
            select: {
              stages: {
                where: {
                  tasks: {
                    some: {
                      type: 'cooperation'
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return {
        success: true,
        data: projectsWithCooperation,
        message: `获取到 ${projectsWithCooperation.length} 个有协同任务的项目`
      };
    } catch (error) {
      console.error('❌ 获取有协同任务的项目失败:', error);
      throw new HttpException('获取项目列表失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 