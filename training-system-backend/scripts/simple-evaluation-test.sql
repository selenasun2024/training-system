-- 简化的评价测试数据脚本
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 删除测试数据
DELETE FROM mentorship_evaluations WHERE id LIKE 'simple-eval-%';

-- 创建简化的评价记录，不依赖复杂的外键关系
-- 使用虚拟的但合理的数据

-- 评价1: 已完成的评价
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
) VALUES (
  'simple-eval-001', 
  'dummy-project-001', 'dummy-rel-001',
  'PHASE', 'mentor evaluation template',
  'user-001', 'STUDENT', 'Student A',
  'mentor-001', 'MENTOR', 'Mentor A',
  8.5, 9.0, 8.8, 8.6, 8.9, 8.76,
  '{}', 'Good performance', 'Need improvement', 'Overall good', 'Keep it up',
  '{}', 'Progress good', '[]', '[]', '[]', '[]',
  'FINALIZED', false, 'SHARED',
  '2024-01-20', '2024-01-22 10:30:00', '2024-01-23 16:00:00',
  NOW(), NOW()
),
(
  'simple-eval-002',
  'dummy-project-001', 'dummy-rel-002', 
  'MILESTONE', 'student evaluation template',
  'mentor-002', 'MENTOR', 'Mentor B',
  'user-002', 'STUDENT', 'Student B',
  8.2, 8.7, 8.9, 8.4, 8.6, 8.56,
  '{}', 'Excellent attitude', 'Technical skills', 'Very good progress', 'Continue learning',
  '{}', 'Meeting expectations', '[]', '[]', '[]', '[]',
  'FINALIZED', false, 'SHARED',
  '2024-01-25', '2024-01-27 09:15:00', '2024-01-28 15:45:00',
  NOW(), NOW()
),
(
  'simple-eval-003',
  'dummy-project-001', 'dummy-rel-003',
  'FINAL', 'promotion evaluation',
  'mentor-003', 'MENTOR', 'Mentor C', 
  'user-003', 'STUDENT', 'Student C',
  9.1, 9.2, 9.0, 8.8, 9.1, 9.04,
  '{}', 'Outstanding performance', 'Leadership skills', 'Ready for promotion', 'Take on more responsibility',
  '{}', 'Exceeds expectations', '[]', '[]', '[]', '[]',
  'FINALIZED', false, 'SHARED',
  '2024-02-01', '2024-02-03 14:20:00', '2024-02-04 11:30:00',
  NOW(), NOW()
),
(
  'simple-eval-004',
  'dummy-project-001', 'dummy-rel-004',
  'PERIODIC', 'mid-term evaluation',
  'user-004', 'STUDENT', 'Student D',
  'mentor-004', 'MENTOR', 'Mentor D',
  0, 0, 0, 0, 0, 0,
  '{}', '', '', '', '',
  '{}', '', '[]', '[]', '[]', '[]',
  'DRAFT', false, 'SHARED',
  '2024-02-10', NULL, NULL,
  NOW(), NOW()
);

-- 查看插入的数据
SELECT 
  id, 
  evaluation_title as template_name,
  CONCAT(evaluator_name, ' -> ', evaluatee_name) as evaluation_pair,
  overall_score,
  status,
  finalized_at
FROM mentorship_evaluations 
WHERE id LIKE 'simple-eval-%'
ORDER BY created_at; 