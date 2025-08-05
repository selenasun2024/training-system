-- 最简化的评价测试数据
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 先创建虚拟的师徒关系记录
INSERT IGNORE INTO mentorship_relationships (
  id, project_id, mentor_id, mentor_name, mentor_type,
  student_id, student_name, relationship_type, scope,
  matching_type, established_date, status, created_at, updated_at
) VALUES 
('virtual-rel-001', '287270c5-397f-47b2-bc15-0ea8032f2353', 'counselor-002', 'Zhang Teacher', 'MENTOR', 'student-002', 'Li Xiaohong', 'ONE_TO_ONE', 'PROJECT_FULL', 'MANUAL', '2024-01-15', 'ACTIVE', NOW(), NOW()),
('virtual-rel-002', '942e2b16-b133-4490-945a-67be6a017d2a', 'counselor-001', 'Li Teacher', 'MENTOR', 'user-prod-001', 'Zhao Min', 'ONE_TO_ONE', 'PROJECT_FULL', 'MANUAL', '2024-01-16', 'ACTIVE', NOW(), NOW()),
('virtual-rel-003', '0a971936-0cd3-4447-bd3c-572ccec3191a', 'counselor-002', 'Zhang Teacher', 'MENTOR', 'user-hr-001', 'Feng Qin', 'ONE_TO_ONE', 'PROJECT_FULL', 'MANUAL', '2024-01-17', 'ACTIVE', NOW(), NOW());

-- 删除旧的测试评价数据
DELETE FROM mentorship_evaluations WHERE id LIKE 'min-eval-%';

-- 创建评价记录
INSERT INTO mentorship_evaluations (
  id, project_id, relationship_id,
  evaluation_type, evaluation_title,
  evaluator_id, evaluator_type, evaluator_name,
  evaluatee_id, evaluatee_type, evaluatee_name,
  technical_skills_score, communication_score, learning_attitude_score,
  problem_solving_score, collaboration_score, overall_score,
  custom_criteria, strengths, improvement_areas, specific_feedback, suggestions,
  goal_achievement, progress_assessment, milestone_completion,
  next_phase_goals, recommended_actions, focus_areas,
  status, is_anonymous, visibility,
  evaluation_date, submitted_at, finalized_at,
  created_at, updated_at
) VALUES 
-- 评价1: 已完成
('min-eval-001', '287270c5-397f-47b2-bc15-0ea8032f2353', 'virtual-rel-001',
 'PHASE', 'mentor evaluation template',
 'counselor-002', 'MENTOR', 'Zhang Teacher',
 'student-002', 'STUDENT', 'Li Xiaohong',
 8.5, 9.0, 8.8, 8.6, 8.9, 8.76,
 '{}', 'Good performance', 'Need improvement', 'Overall good', 'Keep learning',
 '{}', 'Progress good', '[]', '[]', '[]', '[]',
 'FINALIZED', false, 'SHARED',
 '2024-01-20', '2024-01-22 10:30:00', '2024-01-23 16:00:00',
 NOW(), NOW()),

-- 评价2: 已完成
('min-eval-002', '942e2b16-b133-4490-945a-67be6a017d2a', 'virtual-rel-002',
 'FINAL', 'promotion evaluation',
 'counselor-001', 'MENTOR', 'Li Teacher',
 'user-prod-001', 'STUDENT', 'Zhao Min',
 9.1, 9.2, 9.0, 8.8, 9.1, 9.04,
 '{}', 'Excellent skills', 'Team work', 'Ready for promotion', 'More projects',
 '{}', 'Promotion ready', '[]', '[]', '[]', '[]',
 'FINALIZED', false, 'SHARED',
 '2024-02-01', '2024-02-03 14:20:00', '2024-02-04 11:30:00',
 NOW(), NOW()),

-- 评价3: 已完成
('min-eval-003', '0a971936-0cd3-4447-bd3c-572ccec3191a', 'virtual-rel-003',
 'MILESTONE', 'new employee evaluation',
 'counselor-002', 'MENTOR', 'Zhang Teacher',
 'user-hr-001', 'STUDENT', 'Feng Qin',
 8.8, 9.1, 9.3, 8.7, 9.0, 8.98,
 '{}', 'Great adaptability', 'Decision skills', 'Exceeds expectations', 'More responsibility',
 '{}', 'Training effective', '[]', '[]', '[]', '[]',
 'FINALIZED', false, 'SHARED',
 '2024-02-05', '2024-02-07 16:30:00', '2024-02-08 14:00:00',
 NOW(), NOW());

-- 查看结果
SELECT 
  e.id, 
  e.evaluation_title,
  CONCAT(e.evaluator_name, ' -> ', e.evaluatee_name) as pair,
  e.overall_score,
  e.status,
  p.title as project
FROM mentorship_evaluations e
LEFT JOIN mentorship_projects p ON e.project_id = p.id
WHERE e.id LIKE 'min-eval-%'; 