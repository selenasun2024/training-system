import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JwtPayload } from '../strategies/jwt.strategy';

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  name: string;
  department?: string;
  position?: string;
}

export interface AuthResult {
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    department: string | null;
    position: string | null;
    roles: Array<{
      name: string;
      projectId: string | null;
    }>;
  };
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto): Promise<AuthResult> {
    const { username, password } = loginDto;

    // 查找用户
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }, // 支持邮箱登录
        ],
        status: 'ACTIVE',
      },
      include: {
        userRoles: {
          where: {
            status: 'ACTIVE',
            revokedAt: null,
          },
          select: {
            roleName: true,
            projectId: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成JWT token
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        department: user.department,
        position: user.position,
        roles: user.userRoles.map(role => ({
          name: role.roleName,
          projectId: role.projectId,
        })),
      },
      accessToken,
    };
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const { username, email, password, name, department, position } = registerDto;

    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('用户名已存在');
      }
      if (existingUser.email === email) {
        throw new ConflictException('邮箱已被注册');
      }
    }

    // 密码强度验证
    if (password.length < 6) {
      throw new BadRequestException('密码长度不能少于6位');
    }

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        name,
        department,
        position,
        status: 'ACTIVE',
      },
      include: {
        userRoles: {
          where: {
            status: 'ACTIVE',
            revokedAt: null,
          },
          select: {
            roleName: true,
            projectId: true,
          },
        },
      },
    });

    // 生成JWT token
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        department: user.department,
        position: user.position,
        roles: user.userRoles.map(role => ({
          name: role.roleName,
          projectId: role.projectId,
        })),
      },
      accessToken,
    };
  }

  /**
   * 验证用户密码
   */
  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
        status: 'ACTIVE',
      },
    });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * 获取用户信息
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      ...user,
      roles: user.userRoles.map(role => ({
        name: role.roleName,
        projectId: role.projectId,
        projectName: role.project?.name,
      })),
    };
  }
} 