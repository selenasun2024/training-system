-- 检查师徒关系概览数据
-- 
-- 1. 检查 mentorship_relationships 表数据
SELECT '=== mentorship_relationships 数据 ===' as info;
SELECT 
    COUNT(*) as total_relationships,
    status,
    COUNT(*) as count_by_status
FROM mentorship_relationships 
GROUP BY status;

SELECT 
    id,
    mentor_name,
    student_name,
    project_id,
    phase_id,
    status,
    scope,
    established_date,
    created_at
FROM mentorship_relationships 
ORDER BY created_at DESC
LIMIT 10;

-- 2. 检查 mentorship_projects 表数据
SELECT '=== mentorship_projects 数据 ===' as info;
SELECT 
    COUNT(*) as total_mentorship_projects
FROM mentorship_projects;

SELECT 
    id,
    name,
    source_training_project_id,
    status,
    created_at
FROM mentorship_projects 
ORDER BY created_at DESC
LIMIT 5;

-- 3. 检查 training_projects 表数据
SELECT '=== training_projects 数据 ===' as info;
SELECT 
    COUNT(*) as total_training_projects
FROM training_projects;

SELECT 
    id,
    name,
    type,
    status,
    created_at
FROM training_projects 
ORDER BY created_at DESC
LIMIT 5;

-- 4. 检查关联关系是否正确
SELECT '=== 关联关系检查 ===' as info;
SELECT 
    mr.id as relationship_id,
    mr.mentor_name,
    mr.student_name,
    mr.project_id as mentorship_project_id,
    mp.name as mentorship_project_name,
    mp.source_training_project_id,
    tp.name as training_project_name,
    tp.type as training_project_type
FROM mentorship_relationships mr
LEFT JOIN mentorship_projects mp ON mr.project_id = mp.id
LEFT JOIN training_projects tp ON mp.source_training_project_id = tp.id
ORDER BY mr.created_at DESC
LIMIT 10;

-- 5. 检查用户数据
SELECT '=== 用户数据检查 ===' as info;
SELECT 
    COUNT(*) as total_users
FROM users;

SELECT 
    id,
    name,
    department,
    position,
    status
FROM users 
WHERE department IS NOT NULL
ORDER BY created_at DESC
LIMIT 10; 