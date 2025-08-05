-- 设置字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 添加已完成的评价测试数据，用于测试教务回访功能
-- 首先创建一个测试项目
INSERT IGNORE INTO mentorship_projects (
  id, name, description, project_type, status, start_date, end_date,
  created_at, updated_at
) VALUES (
  'test-project-001', 'Test Mentorship Project', 'Test project for evaluation demo',
  'TRAINING_BASED', 'ACTIVE', '2024-01-01', '2024-12-31',
  NOW(), NOW()
);

-- 删除可能存在的测试评价数据
DELETE FROM mentorship_evaluations WHERE id LIKE 'eval-test-%';

-- 评价1: 学员评价导师 - 已完成（10分制）
INSERT INTO mentorship_evaluations (
  id, project_id, relationship_id, phase_id,
  evaluation_type, evaluation_title, evaluation_period,
  evaluator_id, evaluator_type, evaluator_name,
  evaluatee_id, evaluatee_type, evaluatee_name,
  technical_skills_score, communication_score, learning_attitude_score,
  problem_solving_score, collaboration_score, overall_score,
  custom_criteria, strengths, improvement_areas, specific_feedback, suggestions,
  goal_achievement, progress_assessment, milestone_completion,
  next_phase_goals, recommended_actions, focus_areas,
  status, is_anonymous, visibility,
  evaluation_date, submitted_at, reviewed_at, finalized_at,
  created_at, updated_at
) VALUES (
  'eval-test-001', 
  'test-project-001', 
  'rel-test-001', 
  NULL,
  'PHASE', 
  'mentor evaluation template', 
  'PHASE_END',
  'user-hr-001', 'STUDENT', 'Feng Qin',
  'counselor-001', 'MENTOR', 'Li Teacher',
  8.85, 9.20, 8.55, 8.70, 9.00, 8.86,
  '{}',
  'Good guidance and professional skills',
  'More practice opportunities needed',
  'Overall guidance effect is very good, helpful for growth',
  'Suggest adding more practical exercises',
  '{}', 'Student progress is obvious', '[]',
  '[]', '[]', '[]',
  'FINALIZED', false, 'SHARED',
  '2024-01-20', '2024-01-22 10:30:00', '2024-01-23 14:20:00', '2024-01-23 16:00:00',
  NOW(), NOW()
);

-- 评价2: 导师评价学员 - 已完成（10分制）
INSERT INTO mentorship_evaluations (
  id, project_id, relationship_id, phase_id,
  evaluation_type, evaluation_title, evaluation_period,
  evaluator_id, evaluator_type, evaluator_name,
  evaluatee_id, evaluatee_type, evaluatee_name,
  technical_skills_score, communication_score, learning_attitude_score,
  problem_solving_score, collaboration_score, overall_score,
  custom_criteria, strengths, improvement_areas, specific_feedback, suggestions,
  goal_achievement, progress_assessment, milestone_completion,
  next_phase_goals, recommended_actions, focus_areas,
  status, is_anonymous, visibility,
  evaluation_date, submitted_at, reviewed_at, finalized_at,
  created_at, updated_at
) VALUES (
  'eval-test-002',
  'test-project-001',
  'rel-test-002',
  NULL,
  'MILESTONE',
  'student evaluation template',
  'PHASE_MID',
  'counselor-002', 'MENTOR', 'Wang Teacher',
  'user-sales-001', 'STUDENT', 'Zhang Manager',
  8.50, 8.85, 9.00, 8.35, 8.70, 8.68,
  '{}',
  'Positive learning attitude, strong acceptance',
  'Need more practice in sales skills',
  'Good overall performance, basic sales quality',
  'Suggest more case studies and communication training',
  '{}', 'Phased goals basically achieved', '[]',
  '[]', '[]', '[]',
  'FINALIZED', false, 'SHARED',
  '2024-01-25', '2024-01-27 09:15:00', '2024-01-28 11:30:00', '2024-01-28 15:45:00',
  NOW(), NOW()
);

-- 评价3: 学员评价导师 - 已完成（10分制）
INSERT INTO mentorship_evaluations (
  id, project_id, relationship_id, phase_id,
  evaluation_type, evaluation_title, evaluation_period,
  evaluator_id, evaluator_type, evaluator_name,
  evaluatee_id, evaluatee_type, evaluatee_name,
  technical_skills_score, communication_score, learning_attitude_score,
  problem_solving_score, collaboration_score, overall_score,
  custom_criteria, strengths, improvement_areas, specific_feedback, suggestions,
  goal_achievement, progress_assessment, milestone_completion,
  next_phase_goals, recommended_actions, focus_areas,
  status, is_anonymous, visibility,
  evaluation_date, submitted_at, reviewed_at, finalized_at,
  created_at, updated_at
) VALUES (
  'eval-test-003',
  'test-project-001',
  'rel-test-003',
  NULL,
  'PHASE',
  'mentor phase evaluation',
  'PHASE_END',
  'user-admin-002', 'STUDENT', 'Zhao Assistant',
  'counselor-001', 'MENTOR', 'Li Teacher',
  9.10, 8.95, 9.40, 8.80, 9.25, 9.10,
  '{}',
  'Professional and detailed guidance',
  'Hope for more cross-department collaboration',
  'Valuable experience sharing in administration',
  'Suggest adding management theory content',
  '{}', 'Significant improvement in admin capability', '[]',
  '[]', '[]', '[]',
  'FINALIZED', false, 'SHARED',
  '2024-02-01', '2024-02-03 14:20:00', '2024-02-04 09:10:00', '2024-02-04 11:30:00',
  NOW(), NOW()
);

-- 评价4: 导师评价学员 - 已完成（10分制）
INSERT INTO mentorship_evaluations (
  id, project_id, relationship_id, phase_id,
  evaluation_type, evaluation_title, evaluation_period,
  evaluator_id, evaluator_type, evaluator_name,
  evaluatee_id, evaluatee_type, evaluatee_name,
  technical_skills_score, communication_score, learning_attitude_score,
  problem_solving_score, collaboration_score, overall_score,
  custom_criteria, strengths, improvement_areas, specific_feedback, suggestions,
  goal_achievement, progress_assessment, milestone_completion,
  next_phase_goals, recommended_actions, focus_areas,
  status, is_anonymous, visibility,
  evaluation_date, submitted_at, reviewed_at, finalized_at,
  created_at, updated_at
) VALUES (
  'eval-test-004',
  'test-project-001',
  'rel-test-001',
  NULL,
  'FINAL',
  'student promotion evaluation',
  'PROJECT_END',
  'counselor-001', 'MENTOR', 'Li Teacher',
  'user-hr-001', 'STUDENT', 'Feng Qin',
  8.95, 9.10, 9.35, 8.75, 9.00, 9.03,
  '{}',
  'Excellent performance, strong learning ability',
  'Decision-making skills need improvement',
  'Student has independent work capability, recommend promotion',
  'Suggest participating in more project management',
  '{}', 'Promotion conditions met, qualified for position', '[]',
  '[]', '[]', '[]',
  'FINALIZED', false, 'SHARED',
  '2024-02-05', '2024-02-07 16:30:00', '2024-02-08 10:15:00', '2024-02-08 14:00:00',
  NOW(), NOW()
);

-- 添加一些待评价的记录，用于对比
INSERT INTO mentorship_evaluations (
  id, project_id, relationship_id, phase_id,
  evaluation_type, evaluation_title, evaluation_period,
  evaluator_id, evaluator_type, evaluator_name,
  evaluatee_id, evaluatee_type, evaluatee_name,
  technical_skills_score, communication_score, learning_attitude_score,
  problem_solving_score, collaboration_score, overall_score,
  custom_criteria, strengths, improvement_areas, specific_feedback, suggestions,
  goal_achievement, progress_assessment, milestone_completion,
  next_phase_goals, recommended_actions, focus_areas,
  status, is_anonymous, visibility,
  evaluation_date, submitted_at, reviewed_at, finalized_at,
  created_at, updated_at
) VALUES (
  'eval-test-005',
  'test-project-001',
  'rel-test-002',
  NULL,
  'PERIODIC',
  'mentor mid-term evaluation',
  'PHASE_MID',
  'user-sales-001', 'STUDENT', 'Zhang Manager',
  'counselor-002', 'MENTOR', 'Wang Teacher',
  0, 0, 0, 0, 0, 0,
  '{}', '', '', '', '',
  '{}', '', '[]',
  '[]', '[]', '[]',
  'DRAFT', false, 'SHARED',
  '2024-02-10', NULL, NULL, NULL,
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
WHERE id LIKE 'eval-test-%'
ORDER BY created_at; 