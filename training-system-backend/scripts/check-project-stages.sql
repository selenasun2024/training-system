-- 查询项目和阶段信息
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.project_no,
    s.id as stage_id,
    s.name as stage_name,
    s.type as stage_type
FROM training_projects p
LEFT JOIN training_stages s ON p.id = s.project_id
WHERE p.project_no LIKE '%TP2025%' OR p.name LIKE '%新员工%'
ORDER BY p.project_no, s.order_index; 