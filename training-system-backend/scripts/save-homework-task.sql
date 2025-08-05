-- ============================================
-- 保存"AI岗位个人能力分析"作业任务到数据库
-- ============================================

-- 查看现有项目信息
SELECT id, name, project_no FROM training_projects WHERE name LIKE '%新员工%' OR project_no LIKE '%TP2025070003%';

-- 查看项目的阶段信息
SELECT s.id, s.name, s.type, s.project_id 
FROM training_stages s 
JOIN training_projects p ON s.project_id = p.id 
WHERE p.project_no = 'TP2025070003' OR p.name LIKE '%新员工%';

-- 保存"AI岗位个人能力分析"作业任务
-- 注意：请根据上面查询结果替换实际的project_id和stage_id
INSERT INTO training_tasks (
    id,
    project_id, 
    stage_id,
    name,
    description,
    type,
    status,
    required,
    order_index,
    config,
    reviewer_role,
    due_date,
    estimated_hours,
    created_at,
    updated_at
) VALUES (
    UUID(),
    '4bcf4bb2-2b78-4408-9687-e515cbff5da8', -- 项目ID，需要根据实际情况调整
    (SELECT id FROM training_stages WHERE project_id = '4bcf4bb2-2b78-4408-9687-e515cbff5da8' AND type = 'DURING' LIMIT 1), -- 培训中阶段ID
    'AI岗位个人能力分析',
    '请结合自己的岗位职责，分析AI技术对你工作的影响，并制定个人能力提升计划。要求：1）分析现有技能与AI的结合点；2）识别需要提升的能力；3）制定具体的学习计划。',
    'homework',
    'ACTIVE',
    true,
    0,
    JSON_OBJECT(
        'totalScore', 100,
        'reviewType', 'counselor',
        'attachments', JSON_ARRAY(),
        'onsiteDisplay', false,
        'estimatedHours', 3,
        'tags', JSON_ARRAY('实践', '提交'),
        'color', 'warning'
    ),
    'COUNSELOR',
    '2025-07-16 23:59:59',
    3,
    NOW(),
    NOW()
);

-- 验证任务是否创建成功
SELECT 
    t.id,
    t.name,
    t.type,
    t.status,
    t.reviewer_role,
    t.due_date,
    p.name as project_name,
    s.name as stage_name
FROM training_tasks t
JOIN training_projects p ON t.project_id = p.id
JOIN training_stages s ON t.stage_id = s.id
WHERE t.name = 'AI岗位个人能力分析'; 