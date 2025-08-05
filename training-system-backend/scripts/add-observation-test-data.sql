-- 添加观察功能测试数据
-- 用于测试辅导员工作台的观察功能

USE training_system;

-- 1. 添加用户数据（如果不存在）
INSERT IGNORE INTO users (id, username, password, email, name, phone, status, created_at, updated_at) VALUES
-- 辅导员
('counselor-001', 'counselor001', '$2b$10$example.hash.here', 'counselor001@example.com', '李辅导员', '13800001001', 'ACTIVE', NOW(), NOW()),
('counselor-002', 'counselor002', '$2b$10$example.hash.here', 'counselor002@example.com', '张辅导员', '13800001002', 'ACTIVE', NOW(), NOW()),

-- 学员
('student-001', 'student001', '$2b$10$example.hash.here', 'student001@example.com', '王小明', '13800002001', 'ACTIVE', NOW(), NOW()),
('student-002', 'student002', '$2b$10$example.hash.here', 'student002@example.com', '李小红', '13800002002', 'ACTIVE', NOW(), NOW()),
('student-003', 'student003', '$2b$10$example.hash.here', 'student003@example.com', '张小强', '13800002003', 'ACTIVE', NOW(), NOW()),
('student-004', 'student004', '$2b$10$example.hash.here', 'student004@example.com', '赵小美', '13800002004', 'ACTIVE', NOW(), NOW()),

-- 管理员（如果需要）
('admin-001', 'admin001', '$2b$10$example.hash.here', 'admin001@example.com', '教务管理员', '13800003001', 'ACTIVE', NOW(), NOW());

-- 2. 添加项目类型（如果不存在）
INSERT IGNORE INTO project_types (id, name, description, duration_weeks, status, created_at, updated_at) VALUES
('type-leadership', '领导力培训', '针对管理层的领导力提升培训', 8, 'ACTIVE', NOW(), NOW()),
('type-skills', '技能培训', '专业技能提升培训', 4, 'ACTIVE', NOW(), NOW());

-- 3. 添加培训项目
INSERT IGNORE INTO training_projects (id, name, description, project_type_id, manager_id, status, start_date, end_date, created_at, updated_at) VALUES
('project-001', '2024年领导力提升培训第一期', '面向中层管理人员的领导力提升培训项目', 'type-leadership', 'admin-001', 'IN_PROGRESS', '2024-01-15', '2024-03-15', NOW(), NOW()),
('project-002', '2024年新员工技能培训', '新入职员工的基础技能培训项目', 'type-skills', 'admin-001', 'IN_PROGRESS', '2024-02-01', '2024-03-01', NOW(), NOW());

-- 4. 添加项目参与者关系
INSERT IGNORE INTO project_participants (id, project_id, user_id, role, status, joined_at, notes) VALUES
-- 项目1的参与者
('pp-001', 'project-001', 'counselor-001', 'COUNSELOR', 'ACTIVE', NOW(), '负责A组学员'),
('pp-002', 'project-001', 'student-001', 'STUDENT', 'ACTIVE', NOW(), 'A组学员'),
('pp-003', 'project-001', 'student-002', 'STUDENT', 'ACTIVE', NOW(), 'A组学员'),

-- 项目2的参与者  
('pp-004', 'project-002', 'counselor-002', 'COUNSELOR', 'ACTIVE', NOW(), '负责B组学员'),
('pp-005', 'project-002', 'student-003', 'STUDENT', 'ACTIVE', NOW(), 'B组学员'),
('pp-006', 'project-002', 'student-004', 'STUDENT', 'ACTIVE', NOW(), 'B组学员'),

-- 让counselor-001也能看到项目2的学员
('pp-007', 'project-002', 'counselor-001', 'COUNSELOR', 'ACTIVE', NOW(), '协助指导');

-- 5. 添加一些示例观察记录
INSERT IGNORE INTO observation_records (id, project_id, student_id, observer_id, type, title, content, attachments, tags, score, visibility, created_at, updated_at) VALUES
('obs-001', 'project-001', 'student-001', 'counselor-001', 'DAILY', '王小明日常观察', '今日表现积极主动，参与讨论活跃', '[]', '["highlight", "积极"]', 8, 'TEACHER', NOW(), NOW()),
('obs-002', 'project-001', 'student-002', 'counselor-001', 'WEEKLY', '李小红周度观察', '本周学习态度认真，但时间管理需要改进', '[]', '["improve", "时间管理"]', 6, 'TEACHER', NOW(), NOW()),
('obs-003', 'project-002', 'student-003', 'counselor-002', 'DAILY', '张小强日常观察', '沟通能力强，善于团队协作', '[]', '["highlight", "团队协作"]', 9, 'TEACHER', NOW(), NOW());

-- 6. 添加用户角色（如果有角色表）
-- 这部分根据实际的角色管理系统来调整
-- INSERT IGNORE INTO user_roles ...

SELECT 'Test data inserted successfully!' as message;

-- 验证数据
SELECT '=== 项目信息 ===' as info;
SELECT id, name, status, manager_id FROM training_projects;

SELECT '=== 项目参与者 ===' as info;
SELECT pp.project_id, tp.name as project_name, u.name as user_name, pp.role 
FROM project_participants pp
JOIN training_projects tp ON pp.project_id = tp.id
JOIN users u ON pp.user_id = u.id
ORDER BY pp.project_id, pp.role;

SELECT '=== 观察记录 ===' as info;
SELECT or1.id, tp.name as project_name, s.name as student_name, o.name as observer_name, or1.type, or1.title
FROM observation_records or1
JOIN training_projects tp ON or1.project_id = tp.id
JOIN users s ON or1.student_id = s.id
JOIN users o ON or1.observer_id = o.id; 