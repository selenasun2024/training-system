import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';

export interface CreateUserDto {
  username: string;
  email: string;
  name: string;
  department?: string;
  position?: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  department?: string;
  position?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface UserQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户列表
   */
  async getUsers(query: UserQueryDto) {
    const { page = 1, limit = 10, search, department, status } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (status) {
      where.status = status;
    }

    // 获取用户列表和总数
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          department: true,
          position: true,
          status: true,
          createdAt: true,
          userRoles: {
            where: {
              status: 'ACTIVE',
              revokedAt: null,
            },
            select: {
              roleName: true,
              projectId: true,
              project: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => ({
        ...user,
        roles: user.userRoles.map(role => ({
          name: role.roleName,
          projectId: role.projectId,
          projectName: role.project?.name,
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 根据ID获取用户详情
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        department: true,
        position: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          where: {
            status: 'ACTIVE',
            revokedAt: null,
          },
          select: {
            id: true,
            roleName: true,
            projectId: true,
            grantedAt: true,
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
            granter: {
              select: {
                name: true,
              },
            },
          },
        },
        ownedProjects: {
          select: {
            id: true,
            name: true,
            status: true,
            currentStage: true,
          },
        },
        projectParticipants: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            role: true,
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      ...user,
      roles: user.userRoles.map(role => ({
        id: role.id,
        name: role.roleName,
        projectId: role.projectId,
        projectName: role.project?.name,
        projectStatus: role.project?.status,
        grantedAt: role.grantedAt,
        grantedBy: role.granter.name,
      })),
      participatingProjects: user.projectParticipants.map(p => ({
        role: p.role,
        project: p.project,
      })),
    };
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, updateDto: UpdateUserDto) {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('用户不存在');
    }

    // 如果更新邮箱，检查邮箱是否已被使用
    if (updateDto.email && updateDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: updateDto.email,
          id: { not: id },
        },
      });

      if (emailExists) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateDto,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        department: true,
        position: true,
        status: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * 获取所有部门列表
   */
  async getDepartments() {
    const departments = await this.prisma.user.findMany({
      where: {
        department: { not: null },
      },
      select: {
        department: true,
      },
      distinct: ['department'],
    });

    return departments
      .map(d => d.department)
      .filter(Boolean)
      .sort();
  }

  /**
   * 获取所有职级列表
   */
  async getLevels() {
    const levels = await this.prisma.user.findMany({
      select: {
        level: true,
      },
      where: {
        level: {
          not: null,
        },
        status: 'ACTIVE',
      },
      distinct: ['level'],
    });

    return levels
      .map(item => item.level)
      .filter(Boolean)
      .sort();
  }

  /**
   * 搜索用户（用于选择器组件）
   */
  async searchUsers(query: {
    keyword?: string;
    department?: string;
    level?: string;
    role?: string;  // 添加角色筛选参数
    excludeIds?: string[];
    limit?: number;
  }) {
    const { keyword, department, level, role, excludeIds, limit = 50 } = query;
    
    const where: any = {
      status: 'ACTIVE',
    };

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { name: { contains: keyword } },
        { email: { contains: keyword } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (level) {
      where.level = level;
    }

    // 添加角色筛选逻辑 - 通过关联的UserRole表查询
    if (role) {
      where.userRoles = {
        some: {
          roleName: role, // 直接使用role，因为RoleName枚举值是小写的
          status: 'ACTIVE',
          revokedAt: null,
        },
      };
    }

    if (excludeIds && excludeIds.length > 0) {
      where.id = {
        notIn: excludeIds,
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        department: true,
        position: true,
        level: true,
        hireDate: true,
        status: true,
        createdAt: true,
        userRoles: {
          where: {
            status: 'ACTIVE',
            revokedAt: null,
          },
          select: {
            roleName: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    // 为每个用户添加角色信息
    return users.map(user => ({
      ...user,
      roles: user.userRoles.map(ur => ur.roleName),
    }));
  }

  /**
   * 为用户分配角色
   */
  async assignRole(userId: string, roleName: string, projectId: string | null, grantedBy: string) {
    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查是否已有相同角色
    const existingRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleName: roleName as any,
        projectId,
        status: 'ACTIVE',
        revokedAt: null,
      },
    });

    if (existingRole) {
      throw new ConflictException('用户已具有该角色');
    }

    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleName: roleName as any,
        projectId,
        grantedBy,
        status: 'ACTIVE',
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        granter: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: userRole.id,
      roleName: userRole.roleName,
      projectId: userRole.projectId,
      projectName: userRole.project?.name,
      grantedAt: userRole.grantedAt,
      grantedBy: userRole.granter.name,
    };
  }

  /**
   * 撤销用户角色
   */
  async revokeRole(roleId: string) {
    const role = await this.prisma.userRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    await this.prisma.userRole.update({
      where: { id: roleId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    return { message: '角色已撤销' };
  }
} 