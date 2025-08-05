# 培训系统数据库初始化脚本

本目录包含培训系统数据库的完整初始化脚本，用于创建所有必要的数据库表和初始数据。

## 📋 文件说明

- `init-database.sql` - 完整的数据库DDL脚本（18个表）
- `setup-database.js` - 自动化数据库设置脚本  
- `package.json` - Node.js依赖配置
- `README.md` - 本说明文档

## 🚀 快速开始

### 1. 前置条件

确保您的系统已安装：
- MySQL 8.0+ 
- Node.js 16+
- npm

### 2. 启动MySQL服务

```bash
# Windows
net start mysql

# macOS/Linux  
sudo systemctl start mysql
# 或
sudo service mysql start
```

### 3. 执行数据库初始化

```bash
# 进入scripts目录
cd training-system-backend/scripts

# 安装依赖
npm install

# 执行数据库初始化
npm run setup
```

## 📊 创建的数据库表

脚本将创建以下18个核心表：

### 👥 用户管理
- `users` - 用户表
- `user_roles` - 用户角色表
- `project_participants` - 项目参与者表

### 📚 项目管理  
- `training_projects` - 培训项目主表
- `training_stages` - 培训阶段表
- `training_tasks` - 培训任务表

### 📝 任务执行
- `task_submissions` - 任务提交表
- `attendance_records` - 考勤记录表

### 📦 资源管理
- `project_resources` - 项目资源表
- `budget_lines` - 预算明细表

### 🗓️ 会议管理
- `meetings` - 会议表
- `agenda_items` - 议程表

### 📈 观察评估
- `observation_records` - 观察记录表
- `growth_profiles` - 成长档案表

### 📋 模板管理
- `stage_templates` - 阶段模板表
- `task_templates` - 任务模板表

### 🔔 通知集成
- `notifications` - 通知表
- `system_integrations` - 系统集成表

## 🔧 配置信息

### 数据库连接信息
```
Host: localhost
Port: 3306
Database: training_system
Username: root
Password: mwclg20241021
```

### 后端环境变量
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=mwclg20241021
DB_DATABASE=training_system
```

## 👤 初始账户

脚本会自动创建以下初始账户：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | (需要重置) | 系统管理员 | 系统管理员账户 |
| teacher | (需要重置) | 教务管理员 | 教务主管账户 |
| counselor | (需要重置) | 辅导员 | 辅导员账户 |

> ⚠️ **安全提醒**: 首次使用时请立即修改所有默认密码！

## 📝 模板数据

脚本还会创建基础模板数据：

### 阶段模板
- 标准培训前阶段
- 标准培训中阶段  
- 标准培训后阶段

### 任务模板
- 面授培训
- 作业提交
- 在线课程
- 小组讨论
- 考试测验

## 🔍 验证安装

成功执行后，您应该看到：

1. ✅ 数据库 `training_system` 创建成功
2. ✅ 18个数据表创建成功
3. ✅ 初始数据插入成功
4. 📊 表统计信息显示
5. 👥 初始用户列表显示

## 🛠️ 故障排除

### 连接失败
- 检查MySQL服务是否运行
- 验证用户名密码是否正确
- 确认MySQL端口(3306)是否开放

### 权限错误
- 确保MySQL用户有CREATE、INSERT、ALTER权限
- 如需要，使用MySQL root用户执行

### 脚本执行失败
- 检查Node.js版本是否满足要求
- 确保npm依赖安装成功
- 查看错误日志定位具体问题

## 🔄 重新初始化

如需重新初始化数据库：

```bash
# 删除现有数据库（谨慎操作！）
mysql -u root -p -e "DROP DATABASE IF EXISTS training_system;"

# 重新执行初始化
npm run setup
```

## 📞 技术支持

如遇到问题，请检查：
1. MySQL服务状态
2. 网络连接
3. 权限配置
4. 错误日志输出

---

**注意**: 本脚本设计用于开发和测试环境，生产环境部署时请根据实际需求调整配置。 