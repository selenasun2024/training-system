-- 调试项目数据不一致问题的SQL查询

-- 1. 查找所有项目，特别关注新员工入职培训项目
SELECT '=== 1. 所有项目列表 ===' as title;
SELECT id, name, status, created_at 
FROM projects 
ORDER BY created_at DESC;

-- 2. 查找新员工入职培训项目的观察记录
SELECT '=== 2. 新员工入职培训项目的观察记录 ===' as title;
SELECT 
    or_table.id as observation_id,
    or_table.project_id,
    p.name as project_name,
    or_table.observer_id,
    observer.name as observer_name,
    or_table.student_id,
    student.name as student_name,
    or_table.created_at
FROM observation_records or_table
JOIN projects p ON or_table.project_id = p.id
JOIN users observer ON or_table.observer_id = observer.id
JOIN users student ON or_table.student_id = student.id
WHERE p.name LIKE '%新员工入职培训%'
ORDER BY or_table.created_at DESC;

-- 3. 查找新员工入职培训项目的项目参与者
SELECT '=== 3. 新员工入职培训项目的项目参与者 ===' as title;
SELECT 
    pp.id as participant_id,
    pp.project_id,
    p.name as project_name,
    pp.user_id,
    u.name as user_name,
    pp.role,
    pp.status,
    pp.joined_at
FROM project_participants pp
JOIN projects p ON pp.project_id = p.id
JOIN users u ON pp.user_id = u.id
WHERE p.name LIKE '%新员工入职培训%'
ORDER BY pp.joined_at DESC;

-- 4. 查找有观察记录但不在项目参与者表中的学员（新员工入职培训项目）
SELECT '=== 4. 数据不一致分析 ===' as title;
SELECT 
    'Missing Participants' as issue_type,
    or_table.student_id,
    student.name as student_name,
    or_table.project_id,
    p.name as project_name,
    COUNT(or_table.id) as observation_count
FROM observation_records or_table
JOIN projects p ON or_table.project_id = p.id
JOIN users student ON or_table.student_id = student.id
LEFT JOIN project_participants pp ON (
    pp.project_id = or_table.project_id 
    AND pp.user_id = or_table.student_id 
    AND pp.role = 'STUDENT' 
    AND pp.status = 'ACTIVE'
)
WHERE p.name LIKE '%新员工入职培训%'
  AND pp.id IS NULL
GROUP BY or_table.student_id, student.name, or_table.project_id, p.name;

-- 5. 查找项目参与者中角色或状态不正确的学员
SELECT '=== 5. 角色状态不正确的学员 ===' as title;
SELECT 
    'Incorrect Role/Status' as issue_type,
    pp.user_id,
    u.name as user_name,
    pp.project_id,
    p.name as project_name,
    pp.role,
    pp.status,
    'Expected: STUDENT/ACTIVE' as expected
FROM project_participants pp
JOIN projects p ON pp.project_id = p.id
JOIN users u ON pp.user_id = u.id
WHERE p.name LIKE '%新员工入职培训%'
  AND pp.user_id IN (
    SELECT DISTINCT student_id 
    FROM observation_records 
    WHERE project_id = pp.project_id
  )
  AND (pp.role != 'STUDENT' OR pp.status != 'ACTIVE'); 