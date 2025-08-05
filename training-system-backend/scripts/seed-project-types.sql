-- 培训类型初始数据插入
INSERT INTO project_types (
    id, name, code, description, remind_days, enabled, order_index, 
    icon, color, config, stage_template_ids, task_template_ids, 
    filter_rules, allow_manual_add, is_system, created_by
) 
VALUES 
('type-001', '新员工入职培训', 'NEW_HIRE', '针对新入职员工的综合培训项目', 7, TRUE, 1, 
 NULL, NULL, JSON_OBJECT(), JSON_ARRAY(), JSON_ARRAY(), 
 JSON_ARRAY(), TRUE, TRUE, 'admin-001'),
('type-002', '干部入线子培训', 'LEADERSHIP', '面向管理干部的领导力发展培训', 5, TRUE, 2, 
 NULL, NULL, JSON_OBJECT(), JSON_ARRAY(), JSON_ARRAY(), 
 JSON_ARRAY(), TRUE, TRUE, 'admin-001'),
('type-003', '员工入线子培训', 'STAFF_TRAINING', '面向一般员工的技能提升培训', 3, TRUE, 3, 
 NULL, NULL, JSON_OBJECT(), JSON_ARRAY(), JSON_ARRAY(), 
 JSON_ARRAY(), TRUE, TRUE, 'admin-001'),
('type-004', '战狼培训', 'WARRIOR', '高强度业务能力提升培训', 7, TRUE, 4, 
 NULL, NULL, JSON_OBJECT(), JSON_ARRAY(), JSON_ARRAY(), 
 JSON_ARRAY(), TRUE, TRUE, 'admin-001'),
('type-005', '海豹培训', 'SEAL', '精英人才特训项目', 10, TRUE, 5, 
 NULL, NULL, JSON_OBJECT(), JSON_ARRAY(), JSON_ARRAY(), 
 JSON_ARRAY(), TRUE, TRUE, 'admin-001');

-- 培训类型筛选规则初始数据
INSERT INTO project_type_filter_rules (id, project_type_id, rule_name, description, conditions, priority, enabled)
VALUES 
('rule-001', 'type-001', '新员工筛选规则', '自动筛选新入职员工', 
 JSON_OBJECT(
   'conditions', JSON_ARRAY(
     JSON_OBJECT('field', 'department', 'operator', '=', 'value', 'Development'),
     JSON_OBJECT('field', 'level', 'operator', 'in', 'value', 'P4,P5,P6')
   ), 
   'allowManualAdd', TRUE
 ), 1, TRUE),

('rule-002', 'type-002', '干部筛选规则', '自动筛选管理干部',
 JSON_OBJECT(
   'conditions', JSON_ARRAY(
     JSON_OBJECT('field', 'department', 'operator', 'in', 'value', 'Development,Product'),
     JSON_OBJECT('field', 'level', 'operator', 'in', 'value', 'P6,P7')
   ),
   'allowManualAdd', TRUE
 ), 1, TRUE);

-- 验证插入结果
SELECT '=== 培训类型创建成功 ===' as message;
SELECT id, name, code, enabled FROM project_types ORDER BY order_index; 