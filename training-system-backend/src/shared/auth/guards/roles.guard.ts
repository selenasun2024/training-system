import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CurrentUser } from '../decorators/current-user.decorator';

export const ROLES_KEY = 'roles';

// 角色装饰器
export const Roles = (...roles: string[]) => {
  const { SetMetadata } = require('@nestjs/common');
  return SetMetadata(ROLES_KEY, roles);
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有指定角色要求，允许访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    // 严格验证：必须有用户信息和角色
    if (!user || !user.roles) {
      throw new ForbiddenException('未找到用户身份信息，请重新登录');
    }

    // 检查用户是否具有所需角色之一
    const userRoleNames = user.roles.map(role => role.name);
    const hasRole = requiredRoles.some(role => userRoleNames.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(`需要以下角色之一: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
} 