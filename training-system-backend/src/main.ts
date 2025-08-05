import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS配置
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // 全局路由前缀
  app.setGlobalPrefix('api');

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 培训系统后端服务已启动：http://localhost:${port}`);
  console.log(`📚 API文档地址：http://localhost:${port}/api`);
}

bootstrap(); 