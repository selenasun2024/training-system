-- 清空现有用户表（可选，请谨慎操作！）
-- DELETE FROM `users`;

-- 插入15名不同部门、职级和入职日期的用户
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `name`, `department`, `position`, `level`, `hire_date`, `status`, `created_at`, `updated_at`) VALUES
('user-tech-001', 'zhangwei', 'zhangwei@example.com', '$2b$10$placeholderhashfortesting123', '张伟', '技术部', '高级软件工程师', 'P7', '2022-08-15 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-tech-002', 'li-na', 'lina@example.com', '$2b$10$placeholderhashfortesting123', '李娜', '技术部', '前端工程师', 'P6', '2023-03-20 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-tech-003', 'wang-chao', 'wangchao@example.com', '$2b$10$placeholderhashfortesting123', '王超', '技术部', '后端工程师', 'P6', '2023-03-20 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-tech-004', 'chen-li', 'chenli@example.com', '$2b$10$placeholderhashfortesting123', '陈丽', '技术部', '测试工程师', 'P5', '2023-09-01 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-tech-005', 'liu-yang', 'liuyang@example.com', '$2b$10$placeholderhashfortesting123', '刘洋', '技术部', '运维工程师', 'P6', '2022-11-10 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-prod-001', 'zhao-min', 'zhaomin@example.com', '$2b$10$placeholderhashfortesting123', '赵敏', '产品部', '高级产品经理', 'P7', '2022-05-10 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-prod-002', 'sun-yue', 'sunyue@example.com', '$2b$10$placeholderhashfortesting123', '孙悦', '产品部', '产品经理', 'P6', '2023-07-18 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-prod-003', 'zhou-jie', 'zhoujie@example.com', '$2b$10$placeholderhashfortesting123', '周杰', '产品部', 'UI设计师', 'P6', '2023-02-25 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-market-001', 'wu-jing', 'wujing@example.com', '$2b$10$placeholderhashfortesting123', '吴静', '市场部', '市场总监', 'M3', '2021-11-01 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-market-002', 'qian-feng', 'qianfeng@example.com', '$2b$10$placeholderhashfortesting123', '钱峰', '市场部', '市场专员', 'M1', '2023-08-01 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-market-003', 'ma-li', 'mali@example.com', '$2b$10$placeholderhashfortesting123', '马丽', '市场部', '内容运营', 'M2', '2023-05-15 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-hr-001', 'feng-qin', 'fengqin@example.com', '$2b$10$placeholderhashfortesting123', '冯芹', '人事部', '招聘经理', 'H2', '2022-09-20 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-hr-002', 'yuan-fang', 'yuanfang@example.com', '$2b$10$placeholderhashfortesting123', '袁芳', '人事部', '薪酬专员', 'H1', '2023-10-10 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-hr-003', 'deng-yaping', 'dengyaping@example.com', '$2b$10$placeholderhashfortesting123', '邓亚萍', '人事部', '员工关系专员', 'H1', '2024-01-15 00:00:00', 'ACTIVE', NOW(), NOW()),
('user-admin-001', 'admin', 'admin@example.com', '$2b$10$placeholderhashfortesting123', '系统管理员', '管理部', '系统管理员', 'ADMIN', '2020-01-01 00:00:00', 'ACTIVE', NOW(), NOW()); 