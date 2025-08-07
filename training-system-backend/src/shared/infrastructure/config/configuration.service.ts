import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  url: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface SecurityConfig {
  enableAuth: boolean;
  corsOrigin: string[];
  rateLimitTtl: number;
  rateLimitMax: number;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  security: SecurityConfig;
}

@Injectable()
export class ConfigurationService {
  private readonly config: AppConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.buildConfig();
    this.validateConfig();
  }

  private buildConfig(): AppConfig {
    return {
      port: this.configService.get<number>('PORT') || 3000,
      nodeEnv: this.configService.get<string>('NODE_ENV') || 'development',
      
      database: {
        host: this.configService.get<string>('DB_HOST') || 'localhost',
        port: this.configService.get<number>('DB_PORT') || 3306,
        username: this.configService.get<string>('DB_USERNAME') || 'root',
        password: this.getRequiredConfig('DB_PASSWORD'),
        database: this.configService.get<string>('DB_DATABASE') || 'training_system',
        url: this.getRequiredConfig('DATABASE_URL'),
      },

      jwt: {
        secret: this.getRequiredConfig('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '7d',
      },

      security: {
        enableAuth: this.configService.get<string>('NODE_ENV') !== 'development',
        corsOrigin: this.configService.get<string>('CORS_ORIGIN')?.split(',') || ['http://localhost:5173'],
        rateLimitTtl: this.configService.get<number>('RATE_LIMIT_TTL') || 60000,
        rateLimitMax: this.configService.get<number>('RATE_LIMIT_MAX') || 100,
      },
    };
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`缺少必需的环境变量: ${key}`);
    }
    return value;
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // 验证JWT密钥强度
    if (this.config.jwt.secret.length < 32) {
      errors.push('JWT_SECRET 长度必须至少32个字符');
    }

    // 验证生产环境配置
    if (this.config.nodeEnv === 'production') {
      if (this.config.jwt.secret.includes('change-this') || this.config.jwt.secret.includes('secret')) {
        errors.push('生产环境不能使用默认JWT密钥');
      }
      
      if (this.config.database.password.length < 8) {
        errors.push('生产环境数据库密码长度必须至少8个字符');
      }
    }

    if (errors.length > 0) {
      throw new Error(`配置验证失败: ${errors.join(', ')}`);
    }
  }

  // Getter 方法
  get port(): number {
    return this.config.port;
  }

  get nodeEnv(): string {
    return this.config.nodeEnv;
  }

  get isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  get database(): DatabaseConfig {
    return this.config.database;
  }

  get jwt(): JwtConfig {
    return this.config.jwt;
  }

  get security(): SecurityConfig {
    return this.config.security;
  }

  // 获取完整配置
  getConfig(): AppConfig {
    return { ...this.config };
  }

  // 安全获取配置（隐藏敏感信息）
  getSafeConfig(): Partial<AppConfig> {
    return {
      port: this.config.port,
      nodeEnv: this.config.nodeEnv,
      database: {
        host: this.config.database.host,
        port: this.config.database.port,
        database: this.config.database.database,
        username: this.config.database.username,
        password: '***',
        url: this.config.database.url.replace(/:\/\/.*:.*@/, '://***:***@'),
      },
      jwt: {
        secret: '***',
        expiresIn: this.config.jwt.expiresIn,
      },
      security: this.config.security,
    };
  }
}
