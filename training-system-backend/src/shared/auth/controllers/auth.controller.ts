import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService, LoginDto, RegisterDto } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetCurrentUser, GetCurrentUserId, CurrentUser } from '../decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      code: 200,
      message: '登录成功',
      data: result,
    };
  }

  /**
   * 用户注册
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      code: 201,
      message: '注册成功',
      data: result,
    };
  }

  /**
   * 获取当前用户信息
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@GetCurrentUserId() userId: string) {
    const profile = await this.authService.getUserProfile(userId);
    return {
      code: 200,
      message: '获取用户信息成功',
      data: profile,
    };
  }

  /**
   * 刷新token（验证当前token是否有效）
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@GetCurrentUser() user: CurrentUser) {
    return {
      code: 200,
      message: 'Token有效',
      data: {
        user,
        accessToken: 'current_token_is_valid', // 实际场景可以生成新token
      },
    };
  }

  /**
   * 验证token有效性
   */
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verify(@GetCurrentUser() user: CurrentUser) {
    return {
      code: 200,
      message: 'Token验证成功',
      data: {
        valid: true,
        user,
      },
    };
  }
} 