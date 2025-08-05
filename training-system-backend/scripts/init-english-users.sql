-- 初始化英文用户数据
DELETE FROM user_roles;
DELETE FROM users;

INSERT INTO users (id, username, email, password_hash, name, department, position, level, hire_date, status, updated_at) 
VALUES ('user-admin-001', 'admin', 'admin@company.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye8k6Fz.y5a6M/c7.7K1pQyI7dZJg7VhG', 'Admin', 'IT', 'System Admin', 'P8', '2020-01-01', 'ACTIVE', NOW());

INSERT INTO users (id, username, email, password_hash, name, department, position, level, hire_date, status, updated_at) 
VALUES ('user-teacher-001', 'teacher01', 'teacher01@company.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye8k6Fz.y5a6M/c7.7K1pQyI7dZJg7VhG', 'Teacher Zhang', 'Training', 'Senior Trainer', 'P7', '2021-03-15', 'ACTIVE', NOW());

INSERT INTO users (id, username, email, password_hash, name, department, position, level, hire_date, status, updated_at) 
VALUES ('user-teacher-002', 'teacher02', 'teacher02@company.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye8k6Fz.y5a6M/c7.7K1pQyI7dZJg7VhG', 'Teacher Li', 'Training', 'Trainer', 'P6', '2022-05-20', 'ACTIVE', NOW());

INSERT INTO users (id, username, email, password_hash, name, department, position, level, hire_date, status, updated_at) 
VALUES ('user-student-001', 'sunyi', 'sunyi@company.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye8k6Fz.y5a6M/c7.7K1pQyI7dZJg7VhG', 'Sun Yi', 'Development', 'Senior Engineer', 'P6', '2023-05-20', 'ACTIVE', NOW());

INSERT INTO users (id, username, email, password_hash, name, department, position, level, hire_date, status, updated_at) 
VALUES ('user-student-002', 'lier', 'lier@company.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye8k6Fz.y5a6M/c7.7K1pQyI7dZJg7VhG', 'Li Er', 'Product', 'Product Manager', 'P6', '2022-08-15', 'ACTIVE', NOW());

INSERT INTO users (id, username, email, password_hash, name, department, position, level, hire_date, status, updated_at) 
VALUES ('user-student-003', 'zhousan', 'zhousan@company.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye8k6Fz.y5a6M/c7.7K1pQyI7dZJg7VhG', 'Zhou San', 'Marketing', 'Marketing Specialist', 'P4', '2024-01-10', 'ACTIVE', NOW());

INSERT INTO users (id, username, email, password_hash, name, department, position, level, hire_date, status, updated_at) 
VALUES ('user-student-004', 'wusi', 'wusi@company.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye8k6Fz.y5a6M/c7.7K1pQyI7dZJg7VhG', 'Wu Si', 'Development', 'Architect', 'P7', '2021-11-30', 'ACTIVE', NOW());

INSERT INTO users (id, username, email, password_hash, name, department, position, level, hire_date, status, updated_at) 
VALUES ('user-student-005', 'zhengwu', 'zhengwu@company.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye8k6Fz.y5a6M/c7.7K1pQyI7dZJg7VhG', 'Zheng Wu', 'Development', 'Engineer', 'P5', '2024-03-01', 'ACTIVE', NOW());

-- 插入用户角色
INSERT INTO user_roles (id, user_id, role_name, granted_by) 
VALUES ('role-admin-001', 'user-admin-001', 'admin', 'user-admin-001');

INSERT INTO user_roles (id, user_id, role_name, granted_by) 
VALUES ('role-teacher-001', 'user-teacher-001', 'teacher', 'user-admin-001');

INSERT INTO user_roles (id, user_id, role_name, granted_by) 
VALUES ('role-teacher-002', 'user-teacher-002', 'teacher', 'user-admin-001');

INSERT INTO user_roles (id, user_id, role_name, granted_by) 
VALUES ('role-student-001', 'user-student-001', 'student', 'user-admin-001');

INSERT INTO user_roles (id, user_id, role_name, granted_by) 
VALUES ('role-student-002', 'user-student-002', 'student', 'user-admin-001');

INSERT INTO user_roles (id, user_id, role_name, granted_by) 
VALUES ('role-student-003', 'user-student-003', 'student', 'user-admin-001');

INSERT INTO user_roles (id, user_id, role_name, granted_by) 
VALUES ('role-student-004', 'user-student-004', 'student', 'user-admin-001');

INSERT INTO user_roles (id, user_id, role_name, granted_by) 
VALUES ('role-student-005', 'user-student-005', 'student', 'user-admin-001'); 