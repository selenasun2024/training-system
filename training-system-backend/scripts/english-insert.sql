USE training_system;

INSERT IGNORE INTO project_types (id, name, code, description, remind_days, enabled, order_index, is_system) 
VALUES ('type-001', 'New Employee Training', 'NEW_HIRE', 'Training for new employees', 7, TRUE, 1, TRUE);

INSERT IGNORE INTO project_types (id, name, code, description, remind_days, enabled, order_index, is_system) 
VALUES ('type-002', 'Leadership Training', 'LEADERSHIP', 'Training for management staff', 5, TRUE, 2, TRUE);

INSERT IGNORE INTO project_types (id, name, code, description, remind_days, enabled, order_index, is_system) 
VALUES ('type-003', 'Staff Training', 'STAFF_TRAINING', 'Training for general staff', 3, TRUE, 3, TRUE);

INSERT IGNORE INTO project_types (id, name, code, description, remind_days, enabled, order_index, is_system) 
VALUES ('type-004', 'Warrior Training', 'WARRIOR', 'Intensive skill training', 7, TRUE, 4, TRUE);

INSERT IGNORE INTO project_types (id, name, code, description, remind_days, enabled, order_index, is_system) 
VALUES ('type-005', 'SEAL Training', 'SEAL', 'Elite training program', 10, TRUE, 5, TRUE);

SELECT 'Project types created successfully' as message;
SELECT id, name, code FROM project_types; 