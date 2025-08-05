-- 检查师徒关系和培训项目的ID映射关系

-- 1. 查看师徒关系中的项目ID
SELECT '=== 师徒关系中的项目ID ===' as info;
SELECT DISTINCT project_id, COUNT(*) as relationship_count
FROM mentorship_relationships 
GROUP BY project_id
ORDER BY relationship_count DESC
LIMIT 10;

-- 2. 查看培训项目表中的项目ID
SELECT '=== 培训项目表中的项目ID ===' as info;
SELECT id, name, type, status
FROM training_projects 
ORDER BY created_at DESC
LIMIT 10;

-- 3. 检查不匹配的项目ID
SELECT '=== 不匹配的项目ID ===' as info;
SELECT DISTINCT mr.project_id, COUNT(*) as relationship_count
FROM mentorship_relationships mr
LEFT JOIN training_projects tp ON mr.project_id = tp.id
WHERE tp.id IS NULL
GROUP BY mr.project_id;

-- 4. 检查可以匹配的项目ID
SELECT '=== 可以匹配的项目ID ===' as info;
SELECT mr.project_id, tp.name, tp.type, COUNT(*) as relationship_count
FROM mentorship_relationships mr
INNER JOIN training_projects tp ON mr.project_id = tp.id
GROUP BY mr.project_id, tp.name, tp.type
ORDER BY relationship_count DESC;

-- 5. 详细查看师徒关系和项目的关联情况
SELECT '=== 师徒关系和项目关联详情 ===' as info;
SELECT 
    mr.mentor_name,
    mr.student_name,
    mr.project_id,
    tp.name as project_name,
    tp.type as project_type,
    mr.status,
    mr.established_date
FROM mentorship_relationships mr
LEFT JOIN training_projects tp ON mr.project_id = tp.id
ORDER BY mr.created_at DESC
LIMIT 10; 