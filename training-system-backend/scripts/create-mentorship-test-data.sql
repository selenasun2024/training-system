-- 为测试项目创建师徒关系数据
-- 项目ID: f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79 (无境项目)

-- 师徒关系1: 冯芹(user-hr-001) - 李辅导员(counselor-001)
INSERT INTO mentorship_relationships (
  id, project_id, mentor_id, mentor_name, mentor_type, 
  student_id, student_name, relationship_type, scope,
  matching_type, matching_reasons, matching_criteria,
  established_date, expected_duration, status,
  total_interactions, completed_milestones, total_milestones,
  created_by, created_at, updated_at
) VALUES (
  'rel-test-001', 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79', 
  'counselor-001', '李辅导员', 'COUNSELOR',
  'user-hr-001', '冯芹', 'ONE_TO_ONE', 'PROJECT_FULL',
  'MANUAL', '[]', '{}',
  '2024-01-15', 180, 'ACTIVE',
  5, 2, 8,
  'system', NOW(), NOW()
);

-- 师徒关系2: 张经理(user-sales-001) - 王辅导员(counselor-002)  
INSERT INTO mentorship_relationships (
  id, project_id, mentor_id, mentor_name, mentor_type,
  student_id, student_name, relationship_type, scope,
  matching_type, matching_reasons, matching_criteria,
  established_date, expected_duration, status,
  total_interactions, completed_milestones, total_milestones,
  created_by, created_at, updated_at
) VALUES (
  'rel-test-002', 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79',
  'counselor-002', '王辅导员', 'COUNSELOR', 
  'user-sales-001', '张经理', 'ONE_TO_ONE', 'PROJECT_FULL',
  'MANUAL', '[]', '{}',
  '2024-01-16', 180, 'ACTIVE',
  3, 1, 8,
  'system', NOW(), NOW()
);

-- 师徒关系3: 赵助理(user-admin-002) - 李辅导员(counselor-001)
INSERT INTO mentorship_relationships (
  id, project_id, mentor_id, mentor_name, mentor_type,
  student_id, student_name, relationship_type, scope,
  matching_type, matching_reasons, matching_criteria,
  established_date, expected_duration, status,
  total_interactions, completed_milestones, total_milestones,
  created_by, created_at, updated_at
) VALUES (
  'rel-test-003', 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79',
  'counselor-001', '李辅导员', 'COUNSELOR',
  'user-admin-002', '赵助理', 'ONE_TO_ONE', 'PROJECT_FULL', 
  'MANUAL', '[]', '{}',
  '2024-01-17', 180, 'ACTIVE',
  7, 3, 8,
  'system', NOW(), NOW()
);

-- 为这些师徒关系创建相应的带教任务
INSERT INTO mentorship_tasks (
  id, project_id, phase_id, title, description, task_type, priority,
  estimated_hours, due_date, status, progress,
  requirements, deliverables, resources, evaluation_criteria,
  assigned_to, mentor_responsibilities, student_responsibilities,
  created_by, created_at, updated_at
) VALUES 
-- 冯芹的任务
('mt-001', 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79', NULL, 
 '人事制度学习', '学习公司人事相关制度文件', 'LEARNING', 'MEDIUM',
 20, '2024-02-15', 'IN_PROGRESS', 60,
 '["阅读人事制度手册", "完成在线测试"]', '["学习笔记", "测试成绩"]', 
 '["人事制度手册", "在线培训系统"]', '["理解准确性", "应用能力"]',
 'STUDENT', '提供指导和答疑', '认真学习并完成测试',
 'system', NOW(), NOW()),

-- 张经理的任务  
('mt-002', 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79', NULL,
 '销售技能提升', '提升销售沟通和谈判技能', 'PRACTICE', 'HIGH', 
 30, '2024-02-20', 'PENDING', 0,
 '["参与销售实战", "学习谈判技巧"]', '["销售记录", "客户反馈"]',
 '["销售手册", "谈判技巧视频"]', '["销售成果", "客户满意度"]',
 'STUDENT', '陪同拜访客户，现场指导', '积极参与销售活动',
 'system', NOW(), NOW()),

-- 赵助理的任务
('mt-003', 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79', NULL,
 '行政管理实践', '熟悉行政管理流程和规范', 'ASSESSMENT', 'MEDIUM',
 25, '2024-02-25', 'COMPLETED', 100, 
 '["学习行政流程", "处理实际事务"]', '["流程图", "工作总结"]',
 '["行政管理手册", "流程模板"]', '["流程掌握度", "执行效率"]',
 'STUDENT', '检查工作质量，提供改进建议', '按时完成行政事务',
 'system', NOW(), NOW());

-- 确保项目参与者表中有对应的记录
INSERT IGNORE INTO project_participants (
  id, project_id, user_id, role, status, joined_at, created_at, updated_at
) VALUES 
('pp-mentor-001', 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79', 'counselor-001', 'COUNSELOR', 'ACTIVE', NOW(), NOW(), NOW()),
('pp-mentor-002', 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79', 'counselor-002', 'COUNSELOR', 'ACTIVE', NOW(), NOW(), NOW()),
('pp-student-001', 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79', 'user-hr-001', 'STUDENT', 'ACTIVE', NOW(), NOW(), NOW()),
('pp-student-002', 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79', 'user-sales-001', 'STUDENT', 'ACTIVE', NOW(), NOW(), NOW()),
('pp-student-003', 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79', 'user-admin-002', 'STUDENT', 'ACTIVE', NOW(), NOW(), NOW()); 