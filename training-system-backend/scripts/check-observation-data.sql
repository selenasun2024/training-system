-- 检查观察记录数据
SELECT 
    o.id,
    o.project_id,
    o.student_id,
    o.observer_id,
    o.type,
    o.title,
    o.content,
    o.score,
    o.created_at,
    s.name as student_name,
    obs.name as observer_name,
    p.name as project_name
FROM observation_records o
JOIN users s ON o.student_id = s.id
JOIN users obs ON o.observer_id = obs.id
JOIN training_projects p ON o.project_id = p.id
ORDER BY o.created_at DESC
LIMIT 10;

-- 统计观察记录数量
SELECT 
    COUNT(*) as total_observations,
    COUNT(DISTINCT student_id) as students_with_observations,
    COUNT(DISTINCT project_id) as projects_with_observations
FROM observation_records;

-- 按项目统计观察记录
SELECT 
    p.name as project_name,
    COUNT(*) as observation_count,
    COUNT(DISTINCT o.student_id) as students_count
FROM observation_records o
JOIN training_projects p ON o.project_id = p.id
GROUP BY p.id, p.name
ORDER BY observation_count DESC; 