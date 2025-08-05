# 培训系统后端

基于积木式架构设计的培训管理系统后端 API 服务。

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0
- **Redis**: >= 6.0 (可选，用于缓存)

### 1. 安装依赖

```bash
cd training-system-backend
npm install
```

### 2. 环境配置

#### 方式一：使用本地MySQL（推荐）

确保本地MySQL服务正在运行，然后创建 `.env` 文件：

```bash
# 复制示例配置文件
cp config/development.env .env
```

或直接创建 `.env` 文件，内容如下：

```env
# 培训系统后端环境配置
NODE_ENV=development
PORT=3000

# 数据库配置 - 使用本地MySQL
DATABASE_URL="mysql://root:你的密码@localhost:3306/training_system"

# JWT认证配置
JWT_SECRET=training-system-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=7d

# Redis缓存配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS配置
CORS_ORIGIN=http://localhost:5173

# API配置
API_PREFIX=/api
```

#### 方式二：使用Docker

如果需要使用Docker启动数据库：

```bash
# 启动Docker容器（注意：如果本地3306端口被占用，请修改端口映射）
docker-compose up -d database redis

# 等待数据库启动完成后再启动应用
npm run start:dev
```

### 3. 数据库设置

#### 创建数据库

```sql
CREATE DATABASE training_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 运行数据库迁移

```bash
npx prisma generate
npx prisma db push
```

#### 初始化种子数据

```bash
npm run db:seed
```

### 4. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

服务启动后访问：
- API 服务：http://localhost:3000
- 健康检查：http://localhost:3000/api/health

## 🏗️ 项目结构

```
src/
├── modules/                          # 业务模块
│   ├── project-management/           # 项目管理模块
│   ├── user/                        # 用户管理模块
│   └── workbench/                   # 工作台模块
├── shared/                          # 共享模块
│   ├── auth/                        # 认证模块
│   └── infrastructure/              # 基础设施
│       └── database/                # 数据库配置
├── app.module.ts                    # 应用主模块
├── app.controller.ts                # 应用主控制器
├── app.service.ts                   # 应用主服务
└── main.ts                         # 应用入口
```

## 📊 数据库设计

本项目采用 Prisma ORM，数据库包含以下核心表：

### 核心表结构

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户表 | id, username, email, name, department |
| `user_roles` | 用户角色表 | userId, roleName, projectId |
| `training_projects` | 培训项目表 | id, projectNo, name, status, currentStage |
| `training_stages` | 培训阶段表 | id, projectId, name, type, status |
| `training_tasks` | 培训任务表 | id, projectId, stageId, name, type, status |
| `task_submissions` | 任务提交表 | id, taskId, studentId, content, score |
| `project_resources` | 项目资源表 | id, projectId, type, name, status |
| `budget_lines` | 预算明细表 | id, projectId, category, budgetAmount |
| `observation_records` | 观察记录表 | id, projectId, studentId, observerId |

## 🔐 测试账号

种子数据包含以下测试账号：

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123456 | 系统管理员 |
| 教务 | teacher | teacher123456 | 高级培训师 |
| 辅导员 | counselor | counselor123456 | 辅导员老师 |
| 学员 | student1 | student123456 | 张三 |
| 学员 | student2 | student123456 | 李四 |
| 学员 | student3 | student123456 | 王五 |

## 🛠️ 开发指南

### 代码规范

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint

# 运行测试
npm run test
```

### 数据库操作

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送 schema 到数据库
npm run db:push

# 运行迁移
npm run db:migrate

# 重新初始化种子数据
npm run db:seed
```

### API 接口

#### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/profile` - 获取用户信息

#### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

#### 阶段管理
- `GET /api/projects/:id/stages` - 获取项目阶段
- `POST /api/projects/:id/stages` - 创建阶段
- `PUT /api/stages/:id` - 更新阶段
- `POST /api/stages/:id/complete` - 完成阶段

#### 任务管理
- `GET /api/tasks/review` - 获取待审核任务
- `POST /api/tasks/:taskId/submissions/:userId/score` - 提交评分

#### 工作台
- `GET /api/workbench/admin/dashboard` - 教务工作台
- `GET /api/workbench/counselor/dashboard` - 辅导员工作台

## 🔄 与前端集成

### API 契约
本后端严格按照前端 API 契约设计：
- 位置：`training-system-frontend/src/api/modules/`
- 类型定义：`training-system-frontend/src/types/`

### 开发流程
1. 前端定义 API 契约和类型
2. 后端按契约实现业务逻辑
3. 前端切换 `mockMode` 从 `true` 到 `false`
4. 验证前后端数据流转

## 📈 性能优化

### 数据库优化
- 已添加必要索引
- 使用连接池
- JSON 字段存储配置数据

### 缓存策略
- Redis 缓存热点数据
- 查询结果缓存
- 会话存储

### 安全措施
- JWT 认证
- 密码加密
- 输入验证
- 权限控制

## 🚀 部署

### 开发环境
```bash
npm run start:dev
```

### 生产环境
```bash
npm run build
npm run start:prod
```

### Docker 部署
```bash
# 构建镜像
docker build -t training-system-backend .

# 运行容器
docker run -p 3000:3000 training-system-backend
```

## 📝 更新日志

### v1.0.0 (2024-12-29)
- ✅ 完成项目架构搭建
- ✅ 完成数据库设计和迁移
- ✅ 完成用户认证系统
- ✅ 完成项目管理核心 API
- ✅ 完成任务管理 API
- ✅ 前后端 API 集成测试

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送分支
5. 创建 Pull Request

## �� 许可证

MIT License 