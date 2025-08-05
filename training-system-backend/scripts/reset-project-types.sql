-- 清理项目类型数据
DELETE FROM project_types;

-- 插入正确的项目类型数据  
INSERT INTO project_types (
  id, 
  name, 
  code, 
  description, 
  remind_days, 
  enabled, 
  order_index, 
  is_system, 
  created_at, 
  updated_at
) VALUES 
('type-001', '新员工入职培训', 'NEW_HIRE', '新员工入职培训项目', 7, 1, 1, 0, NOW(), NOW()),
('type-002', '干部入线子培训', 'LEADERSHIP', '干部入线子培训项目', 5, 1, 2, 0, NOW(), NOW()),
('type-003', '员工入线子培训', 'STAFF_TRAINING', '员工入线子培训项目', 3, 1, 3, 0, NOW(), NOW()),
('type-004', '战狼培训', 'WARRIOR', '战狼培训项目', 7, 1, 4, 0, NOW(), NOW()),
('type-005', '海豹培训', 'SEAL', '海豹培训项目', 10, 1, 5, 0, NOW(), NOW());

-- 检查插入结果
SELECT id, name, code, remind_days, enabled, order_index, created_at, updated_at 
FROM project_types 
ORDER BY order_index; 