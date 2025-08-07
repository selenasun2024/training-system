# 演寂书院培训管理系统

基于积木式架构设计的现代化培训管理系统，支持培训项目全生命周期管理、人才发展跟踪、知识分享和职业培训等功能。

## 🎯 项目概述

本项目是一个完整的培训管理系统，采用前后端分离架构，支持培训项目的全生命周期管理。系统基于"积木式"模块化设计理念，各功能模块可独立运行和配置，满足不同培训场景的个性化需求。目前前后端打通部分仅为项目管理/工作台。

### 核心特色

- **积木式架构**：模块化设计，支持按需启用和灵活配置
- **全生命周期管理**：从培训规划到项目收尾的完整流程
- **多角色支持**：教务、学员、辅导员、讲师等不同角色
- **数据驱动**：完整的成长档案和人才发展跟踪
- **系统集成**：与企业微信、人事系统等外部系统无缝集成

## 🏗️ 技术架构

### 前端技术栈

- **框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **UI组件库**：Element Plus
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **图表**：ECharts + Chart.js
- **日历**：FullCalendar
- **样式**：Sass

### 后端技术栈

- **框架**：NestJS + TypeScript
- **数据库**：MySQL 8.0 + Prisma ORM
- **缓存**：Redis
- **认证**：JWT + Passport
- **API文档**：Swagger
- **测试**：Jest
- **部署**：Docker

## 📁 项目结构

```
training-system/
├── training-system-frontend/          # 前端项目
│   ├── src/
│   │   ├── modules/                   # 业务模块
│   │   │   ├── dashboard/             # 仪表板模块
│   │   │   ├── project-management/    # 项目管理模块
│   │   │   ├── growth-development/    # 成长发展模块
│   │   │   ├── assessment-center/     # 评估中心模块
│   │   │   ├── knowledge-sharing/     # 知识分享模块
│   │   │   ├── personal-center/       # 个人中心模块
│   │   │   ├── workbench/             # 工作台模块
│   │   │   ├── system-configuration/  # 系统配置模块
│   │   │   └── integration/           # 系统集成模块
│   │   ├── components/                # 通用组件
│   │   ├── api/                       # API接口
│   │   ├── stores/                    # 状态管理
│   │   ├── router/                    # 路由配置
│   │   └── utils/                     # 工具函数
│   └── package.json
├── training-system-backend/           # 后端项目
│   ├── src/
│   │   ├── modules/                   # 业务模块
│   │   │   ├── project-management/    # 项目管理模块
│   │   │   ├── user/                  # 用户管理模块
│   │   │   ├── mentorship/            # 带教管理模块
│   │   │   ├── growth-development/    # 成长发展模块
│   │   │   ├── workbench/             # 工作台模块
│   │   │   ├── observation/           # 观察记录模块
│   │   │   ├── recommendation/        # 推荐管理模块
│   │   │   └── collaboration/         # 协同作业模块
│   │   ├── shared/                    # 共享模块
│   │   │   ├── auth/                  # 认证授权
│   │   │   └── infrastructure/        # 基础设施
│   │   └── app.module.ts
│   ├── prisma/                        # 数据库模型
│   │   └── schema.prisma              # 数据库Schema
│   └── package.json
├── 项目管理开发文档/                   # 项目管理相关文档
├── 带教管理开发文档/                   # 带教管理相关文档
├── 需求整理/                          # 需求文档
└── doc/                              # 其他文档
```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0
- **Redis**: >= 6.0 (可选，用于缓存)

### 1. 克隆项目

```bash
git clone <repository-url>
cd training-system
```

### 2. 后端设置

```bash
cd training-system-backend

# 安装依赖
npm install

# 环境配置
cp config/development.env .env
# 编辑 .env 文件，配置数据库连接等信息

# 数据库设置
npx prisma generate
npx prisma db push

# 初始化种子数据
npm run db:seed

# 启动开发服务器
npm run start:dev
```

### 3. 前端设置

```bash
cd training-system-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 4. 访问系统

- **前端应用**：http://localhost:5173
- **后端API**：http://localhost:3000
- **API文档**：http://localhost:3000/api/docs

## 👥 测试账号

系统预置了以下测试账号：
 【尚在测试阶段，未启用，可直接访问。】

## 📊 功能模块

### 1. 项目管理模块

**核心功能**：
- 项目创建与配置【前后端】
- 阶段和任务管理【前后端】
- 预算和资源管理【前后端】
- 项目模板库
- 审批流程管理

**技术实现**：
- 前端：Vue 3 + Element Plus
- 后端：NestJS + Prisma
- 数据库：37个核心表，2000+行Schema

### 2. 带教管理模块

**核心功能**：
- 带教关系管理【前后端】
- 带教计划制定【前后端】
- 带教任务分配【前后端】
- 带教评估反馈
- 带教资源管理

**技术实现**：
- 完整的前后端API对接
- 数据库持久化存储
- 实时状态更新

### 3. 成长发展模块【仅前端】

**核心功能**：
- 个人成长档案
- 技能树管理
- 成长目标设定
- 成长伙伴机制
- 成长时间线

**技术实现**：
- 完整的成长数据模型
- 可视化成长路径
- 社交化学习支持

### 4. 工作台模块

**核心功能**：
- 多角色工作台
- 数据仪表板
- 待办事项管理
- 项目概览
- 快速操作入口

**技术实现**：
- 角色化界面设计
- 实时数据聚合
- 个性化配置

### 5. 评估中心模块

**核心功能**：
- 观察记录管理【前后端】
- 任务评分系统
- 人才推荐机制【前后端】
- 评估报告生成
- 数据统计分析

**技术实现**：
- 多维度评估体系
- 自动化推荐算法
- 可视化报告

## 🔧 开发指南

### 代码规范

```bash
# 后端代码格式化
cd training-system-backend
npm run format
npm run lint

# 前端代码格式化
cd training-system-frontend
npm run lint
```

### 数据库操作

```bash
# 生成Prisma客户端
npx prisma generate

# 推送Schema到数据库
npx prisma db push

# 运行数据库迁移
npx prisma migrate dev

# 查看数据库
npx prisma studio
```

### API开发流程

1. **前端定义契约**：在 `training-system-frontend/src/api/modules/` 定义API接口
2. **后端实现逻辑**：在 `training-system-backend/src/modules/` 实现业务逻辑
3. **类型同步**：确保前后端类型定义一致
4. **测试验证**：使用预置的测试脚本验证功能

## 🚀 部署指南

### 开发环境

```bash
# 后端
cd training-system-backend
npm run start:dev

# 前端
cd training-system-frontend
npm run dev
```

### 生产环境

```bash
# 后端构建
cd training-system-backend
npm run build
npm run start:prod

# 前端构建
cd training-system-frontend
npm run build
```

### Docker部署

```bash
# 使用Docker Compose
docker-compose up -d

# 或分别构建
docker build -t training-system-backend ./training-system-backend
docker build -t training-system-frontend ./training-system-frontend
```

## 📈 项目特色

### 1. 积木式架构设计

- **模块化**：各功能模块独立开发、测试、部署
- **可配置**：支持按需启用功能模块
- **可扩展**：新功能模块可无缝集成

### 2. 完整的业务闭环

- **培训前**：计划制定、对象确定、分组通知
- **培训中**：任务执行、过程管理、数据记录
- **培训后**：评估总结、成果转化、项目收尾

### 3. 数据驱动的人才发展

- **成长档案**：完整的个人成长轨迹记录
- **技能追踪**：可视化的技能发展路径
- **推荐机制**：基于数据的智能人才推荐

### 4. 系统集成能力

- **企业微信**：消息推送、日程同步
- **人事系统**：员工信息、培训记录
- **待办事项**：任务提醒、流程跟踪

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交变更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 更新日志

### v1.0.0 (2024-12-29)
- ✅ 完成项目架构搭建
- ✅ 完成数据库设计和迁移
- ✅ 完成项目管理核心功能
- ✅ 完成带教管理模块核心功能
- ✅ 前后端完整集成测试

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目文档：查看 `doc/` 目录下的详细文档
- 技术问题：查看各模块的README文件
- 业务问题：查看需求整理文档

---

**演寂书院培训管理系统** - 让培训管理更简单、更高效、更智能！ 
