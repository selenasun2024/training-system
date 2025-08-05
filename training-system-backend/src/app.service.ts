import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '🎓 培训系统后端 API 服务正在运行！';
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: '培训系统后端',
      version: '1.0.0',
    };
  }
} 