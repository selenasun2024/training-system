-- 直接插入培训类型数据
USE training_system;

-- 插入培训类型（不使用外键约束的created_by字段）
INSERT IGNORE INTO project_types (
    id, name, code, description, remind_days, enabled, order_index, 
    icon, color, config, stage_template_ids, task_template_ids, 
    filter_rules, allow_manual_add, is_system, created_by
) VALUES 
('type-001', '新员工入职培训', 'NEW_HIRE', '针对新入职员工的综合培训项目', 7, TRUE, 1, 
 NULL, NULL, '{}', '[]', '[]', 
 '[]', TRUE, TRUE, NULL),
('type-002', '干部入线子培训', 'LEADERSHIP', '面向管理干部的领导力发展培训', 5, TRUE, 2, 
 NULL, NULL, '{}', '[]', '[]', 
 '[]', TRUE, TRUE, NULL),
('type-003', '员工入线子培训', 'STAFF_TRAINING', '面向一般员工的技能提升培训', 3, TRUE, 3, 
 NULL, NULL, '{}', '[]', '[]', 
 '[]', TRUE, TRUE, NULL),
('type-004', '战狼培训', 'WARRIOR', '高强度业务能力提升培训', 7, TRUE, 4, 
 NULL, NULL, '{}', '[]', '[]', 
 '[]', TRUE, TRUE, NULL),
('type-005', '海豹培训', 'SEAL', '精英人才特训项目', 10, TRUE, 5, 
 NULL, NULL, '{}', '[]', '[]', 
 '[]', TRUE, TRUE, NULL);

-- 验证插入结果
SELECT '=== 培训类型创建成功 ===' as message;
SELECT id, name, code, enabled, order_index FROM project_types ORDER BY order_index;
SELECT COUNT(*) as total_count FROM project_types;

-- 查看表结构
SELECT '=== 表结构信息 ===' as message;
DESCRIBE project_types; 