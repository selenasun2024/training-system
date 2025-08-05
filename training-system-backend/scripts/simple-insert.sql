USE training_system;

INSERT IGNORE INTO project_types (id, name, code, description, remind_days, enabled, order_index, is_system) 
VALUES ('type-001', '新员工入职培训', 'NEW_HIRE', '针对新入职员工的综合培训项目', 7, TRUE, 1, TRUE);

INSERT IGNORE INTO project_types (id, name, code, description, remind_days, enabled, order_index, is_system) 
VALUES ('type-002', '干部入线子培训', 'LEADERSHIP', '面向管理干部的领导力发展培训', 5, TRUE, 2, TRUE);

INSERT IGNORE INTO project_types (id, name, code, description, remind_days, enabled, order_index, is_system) 
VALUES ('type-003', '员工入线子培训', 'STAFF_TRAINING', '面向一般员工的技能提升培训', 3, TRUE, 3, TRUE);

INSERT IGNORE INTO project_types (id, name, code, description, remind_days, enabled, order_index, is_system) 
VALUES ('type-004', '战狼培训', 'WARRIOR', '高强度业务能力提升培训', 7, TRUE, 4, TRUE);

INSERT IGNORE INTO project_types (id, name, code, description, remind_days, enabled, order_index, is_system) 
VALUES ('type-005', '海豹培训', 'SEAL', '精英人才特训项目', 10, TRUE, 5, TRUE);

SELECT 'Project types created successfully' as message;
SELECT id, name, code FROM project_types; 