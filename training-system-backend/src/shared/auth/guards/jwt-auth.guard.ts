import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: any) {
    // 如果有错误或没有用户信息，抛出未授权异常
    if (err || !user) {
      throw new UnauthorizedException(
        err?.message || info?.message || '认证失败，请登录'
      );
    }
    return user;
  }
} 