-- ============================================
-- 添加任务批阅功能测试数据
-- ============================================

-- 1. 首先确保有项目和阶段数据
INSERT IGNORE INTO training_projects (id, name, project_no, description, owner_id, status, current_stage) VALUES
('test-project-001', '干部入模子培训 · 第 1 期', 'P2025001', '针对新提拔干部的培训项目', 'admin', 'ACTIVE', 'STAGE1'),
('test-project-002', '营销基础培训 · 第 2 期', 'P2025002', '营销部门基础技能培训', 'admin', 'ACTIVE', 'STAGE1');

-- 2. 添加培训阶段
INSERT IGNORE INTO training_stages (id, project_id, name, type, description, status, order_index) VALUES
('stage-001', 'test-project-001', '理论学习阶段', 'LEARNING', '学习企业文化和管理理论', 'ACTIVE', 1),
('stage-002', 'test-project-002', '实践操作阶段', 'PRACTICE', '市场分析和销售技能实践', 'ACTIVE', 1);

-- 3. 添加需要辅导员批阅的任务
INSERT IGNORE INTO training_tasks (
    id, 
    project_id, 
    stage_id, 
    name, 
    description, 
    type, 
    status, 
    required, 
    reviewer_role, 
    due_date,
    estimated_hours
) VALUES
-- 项目1的任务
('task-001', 'test-project-001', 'stage-001', '小组讨论：企业文化案例', '分析企业文化案例，总结管理要点', 'homework', 'ACTIVE', true, 'COUNSELOR', '2025-08-01 23:59:59', 4),
('task-002', 'test-project-001', 'stage-001', '作业：市场分析报告', '撰写市场分析报告，包含SWOT分析', 'homework', 'ACTIVE', true, 'COUNSELOR', '2025-08-05 23:59:59', 8),
-- 项目2的任务
('task-003', 'test-project-002', 'stage-002', '课堂测验 1', '营销基础知识测验', 'exam', 'ACTIVE', true, 'COUNSELOR', '2025-08-03 23:59:59', 2),
-- 教师批阅的任务（用于测试不同角色）
('task-004', 'test-project-002', 'stage-002', '期末考试', '综合能力考试', 'exam', 'ACTIVE', true, 'TEACHER', '2025-08-10 23:59:59', 3);

-- 4. 确保有测试用户（学员）
INSERT IGNORE INTO users (id, username, password, name, email, department, position, status) VALUES
('student-001', 'zhangsan', '$2b$10$abc123', '张三', 'zhangsan@company.com', '销售部', '销售代表', 'ACTIVE'),
('student-002', 'lisi', '$2b$10$abc123', '李四', 'lisi@company.com', '销售部', '销售主管', 'ACTIVE'),
('student-003', 'wangwu', '$2b$10$abc123', '王五', 'wangwu@company.com', '市场部', '市场专员', 'ACTIVE');

-- 5. 为学员分配角色
INSERT IGNORE INTO user_roles (id, user_id, role_name, status, granted_at) VALUES
('role-001', 'student-001', 'student', 'ACTIVE', NOW()),
('role-002', 'student-002', 'student', 'ACTIVE', NOW()),
('role-003', 'student-003', 'student', 'ACTIVE', NOW());

-- 6. 添加学员的项目参与记录
INSERT IGNORE INTO project_participants (id, project_id, user_id, role, status, joined_at) VALUES
('pp-001', 'test-project-001', 'student-001', 'STUDENT', 'ACTIVE', NOW()),
('pp-002', 'test-project-001', 'student-002', 'STUDENT', 'ACTIVE', NOW()),
('pp-003', 'test-project-002', 'student-001', 'STUDENT', 'ACTIVE', NOW()),
('pp-004', 'test-project-002', 'student-003', 'STUDENT', 'ACTIVE', NOW());

-- 7. 添加任务提交记录（已提交但未批阅）
INSERT IGNORE INTO task_submissions (
    id,
    task_id,
    student_id,
    content,
    file_paths,
    status,
    submitted_at
) VALUES
-- 任务1的提交
('sub-001', 'task-001', 'student-001', '企业文化分析：通过案例分析，我认为企业文化的核心要素包括价值观、行为准则和管理理念...', '[]', 'SUBMITTED', '2025-07-30 14:30:00'),
('sub-002', 'task-001', 'student-002', '企业文化案例总结：本案例展现了良好的企业文化对员工凝聚力的重要作用...', '[]', 'SUBMITTED', '2025-07-30 16:45:00'),

-- 任务2的提交
('sub-003', 'task-002', 'student-001', '市场分析报告\n\n一、市场环境分析\n当前市场环境...\n\n二、SWOT分析\n优势：...\n劣势：...\n机会：...\n威胁：...', '["uploads/market-analysis-zhangsan.pdf"]', 'SUBMITTED', '2025-08-04 09:15:00'),

-- 任务3的提交
('sub-004', 'task-003', 'student-001', '营销基础测验答案：\n1. 市场细分的原则是...\n2. 4P营销理论包括...\n3. 客户关系管理的要点...', '[]', 'SUBMITTED', '2025-08-02 11:20:00'),
('sub-005', 'task-003', 'student-003', '测验回答：\n1. 市场细分需要考虑地理、人口、心理等因素...\n2. 产品、价格、渠道、推广是营销组合的核心...', '[]', 'SUBMITTED', '2025-08-02 14:30:00'),

-- 一个已经批阅过的提交（用于测试）
('sub-006', 'task-001', 'student-002', '这是一个已经批阅过的提交示例', '[]', 'REVIEWED', '2025-07-29 10:00:00');

-- 8. 为已批阅的提交添加评分
UPDATE task_submissions 
SET score = 85, feedback = '分析深入，思路清晰，建议在实际应用方面多加考虑。', reviewed_at = '2025-07-30 09:00:00'
WHERE id = 'sub-006';

-- 9. 添加一些辅导员权限数据（可选，用于后续扩展）
-- 这里暂时不添加，因为当前是按角色（reviewer_role）进行权限控制

-- ============================================
-- 查询验证数据
-- ============================================

-- 验证任务数据
SELECT 
    t.id,
    t.name,
    t.reviewer_role,
    p.name as project_name,
    COUNT(ts.id) as submission_count,
    COUNT(CASE WHEN ts.status = 'SUBMITTED' THEN 1 END) as pending_count
FROM training_tasks t
LEFT JOIN training_projects p ON t.project_id = p.id
LEFT JOIN task_submissions ts ON t.id = ts.task_id
WHERE t.reviewer_role = 'COUNSELOR'
GROUP BY t.id, t.name, t.reviewer_role, p.name;

-- 验证提交数据
SELECT 
    ts.id,
    t.name as task_name,
    u.name as student_name,
    ts.status,
    ts.score,
    ts.submitted_at,
    ts.reviewed_at
FROM task_submissions ts
JOIN training_tasks t ON ts.task_id = t.id
JOIN users u ON ts.student_id = u.id
ORDER BY ts.submitted_at DESC; 