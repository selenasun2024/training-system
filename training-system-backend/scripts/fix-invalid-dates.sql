-- 修复project_types表中的无效日期
UPDATE project_types 
SET 
  created_at = NOW(),
  updated_at = NOW()
WHERE 
  created_at = '0000-00-00 00:00:00' 
  OR updated_at = '0000-00-00 00:00:00'
  OR created_at IS NULL 
  OR updated_at IS NULL;

-- 检查修复结果
SELECT id, name, created_at, updated_at FROM project_types; 