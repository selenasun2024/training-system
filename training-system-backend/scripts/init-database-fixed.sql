-- 培训系统数据库初始化脚本（修复版）
-- 包含18个核心表的完整创建语句

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS training_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE training_system;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_department (department)
) COMMENT='用户表';

-- 2. 用户角色表
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role_name ENUM('admin', 'teacher', 'counselor', 'student', 'observer') NOT NULL,
    project_id VARCHAR(36) COMMENT '项目级别角色，NULL表示全局角色',
    granted_by VARCHAR(36) NOT NULL COMMENT '授权人',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL COMMENT '撤销时间',
    status ENUM('active', 'revoked') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id),
    UNIQUE KEY uk_user_role_project (user_id, role_name, project_id),
    INDEX idx_user_role (user_id, role_name),
    INDEX idx_project (project_id)
) COMMENT='用户角色表';

-- 3. 培训项目主表
CREATE TABLE IF NOT EXISTS training_projects (
    id VARCHAR(36) PRIMARY KEY,
    project_no VARCHAR(50) UNIQUE NOT NULL COMMENT '项目编号',
    name VARCHAR(255) NOT NULL COMMENT '项目名称',
    description TEXT COMMENT '项目描述',
    status ENUM('draft', 'planning', 'approved', 'active', 'completed', 'cancelled') DEFAULT 'draft',
    current_stage ENUM('before', 'during', 'after') DEFAULT 'before',
    owner_id VARCHAR(36) NOT NULL COMMENT '项目负责人',
    config JSON DEFAULT ('{}') COMMENT '项目配置',
    estimated_duration INTEGER COMMENT '预计时长（小时）',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_owner (owner_id),
    INDEX idx_stage (current_stage)
) COMMENT='培训项目主表';

-- 4. 培训阶段表
CREATE TABLE IF NOT EXISTS training_stages (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL COMMENT '阶段名称',
    type ENUM('before', 'during', 'after') NOT NULL COMMENT '阶段类型',
    description TEXT COMMENT '阶段描述',
    order_index INTEGER DEFAULT 0 COMMENT '排序',
    status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending',
    estimated_duration INTEGER COMMENT '预计时长（小时）',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    config JSON DEFAULT ('{}') COMMENT '阶段配置',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES training_projects(id) ON DELETE CASCADE,
    INDEX idx_project_type (project_id, type),
    INDEX idx_status (status)
) COMMENT='培训阶段表';

-- 5. 培训任务表
CREATE TABLE IF NOT EXISTS training_tasks (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL COMMENT '任务名称',
    description TEXT COMMENT '任务描述',
    type VARCHAR(50) NOT NULL COMMENT '任务类型：face-to-face,homework,online-course,discussion,exam等',
    status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending',
    required BOOLEAN DEFAULT FALSE COMMENT '是否必修',
    order_index INTEGER DEFAULT 0 COMMENT '排序',
    config JSON DEFAULT ('{}') COMMENT '任务配置',
    assigned_to VARCHAR(36) COMMENT '分配给',
    reviewer_role ENUM('counselor', 'teacher', 'admin') COMMENT '审核角色',
    due_date TIMESTAMP COMMENT '截止时间',
    estimated_hours INTEGER COMMENT '预计完成时间（小时）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES training_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES training_stages(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    INDEX idx_project_stage (project_id, stage_id),
    INDEX idx_type_status (type, status),
    INDEX idx_assigned (assigned_to)
) COMMENT='培训任务表';

-- 6. 项目参与者表
CREATE TABLE IF NOT EXISTS project_participants (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('owner', 'teacher', 'counselor', 'student', 'observer') NOT NULL,
    status ENUM('active', 'inactive', 'completed', 'dropped') DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    notes TEXT COMMENT '备注',
    FOREIGN KEY (project_id) REFERENCES training_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_project_user (project_id, user_id),
    INDEX idx_project_role (project_id, role),
    INDEX idx_user (user_id)
) COMMENT='项目参与者表';

-- 7. 学员任务提交表
CREATE TABLE IF NOT EXISTS task_submissions (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL COMMENT '学员ID',
    content TEXT COMMENT '提交内容',
    file_paths JSON DEFAULT ('[]') COMMENT '附件路径',
    score INTEGER COMMENT '得分',
    feedback TEXT COMMENT '反馈',
    status ENUM('draft', 'submitted', 'reviewed', 'approved', 'rejected') DEFAULT 'draft',
    submitted_at TIMESTAMP COMMENT '提交时间',
    reviewed_at TIMESTAMP COMMENT '审核时间',
    reviewer_id VARCHAR(36) COMMENT '审核人',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES training_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    UNIQUE KEY uk_task_student (task_id, student_id),
    INDEX idx_status (status),
    INDEX idx_student (student_id)
) COMMENT='学员任务提交表';

-- 8. 考勤记录表
CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL COMMENT '关联任务',
    student_id VARCHAR(36) NOT NULL COMMENT '学员ID',
    type ENUM('check-in', 'check-out') NOT NULL COMMENT '签到类型',
    method ENUM('qr-code', 'location', 'face', 'manual') NOT NULL COMMENT '签到方式',
    location JSON COMMENT '签到位置信息',
    device_info JSON COMMENT '设备信息',
    check_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '签到时间',
    status ENUM('present', 'late', 'absent', 'leave') DEFAULT 'present',
    notes TEXT COMMENT '备注',
    created_by VARCHAR(36) COMMENT '创建人（手动签到时使用）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES training_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_task_student (task_id, student_id),
    INDEX idx_check_time (check_time),
    INDEX idx_status (status)
) COMMENT='考勤记录表';

-- 9. 项目资源表
CREATE TABLE IF NOT EXISTS project_resources (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    type ENUM('digital', 'service', 'supply') NOT NULL COMMENT '资源类型',
    name VARCHAR(255) NOT NULL COMMENT '资源名称',
    spec VARCHAR(500) COMMENT '规格说明',
    quantity VARCHAR(50) COMMENT '数量',
    unit VARCHAR(20) COMMENT '单位',
    agenda_item VARCHAR(255) COMMENT '关联议程项',
    budget_amount BIGINT COMMENT '预算金额（分）',
    actual_amount BIGINT COMMENT '实际金额（分）',
    status ENUM('pending', 'uploaded', 'requested', 'confirmed', 'ordered', 'stocked', 'distributed', 'cancelled') DEFAULT 'pending',
    work_order_id VARCHAR(100) COMMENT '工单号',
    responsible VARCHAR(100) NOT NULL COMMENT '负责人',
    supplier VARCHAR(255) COMMENT '供应商',
    upload_time TIMESTAMP COMMENT '上传时间',
    url VARCHAR(500) COMMENT '文件URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES training_projects(id) ON DELETE CASCADE,
    INDEX idx_project_type (project_id, type),
    INDEX idx_status (status)
) COMMENT='项目资源表';

-- 10. 预算明细表
CREATE TABLE IF NOT EXISTS budget_lines (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    category VARCHAR(100) NOT NULL COMMENT '费用科目',
    item VARCHAR(255) NOT NULL COMMENT '费用项目',
    resource_id VARCHAR(36) COMMENT '关联资源',
    budget_amount BIGINT NOT NULL COMMENT '预算金额（分）',
    actual_amount BIGINT DEFAULT 0 COMMENT '实际金额（分）',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES training_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES project_resources(id),
    INDEX idx_project (project_id),
    INDEX idx_category (category)
) COMMENT='预算明细表';

-- 11. 会议表
CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(36),
    title VARCHAR(255) NOT NULL COMMENT '会议标题',
    description TEXT COMMENT '会议描述',
    meeting_type VARCHAR(50) COMMENT '会议类型',
    start_time TIMESTAMP NOT NULL COMMENT '开始时间',
    end_time TIMESTAMP NOT NULL COMMENT '结束时间',
    location VARCHAR(255) COMMENT '会议地点',
    online_link VARCHAR(500) COMMENT '在线会议链接',
    external_id VARCHAR(100) COMMENT '外部系统ID',
    status ENUM('draft', 'scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES training_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES training_stages(id),
    INDEX idx_project (project_id),
    INDEX idx_time (start_time, end_time)
) COMMENT='会议表';

-- 12. 议程表
CREATE TABLE IF NOT EXISTS agenda_items (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT '议程类型',
    title VARCHAR(255) NOT NULL COMMENT '议程标题',
    duration INTEGER NOT NULL COMMENT '时长（分钟）',
    speaker VARCHAR(100) COMMENT '演讲者',
    location VARCHAR(255) COMMENT '地点',
    start_time TIME COMMENT '开始时间 HH:mm',
    end_time TIME COMMENT '结束时间 HH:mm',
    fixed BOOLEAN DEFAULT FALSE COMMENT '是否固定',
    order_index INTEGER DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    INDEX idx_meeting (meeting_id)
) COMMENT='议程表';

-- 13. 观察记录表
CREATE TABLE IF NOT EXISTS observation_records (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL COMMENT '被观察学员',
    observer_id VARCHAR(36) NOT NULL COMMENT '观察者',
    type ENUM('daily', 'weekly', 'milestone', 'special') NOT NULL COMMENT '观察类型',
    title VARCHAR(255) NOT NULL COMMENT '观察标题',
    content TEXT NOT NULL COMMENT '观察内容',
    attachments JSON DEFAULT ('[]') COMMENT '附件列表',
    tags JSON DEFAULT ('[]') COMMENT '标签列表',
    score INTEGER COMMENT '评分（1-10）',
    visibility ENUM('private', 'teacher', 'public') DEFAULT 'teacher' COMMENT '可见性',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES training_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (observer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_student (project_id, student_id),
    INDEX idx_observer (observer_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) COMMENT='观察记录表';

-- 14. 成长档案表
CREATE TABLE IF NOT EXISTS growth_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    project_id VARCHAR(36) NOT NULL COMMENT '项目ID',
    skills JSON DEFAULT ('{}') COMMENT '技能评估',
    achievements JSON DEFAULT ('[]') COMMENT '成就记录',
    learning_goals JSON DEFAULT ('[]') COMMENT '学习目标',
    progress JSON DEFAULT ('{}') COMMENT '进度记录',
    feedback JSON DEFAULT ('[]') COMMENT '反馈记录',
    certifications JSON DEFAULT ('[]') COMMENT '认证记录',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES training_projects(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_project (user_id, project_id),
    INDEX idx_user (user_id),
    INDEX idx_project (project_id)
) COMMENT='成长档案表';

-- 15. 阶段模板表
CREATE TABLE IF NOT EXISTS stage_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '模板名称',
    type ENUM('before', 'during', 'after', 'custom') NOT NULL COMMENT '阶段类型',
    description TEXT COMMENT '模板描述',
    config JSON DEFAULT ('{}') COMMENT '阶段配置',
    task_templates JSON DEFAULT ('[]') COMMENT '关联的任务模板ID列表',
    is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统模板',
    created_by VARCHAR(36) NOT NULL COMMENT '创建者',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_type (type),
    INDEX idx_created_by (created_by)
) COMMENT='阶段模板表';

-- 16. 任务模板表
CREATE TABLE IF NOT EXISTS task_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '模板名称',
    type VARCHAR(50) NOT NULL COMMENT '任务类型',
    description TEXT COMMENT '模板描述',
    config JSON DEFAULT ('{}') COMMENT '任务配置',
    required BOOLEAN DEFAULT FALSE COMMENT '是否必修',
    estimated_hours INTEGER COMMENT '预计完成时间',
    category VARCHAR(100) COMMENT '任务分类',
    is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统模板',
    created_by VARCHAR(36) NOT NULL COMMENT '创建者',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_created_by (created_by)
) COMMENT='任务模板表';

-- 17. 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL COMMENT '接收者',
    type ENUM('system', 'project', 'task', 'observation', 'meeting') NOT NULL COMMENT '通知类型',
    title VARCHAR(255) NOT NULL COMMENT '通知标题',
    content TEXT NOT NULL COMMENT '通知内容',
    data JSON COMMENT '附加数据',
    channels JSON DEFAULT ('["system"]') COMMENT '发送渠道：system,email,wechat',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    read_at TIMESTAMP NULL COMMENT '已读时间',
    sent_at TIMESTAMP NULL COMMENT '发送时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, read_at),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) COMMENT='通知表';

-- 18. 系统集成表
CREATE TABLE IF NOT EXISTS system_integrations (
    id VARCHAR(36) PRIMARY KEY,
    type ENUM('hr', 'wechat', 'calendar', 'email', 'sms') NOT NULL COMMENT '集成类型',
    name VARCHAR(255) NOT NULL COMMENT '集成名称',
    config JSON NOT NULL COMMENT '集成配置',
    status ENUM('active', 'inactive', 'error') DEFAULT 'active',
    last_sync TIMESTAMP NULL COMMENT '最后同步时间',
    sync_status ENUM('success', 'failed', 'partial') NULL COMMENT '同步状态',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_last_sync (last_sync)
) COMMENT='系统集成表';

-- 为 user_roles 表添加对 training_projects 的外键约束
ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_project FOREIGN KEY (project_id) REFERENCES training_projects(id) ON DELETE CASCADE;

-- 插入初始数据
INSERT INTO users (id, username, email, password_hash, name, department, position, status) 
VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@company.com', '$2a$10$HbI0d4AvowjOoC0TXQF9ye3D1YQh/ARDb/wOcU3ePmdUOscTBjKvi', '系统管理员', 'IT部', '系统管理员', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'teacher', 'teacher@company.com', '$2a$10$cdnQFlcRhBVXe8FUS50ySuY0pj44AelGdT9r..Ujq4JWvnm77KFPa', '教务管理员', '培训部', '教务主管', 'active'),
('550e8400-e29b-41d4-a716-446655440003', 'counselor', 'counselor@company.com', '$2a$10$2P9m6njydKsMqb9BW/7liOnLK1n5j3/AY/iTRY/M9K9OlpJcE8Czu', '辅导员', '培训部', '辅导员', 'active');

INSERT INTO user_roles (id, user_id, role_name, granted_by) 
VALUES 
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'admin', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'teacher', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 'counselor', '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO stage_templates (id, name, type, description, is_system, created_by)
VALUES 
('550e8400-e29b-41d4-a716-446655440021', '标准培训前阶段', 'before', '包含计划制定、资源准备、人员确认等标准任务', TRUE, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440022', '标准培训中阶段', 'during', '包含面授、作业、考勤等标准任务', TRUE, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440023', '标准培训后阶段', 'after', '包含总结、评估、归档等标准任务', TRUE, '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO task_templates (id, name, type, description, config, required, estimated_hours, category, is_system, created_by)
VALUES 
('550e8400-e29b-41d4-a716-446655440031', '面授培训', 'face-to-face', '课堂面授培训', '{"hasAttendance": true, "allowLate": false}', TRUE, 8, '面授教学', TRUE, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440032', '作业提交', 'homework', '学员作业提交和评分', '{"allowResubmit": true, "maxScore": 100}', TRUE, 4, '作业管理', TRUE, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440033', '在线课程', 'online-course', '在线学习课程', '{"trackProgress": true, "minDuration": 60}', FALSE, 2, '在线学习', TRUE, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440034', '小组讨论', 'discussion', '小组讨论活动', '{"minParticipants": 3, "duration": 90}', FALSE, 2, '互动讨论', TRUE, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440035', '考试测验', 'exam', '培训考试测验', '{"timeLimit": 120, "passScore": 80}', TRUE, 2, '考试评估', TRUE, '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO system_integrations (id, type, name, config, status)
VALUES 
('550e8400-e29b-41d4-a716-446655440041', 'hr', '人事系统集成', '{"endpoint": "", "token": "", "syncInterval": 3600}', 'inactive'),
('550e8400-e29b-41d4-a716-446655440042', 'wechat', '企业微信集成', '{"corpId": "", "corpSecret": "", "agentId": ""}', 'inactive'),
('550e8400-e29b-41d4-a716-446655440043', 'email', '邮件通知集成', '{"smtpHost": "", "smtpPort": 587, "username": "", "password": ""}', 'inactive'); 