import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface JwtPayload {
  sub: string;     // 用户ID
  username: string;
  email: string;
  iat?: number;    // 签发时间
  exp?: number;    // 过期时间
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const { sub: userId, username, email } = payload;

    // 验证用户是否存在且状态正常
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
        userRoles: {
          where: { 
            status: 'ACTIVE',
            revokedAt: null 
          },
          select: {
            roleName: true,
            projectId: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('用户状态异常');
    }

    // 验证基本信息是否匹配
    if (user.username !== username || user.email !== email) {
      throw new UnauthorizedException('Token信息不匹配');
    }

    // 返回用户信息，会被注入到请求对象中
    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      department: user.department,
      position: user.position,
      roles: user.userRoles.map(role => ({
        name: role.roleName,
        projectId: role.projectId,
      })),
    };
  }
} 