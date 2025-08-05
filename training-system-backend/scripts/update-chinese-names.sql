USE training_system;

-- 删除测试数据
DELETE FROM project_types WHERE id = 'direct-001';

-- 更新为中文名称
UPDATE project_types SET 
    name = '新员工入职培训',
    description = '针对新入职员工的综合培训项目'
WHERE id = 'type-001';

UPDATE project_types SET 
    name = '干部入线子培训',
    description = '面向管理干部的领导力发展培训'
WHERE id = 'type-002';

UPDATE project_types SET 
    name = '员工入线子培训',
    description = '面向一般员工的技能提升培训'
WHERE id = 'type-003';

UPDATE project_types SET 
    name = '战狼培训',
    description = '高强度业务能力提升培训'
WHERE id = 'type-004';

UPDATE project_types SET 
    name = '海豹培训',
    description = '精英人才特训项目'
WHERE id = 'type-005';

-- 验证更新结果
SELECT 'Updated to Chinese names successfully' as message;
SELECT id, name, code, enabled, order_index FROM project_types ORDER BY order_index; 