-- 快速修复用户ID不匹配问题
-- 将数据库中的UUID格式ID更新为代码期望的简单格式

USE training_system;

-- 更新用户表中的ID
UPDATE users 
SET id = 'user-admin-001' 
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE users 
SET id = 'user-teacher-001' 
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

UPDATE users 
SET id = 'user-counselor-001' 
WHERE id = '550e8400-e29b-41d4-a716-446655440003';

-- 更新用户角色表中的相关ID
UPDATE user_roles 
SET user_id = 'user-admin-001' 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE user_roles 
SET user_id = 'user-teacher-001' 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440002';

UPDATE user_roles 
SET user_id = 'user-counselor-001' 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440003';

UPDATE user_roles 
SET granted_by = 'user-admin-001' 
WHERE granted_by = '550e8400-e29b-41d4-a716-446655440001';

-- 更新模板表中的创建者ID
UPDATE stage_templates 
SET created_by = 'user-admin-001' 
WHERE created_by = '550e8400-e29b-41d4-a716-446655440001';

UPDATE task_templates 
SET created_by = 'user-admin-001' 
WHERE created_by = '550e8400-e29b-41d4-a716-446655440001';

-- 检查更新结果
SELECT id, username, name FROM users; 