-- 检查用户身份和任务状态

-- 1. 检查冯芹和吴静的用户信息
SELECT 
  u.id,
  u.username,
  u.name
FROM users u
WHERE u.name IN ('冯芹', '吴静') 
   OR u.username IN ('feng-qin', 'wujing')
ORDER BY u.name;

-- 2. 检查他们在"新员工入职培训"项目中的参与情况
SELECT 
  u.id as user_id,
  u.username,
  u.name,
  pp.project_id,
  tp.name as project_name,
  pp.role as project_role,
  pp.status
FROM users u
LEFT JOIN project_participants pp ON u.id = pp.user_id
LEFT JOIN training_projects tp ON pp.project_id = tp.id
WHERE (u.name IN ('冯芹', '吴静') OR u.username IN ('feng-qin', 'wujing'))
  AND tp.name LIKE '%新员工入职培训%'
ORDER BY u.name, pp.role;

-- 3. 检查新员工入职培训项目的作业任务（简化版）
SELECT 
  tt.id as task_id,
  tt.name as task_name,
  tt.type as task_type,
  tp.name as project_name
FROM training_tasks tt
JOIN training_projects tp ON tt.projectId = tp.id
WHERE tp.name LIKE '%新员工入职培训%' AND tt.type = 'homework'
ORDER BY tt.name;

-- 4. 检查任务提交记录
SELECT 
  ts.id as submission_id,
  ts.taskId,
  ts.studentId,
  u_student.name as student_name,
  ts.status as submission_status,
  ts.submittedAt
FROM task_submissions ts
JOIN users u_student ON ts.studentId = u_student.id
JOIN training_tasks tt ON ts.taskId = tt.id
JOIN training_projects tp ON tt.projectId = tp.id
WHERE tp.name LIKE '%新员工入职培训%'
ORDER BY ts.submittedAt; 