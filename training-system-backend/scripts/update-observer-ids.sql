-- 更新观察记录中的观察者ID
-- 将硬编码的 counselor-001 更新为真实存在的辅导员ID user-hr-001

UPDATE observation_records 
SET observer_id = 'user-hr-001' 
WHERE observer_id = 'counselor-001';

-- 查看更新结果
SELECT 
    COUNT(*) as total_records,
    observer_id,
    project_id
FROM observation_records 
GROUP BY observer_id, project_id
ORDER BY observer_id, project_id; 