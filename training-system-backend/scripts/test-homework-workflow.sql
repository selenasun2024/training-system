-- 测试作业提交和批阅工作流程
-- 1. 检查现有的作业任务

SELECT 
  tt.id as task_id,
  tt.name as task_name,
  tt.type as task_type,
  tt.reviewerRole as reviewer_role,
  tp.name as project_name,
  pp.userId as student_id,
  u.name as student_name
FROM training_tasks tt
JOIN training_projects tp ON tt.projectId = tp.id
JOIN project_participants pp ON tp.id = pp.projectId AND pp.role = 'STUDENT' AND pp.status = 'ACTIVE'
JOIN users u ON pp.userId = u.id
WHERE tt.type = 'homework' AND tt.status = 'ACTIVE'
ORDER BY tp.name, tt.name;

-- 2. 检查现有的提交记录
SELECT 
  ts.id as submission_id,
  ts.taskId,
  tt.name as task_name,
  ts.studentId,
  u.name as student_name,
  ts.status,
  ts.content,
  ts.submittedAt,
  ts.score,
  ts.feedback,
  ts.reviewedAt
FROM task_submissions ts
JOIN training_tasks tt ON ts.taskId = tt.id
JOIN users u ON ts.studentId = u.id
ORDER BY ts.submittedAt DESC;

-- 3. 检查用户"吴静"是否存在及其参与的项目
SELECT 
  u.id,
  u.username,
  u.name,
  pp.projectId,
  tp.name as project_name,
  pp.role,
  pp.status
FROM users u
LEFT JOIN project_participants pp ON u.id = pp.userId
LEFT JOIN training_projects tp ON pp.projectId = tp.id
WHERE u.name LIKE '%吴静%' OR u.username LIKE '%wujing%';

-- 4. 模拟学生提交记录（如果"吴静"存在且参与项目）
-- 注意：这只是查询，不会实际插入数据
-- 实际的提交应该通过前端API进行

/*
-- 如果需要手动创建测试提交记录，可以使用以下语句：
INSERT INTO task_submissions (
  id,
  taskId,
  studentId,
  content,
  filePaths,
  status,
  submittedAt,
  createdAt,
  updatedAt
) 
SELECT 
  CONCAT('sub-', REPLACE(UUID(), '-', '')),
  tt.id,
  pp.userId,
  '这是我的作业内容，我认真完成了AI岗位个人能力分析，通过学习了解到...',
  '[]',
  'SUBMITTED',
  NOW(),
  NOW(),
  NOW()
FROM training_tasks tt
JOIN project_participants pp ON tt.projectId = pp.projectId
JOIN users u ON pp.userId = u.id
WHERE tt.name LIKE '%AI岗位个人能力分析%'
  AND u.name = '吴静'
  AND pp.role = 'STUDENT'
  AND pp.status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1 FROM task_submissions ts 
    WHERE ts.taskId = tt.id AND ts.studentId = pp.userId
  );
*/ 