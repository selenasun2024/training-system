-- 最终的评价测试数据解决方案
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 如果有约束问题，先执行这个命令（可选）：
-- ALTER TABLE mentorship_evaluations DROP FOREIGN KEY mentorship_evaluations_relationship_id_fkey;

-- 删除旧的测试数据
DELETE FROM mentorship_evaluations WHERE evaluator_name LIKE '%Teacher%';

-- 直接插入评价数据，使用简单的relationship_id
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

-- 评价1: 已完成 - 用于测试教务回访功能
('test-eval-001', '287270c5-397f-47b2-bc15-0ea8032f2353', 'test-rel-001',
 'PHASE', 'mentor evaluation template',
 'counselor-002', 'MENTOR', 'Zhang Teacher',
 'student-002', 'STUDENT', 'Li Xiaohong',
 8.5, 9.0, 8.8, 8.6, 8.9, 8.76,
 '{}', 'Good performance', 'Need improvement', 'Overall excellent', 'Keep learning',
 '{}', 'Progress satisfactory', '[]', '[]', '[]', '[]',
 'FINALIZED', false, 'SHARED',
 '2024-01-20', '2024-01-22 10:30:00', '2024-01-23 16:00:00',
 NOW(), NOW()),

-- 评价2: 已完成 - 用于测试教务回访功能  
('test-eval-002', '942e2b16-b133-4490-945a-67be6a017d2a', 'test-rel-002',
 'FINAL', 'promotion evaluation',
 'counselor-001', 'MENTOR', 'Li Teacher',
 'user-prod-001', 'STUDENT', 'Zhao Min',
 9.1, 9.2, 9.0, 8.8, 9.1, 9.04,
 '{}', 'Excellent technical skills', 'Team collaboration', 'Ready for promotion', 'More team projects',
 '{}', 'Promotion conditions met', '[]', '[]', '[]', '[]',
 'FINALIZED', false, 'SHARED',
 '2024-02-01', '2024-02-03 14:20:00', '2024-02-04 11:30:00',
 NOW(), NOW()),

-- 评价3: 已完成 - 用于测试教务回访功能
('test-eval-003', '0a971936-0cd3-4447-bd3c-572ccec3191a', 'test-rel-003',
 'MILESTONE', 'new employee evaluation',
 'counselor-002', 'MENTOR', 'Zhang Teacher',
 'user-hr-001', 'STUDENT', 'Feng Qin',
 8.8, 9.1, 9.3, 8.7, 9.0, 8.98,
 '{}', 'Strong adaptability', 'Decision making skills', 'Exceeds expectations', 'Take more responsibility',
 '{}', 'New employee training effective', '[]', '[]', '[]', '[]',
 'FINALIZED', false, 'SHARED',
 '2024-02-05', '2024-02-07 16:30:00', '2024-02-08 14:00:00',
 NOW(), NOW());

-- 查看插入结果
SELECT 
  id, 
  evaluation_title as template_name,
  CONCAT(evaluator_name, ' -> ', evaluatee_name) as evaluation_pair,
  overall_score,
  status,
  'completed' as mapped_status,
  'pending_followup' as followup_status
FROM mentorship_evaluations 
WHERE id LIKE 'test-eval-%'
ORDER BY created_at; 