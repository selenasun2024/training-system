-- 插入基础测试数据
USE training_system;

-- 插入测试用户
INSERT INTO users (id, username, email, password_hash, name, department, position, status, updated_at) 
VALUES 
('550e8400-e29b-41d4-a716-446655440002', 'teacher', 'teacher@company.com', '$2a$10$cdnQFlcRhBVXe8FUS50ySuY0pj44AelGdT9r..Ujq4JWvnm77KFPa', '教务管理员', '培训部', '教务主管', 'ACTIVE', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'counselor', 'counselor@company.com', '$2a$10$2P9m6njydKsMqb9BW/7liOnLK1n5j3/AY/iTRY/M9K9OlpJcE8Czu', '辅导员', '培训部', '辅导员', 'ACTIVE', NOW());

-- 插入用户角色
INSERT INTO user_roles (id, user_id, role_name, granted_by, status) 
VALUES 
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'admin', '550e8400-e29b-41d4-a716-446655440001', 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'teacher', '550e8400-e29b-41d4-a716-446655440001', 'ACTIVE'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 'counselor', '550e8400-e29b-41d4-a716-446655440001', 'ACTIVE');

-- 插入阶段模板
INSERT INTO stage_templates (id, name, type, description, is_system, created_by, updated_at)
VALUES 
('550e8400-e29b-41d4-a716-446655440021', '培训前准备', 'before', '包含计划制定、资源准备、人员确认等标准任务', TRUE, '550e8400-e29b-41d4-a716-446655440001', NOW()),
('550e8400-e29b-41d4-a716-446655440022', '培训实施', 'during', '包含面授、作业、考勤等标准任务', TRUE, '550e8400-e29b-41d4-a716-446655440001', NOW()),
('550e8400-e29b-41d4-a716-446655440023', '培训后总结', 'after', '包含总结、评估、归档等标准任务', TRUE, '550e8400-e29b-41d4-a716-446655440001', NOW());

-- 插入任务模板
INSERT INTO task_templates (id, name, type, description, config, required, estimated_hours, category, is_system, created_by)
VALUES 
('550e8400-e29b-41d4-a716-446655440031', '面授培训', 'face-to-face', '课堂面授培训', '{"hasAttendance": true, "allowLate": false}', TRUE, 8, '面授教学', TRUE, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440032', '作业提交', 'homework', '学员作业提交和评分', '{"allowResubmit": true, "maxScore": 100}', TRUE, 4, '作业管理', TRUE, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440033', '在线课程', 'online-course', '在线学习课程', '{"trackProgress": true, "minDuration": 60}', FALSE, 2, '在线学习', TRUE, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440034', '小组讨论', 'discussion', '小组讨论活动', '{"minParticipants": 3, "duration": 90}', FALSE, 2, '互动讨论', TRUE, '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440035', '考试测验', 'exam', '培训考试测验', '{"timeLimit": 120, "passScore": 80}', TRUE, 2, '考试评估', TRUE, '550e8400-e29b-41d4-a716-446655440001');

-- 插入系统集成配置
INSERT INTO system_integrations (id, type, name, config, status)
VALUES 
('550e8400-e29b-41d4-a716-446655440041', 'hr', '人事系统集成', '{"endpoint": "", "token": "", "syncInterval": 3600}', 'inactive'),
('550e8400-e29b-41d4-a716-446655440042', 'wechat', '企业微信集成', '{"corpId": "", "corpSecret": "", "agentId": ""}', 'inactive'),
('550e8400-e29b-41d4-a716-446655440043', 'email', '邮件通知集成', '{"smtpHost": "", "smtpPort": 587, "username": "", "password": ""}', 'inactive'); 