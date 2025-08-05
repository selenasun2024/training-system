-- 基于现有项目添加评价测试数据
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 删除测试评价数据
DELETE FROM mentorship_evaluations WHERE id LIKE 'existing-eval-%';

-- 基于现有项目创建评价记录，不使用relationship_id

-- 评价1: 张辅导员评价李小红 - 已完成
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
  'existing-eval-001', 
  '287270c5-397f-47b2-bc15-0ea8032f2353', -- IT培训2 - 张辅导员带教李小红
  NULL,  -- 将relationship_id设为NULL
  'PHASE', 'mentor evaluation template',
  'counselor-002', 'MENTOR', 'Zhang Teacher',
  'student-002', 'STUDENT', 'Li Xiaohong',
  8.5, 9.0, 8.8, 8.6, 8.9, 8.76,
  '{}', 'Good learning attitude', 'Need more practice', 'Overall excellent performance', 'Join more projects',
  '{}', 'Phase goals achieved', '[]', '[]', '[]', '[]',
  'FINALIZED', false, 'SHARED',
  '2024-01-20', '2024-01-22 10:30:00', '2024-01-23 16:00:00',
  NOW(), NOW()
),

-- 评价2: 李小红评价张辅导员 - 已完成  
(
  'existing-eval-002',
  '287270c5-397f-47b2-bc15-0ea8032f2353', -- IT培训2 - 张辅导员带教李小红
  NULL,  -- 将relationship_id设为NULL
  'MILESTONE', 'student evaluation template',
  'student-002', 'STUDENT', 'Li Xiaohong',
  'counselor-002', 'MENTOR', 'Zhang Teacher',
  9.2, 8.7, 9.1, 8.9, 9.0, 8.98,
  '{}', 'Professional guidance', 'More practical opportunities', 'Very grateful for guidance', 'Keep this approach',
  '{}', 'Very satisfied with mentor', '[]', '[]', '[]', '[]',
  'FINALIZED', false, 'SHARED',
  '2024-01-25', '2024-01-27 09:15:00', '2024-01-28 15:45:00',
  NOW(), NOW()
),

-- 评价3: 李辅导员评价赵敏 - 已完成
(
  'existing-eval-003',
  '942e2b16-b133-4490-945a-67be6a017d2a', -- IT培训2 - 李辅导员带教赵敏
  NULL,  -- 将relationship_id设为NULL
  'FINAL', 'promotion evaluation template',
  'counselor-001', 'MENTOR', 'Li Teacher', 
  'user-prod-001', 'STUDENT', 'Zhao Min',
  9.1, 9.2, 9.0, 8.8, 9.1, 9.04,
  '{}', 'Outstanding technical skills', 'Team collaboration needs improvement', 'Ready for promotion', 'More team projects',
  '{}', 'Promotion conditions met', '[]', '[]', '[]', '[]',
  'FINALIZED', false, 'SHARED',
  '2024-02-01', '2024-02-03 14:20:00', '2024-02-04 11:30:00',
  NOW(), NOW()
),

-- 评价4: 张辅导员评价冯芹 - 已完成
(
  'existing-eval-004',
  '0a971936-0cd3-4447-bd3c-572ccec3191a', -- 新员工入职培训 - 张辅导员带教冯芹
  NULL,  -- 将relationship_id设为NULL
  'PHASE', 'new employee evaluation',
  'counselor-002', 'MENTOR', 'Zhang Teacher',
  'user-hr-001', 'STUDENT', 'Feng Qin',
  8.8, 9.1, 9.3, 8.7, 9.0, 8.98,
  '{}', 'Strong adaptability', 'Decision making skills', 'Exceeds expectations', 'Take more responsibility',
  '{}', 'Training effective', '[]', '[]', '[]', '[]',
  'FINALIZED', false, 'SHARED',
  '2024-02-05', '2024-02-07 16:30:00', '2024-02-08 14:00:00',
  NOW(), NOW()
),

-- 评价5: 待评价记录 - 用于对比
(
  'existing-eval-005',
  '6044df1a-0ee0-4cd6-b259-772885dbc856', -- IT培训2 - 李辅导员带教吴静
  NULL,  -- 将relationship_id设为NULL
  'PERIODIC', 'mid-term evaluation',
  'user-market-001', 'STUDENT', 'Wu Jing',
  'counselor-001', 'MENTOR', 'Li Teacher',
  0, 0, 0, 0, 0, 0,
  '{}', '', '', '', '',
  '{}', '', '[]', '[]', '[]', '[]',
  'DRAFT', false, 'SHARED',
  '2024-02-10', NULL, NULL,
  NOW(), NOW()
);

-- 查看插入的数据
SELECT 
  e.id, 
  e.evaluation_title as template_name,
  CONCAT(e.evaluator_name, ' -> ', e.evaluatee_name) as evaluation_pair,
  e.overall_score,
  e.status,
  e.finalized_at,
  p.title as project_title
FROM mentorship_evaluations e
LEFT JOIN mentorship_projects p ON e.project_id = p.id
WHERE e.id LIKE 'existing-eval-%'
ORDER BY e.created_at; 