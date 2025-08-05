-- 师徒关系数据一致性检查脚本
-- 运行此脚本来检查数据库中师徒关系的状态

-- 1. 检查师徒关系状态分布
SELECT 
    status,
    COUNT(*) as count,
    GROUP_CONCAT(DISTINCT project_id) as project_ids
FROM mentorship_relationships 
GROUP BY status
ORDER BY count DESC;

-- 2. 检查可能的问题数据：状态为NULL或异常的关系
SELECT 
    id,
    project_id,
    mentor_name,
    student_name,
    status,
    created_at,
    updated_at,
    termination_date,
    termination_reason
FROM mentorship_relationships 
WHERE status IS NULL 
   OR status NOT IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED')
ORDER BY created_at DESC;

-- 3. 检查已终止但没有终止日期的关系
SELECT 
    id,
    project_id,
    mentor_name,
    student_name,
    status,
    termination_date,
    termination_reason,
    updated_at
FROM mentorship_relationships 
WHERE status = 'TERMINATED' 
  AND termination_date IS NULL
ORDER BY updated_at DESC;

-- 4. 检查特定项目的师徒关系详情（替换YOUR_PROJECT_ID）
-- SELECT 
--     id,
--     project_id,
--     mentor_name,
--     student_name,
--     status,
--     established_date,
--     termination_date,
--     termination_reason,
--     created_at,
--     updated_at
-- FROM mentorship_relationships 
-- WHERE project_id IN (
--     SELECT id FROM mentorship_projects 
--     WHERE source_training_project_id = 'YOUR_PROJECT_ID'
-- )
-- ORDER BY status, created_at DESC;

-- 5. 检查评价任务与师徒关系的对应情况
SELECT 
    me.id as evaluation_id,
    me.project_id as evaluation_project_id,
    me.relationship_id,
    mr.id as relationship_exists,
    mr.status as relationship_status,
    mr.project_id as relationship_project_id,
    me.evaluator_type,
    me.status as evaluation_status
FROM mentorship_evaluations me
LEFT JOIN mentorship_relationships mr ON me.relationship_id = mr.id
WHERE mr.id IS NULL  -- 评价存在但师徒关系不存在
   OR mr.status = 'TERMINATED'  -- 评价存在但关系已终止
ORDER BY me.created_at DESC
LIMIT 20;

-- 6. 统计评价任务与师徒关系的对应状况
SELECT 
    '有效关系对应的评价' as category,
    COUNT(*) as count
FROM mentorship_evaluations me
INNER JOIN mentorship_relationships mr ON me.relationship_id = mr.id
WHERE mr.status != 'TERMINATED'

UNION ALL

SELECT 
    '已终止关系对应的评价' as category,
    COUNT(*) as count
FROM mentorship_evaluations me
INNER JOIN mentorship_relationships mr ON me.relationship_id = mr.id
WHERE mr.status = 'TERMINATED'

UNION ALL

SELECT 
    '孤立的评价任务' as category,
    COUNT(*) as count
FROM mentorship_evaluations me
LEFT JOIN mentorship_relationships mr ON me.relationship_id = mr.id
WHERE mr.id IS NULL; 