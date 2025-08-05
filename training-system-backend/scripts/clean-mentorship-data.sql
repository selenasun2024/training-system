-- 师徒关系数据清理脚本
-- ⚠️ 执行前请先备份数据库！
-- ⚠️ 请根据实际情况谨慎执行以下语句

-- 1. 清理孤立的评价任务（对应的师徒关系不存在）
-- 先查看要删除的数据
SELECT 
    me.id,
    me.relationship_id,
    me.evaluator_type,
    me.status,
    me.created_at
FROM mentorship_evaluations me
LEFT JOIN mentorship_relationships mr ON me.relationship_id = mr.id
WHERE mr.id IS NULL;

-- 执行删除（取消注释后执行）
-- DELETE me FROM mentorship_evaluations me
-- LEFT JOIN mentorship_relationships mr ON me.relationship_id = mr.id
-- WHERE mr.id IS NULL;

-- 2. 清理已终止关系对应的评价任务
-- 先查看要删除的数据
SELECT 
    me.id,
    me.relationship_id,
    mr.status,
    mr.termination_date,
    me.evaluator_type,
    me.status as evaluation_status
FROM mentorship_evaluations me
INNER JOIN mentorship_relationships mr ON me.relationship_id = mr.id
WHERE mr.status = 'TERMINATED';

-- 执行删除（取消注释后执行）
-- DELETE me FROM mentorship_evaluations me
-- INNER JOIN mentorship_relationships mr ON me.relationship_id = mr.id
-- WHERE mr.status = 'TERMINATED';

-- 3. 修复已终止但缺少终止日期的关系
-- 先查看要修复的数据
SELECT 
    id,
    mentor_name,
    student_name,
    status,
    termination_date,
    updated_at
FROM mentorship_relationships 
WHERE status = 'TERMINATED' AND termination_date IS NULL;

-- 执行修复（取消注释后执行）
-- UPDATE mentorship_relationships 
-- SET termination_date = updated_at,
--     termination_reason = COALESCE(termination_reason, '数据修复')
-- WHERE status = 'TERMINATED' AND termination_date IS NULL;

-- 4. 清理状态异常的师徒关系
-- 先查看异常数据
SELECT 
    id,
    mentor_name,
    student_name,
    status,
    created_at
FROM mentorship_relationships 
WHERE status IS NULL 
   OR status NOT IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED');

-- 根据实际情况决定处理方式：
-- 选项A：设为TERMINATED（取消注释后执行）
-- UPDATE mentorship_relationships 
-- SET status = 'TERMINATED',
--     termination_date = NOW(),
--     termination_reason = '数据修复-状态异常',
--     updated_at = NOW()
-- WHERE status IS NULL 
--    OR status NOT IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED');

-- 选项B：物理删除（谨慎使用）
-- DELETE FROM mentorship_relationships 
-- WHERE status IS NULL 
--    OR status NOT IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED');

-- 5. 统计清理后的数据
SELECT 
    'mentorship_relationships' as table_name,
    status,
    COUNT(*) as count
FROM mentorship_relationships 
GROUP BY status

UNION ALL

SELECT 
    'mentorship_evaluations' as table_name,
    status,
    COUNT(*) as count
FROM mentorship_evaluations 
GROUP BY status
ORDER BY table_name, status; 