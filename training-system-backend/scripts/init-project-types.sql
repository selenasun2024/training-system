-- 培训类型管理数据库初始化脚本
-- 创建时间: 2024-12-09
-- 用途: 建立培训类型相关表结构和初始数据

-- ====================================
-- 1. 创建培训类型表
-- ====================================

CREATE TABLE IF NOT EXISTS project_types (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL COMMENT '类型名称',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '类型编码',
    description TEXT COMMENT '类型描述',
    remind_days INTEGER DEFAULT 7 COMMENT '提醒天数',
    enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    order_index INTEGER DEFAULT 0 COMMENT '排序',
    icon VARCHAR(100) COMMENT '图标',
    color VARCHAR(20) COMMENT '颜色标识',
    
    -- 配置相关
    config JSON DEFAULT ('{}') COMMENT '类型配置',
    stage_template_ids JSON DEFAULT ('[]') COMMENT '关联的阶段模板ID列表',
    task_template_ids JSON DEFAULT ('[]') COMMENT '关联的任务模板ID列表',
    
    -- 筛选规则配置
    filter_rules JSON DEFAULT ('[]') COMMENT '自动筛选规则配置',
    allow_manual_add BOOLEAN DEFAULT TRUE COMMENT '是否允许手动添加学员',
    
    -- 系统字段
    is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统类型',
    created_by VARCHAR(36) COMMENT '创建人',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_code (code),
    INDEX idx_enabled (enabled),
    INDEX idx_order (order_index),
    INDEX idx_system (is_system)
);

-- ====================================
-- 2. 创建培训类型筛选规则表
-- ====================================

CREATE TABLE IF NOT EXISTS project_type_filter_rules (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    project_type_id VARCHAR(36) NOT NULL COMMENT '项目类型ID',
    rule_name VARCHAR(255) NOT NULL COMMENT '规则名称',
    description TEXT COMMENT '规则描述',
    conditions JSON NOT NULL COMMENT '筛选条件',
    priority INTEGER DEFAULT 0 COMMENT '规则优先级',
    enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (project_type_id) REFERENCES project_types(id) ON DELETE CASCADE,
    
    -- 索引
    INDEX idx_project_type (project_type_id),
    INDEX idx_enabled (enabled),
    INDEX idx_priority (priority)
);

-- ====================================
-- 3. 更新项目表添加类型字段
-- ====================================

-- 检查 training_projects 表是否存在 type 字段，如果不存在则添加
SET @exist_type_column = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'training_projects' 
    AND column_name = 'type');

SET @sql = IF(@exist_type_column > 0, 
    'SELECT "type column already exists" as message',
    'ALTER TABLE training_projects ADD COLUMN type VARCHAR(36) AFTER description'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查外键是否存在，如果不存在则添加
SET @exist_fk = (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE table_schema = DATABASE() 
    AND table_name = 'training_projects' 
    AND constraint_name = 'training_projects_type_fkey');

SET @sql = IF(@exist_fk > 0,
    'SELECT "foreign key already exists" as message',
    'ALTER TABLE training_projects ADD CONSTRAINT training_projects_type_fkey FOREIGN KEY (type) REFERENCES project_types(id)'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加索引
SET @exist_idx = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'training_projects' 
    AND index_name = 'idx_type');

SET @sql = IF(@exist_idx > 0,
    'SELECT "index already exists" as message',
    'ALTER TABLE training_projects ADD INDEX idx_type (type)'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ====================================
-- 4. 初始化培训类型数据
-- ====================================

-- 先清空可能存在的测试数据
DELETE FROM project_type_filter_rules WHERE project_type_id IN (
    SELECT id FROM project_types WHERE is_system = TRUE
);
DELETE FROM project_types WHERE is_system = TRUE;

-- 插入系统培训类型
INSERT INTO project_types (id, name, code, description, remind_days, enabled, order_index, is_system, created_by) 
VALUES 
('type-001', '新员工入职培训', 'NEW_HIRE', '针对新入职员工的综合培训项目', 7, TRUE, 1, TRUE, 'admin-001'),
('type-002', '干部入线子培训', 'LEADERSHIP', '面向管理干部的领导力发展培训', 5, TRUE, 2, TRUE, 'admin-001'),
('type-003', '员工入线子培训', 'STAFF_TRAINING', '面向一般员工的技能提升培训', 3, TRUE, 3, TRUE, 'admin-001'),
('type-004', '战狼培训', 'WARRIOR', '高强度业务能力提升培训', 7, TRUE, 4, TRUE, 'admin-001'),
('type-005', '海豹培训', 'SEAL', '精英人才特训项目', 10, TRUE, 5, TRUE, 'admin-001');

-- 插入筛选规则
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
 ), 1, TRUE),

('rule-003', 'type-003', '员工筛选规则', '自动筛选一般员工',
 JSON_OBJECT(
   'conditions', JSON_ARRAY(
     JSON_OBJECT('field', 'level', 'operator', 'in', 'value', 'P4,P5'),
     JSON_OBJECT('field', 'hireDate', 'operator', '>', 'value', '2023-01-01')
   ),
   'allowManualAdd', TRUE
 ), 1, TRUE);

-- ====================================
-- 5. 数据验证
-- ====================================

-- 验证数据插入结果
SELECT 
    COUNT(*) as total_types,
    COUNT(CASE WHEN enabled = TRUE THEN 1 END) as enabled_types,
    COUNT(CASE WHEN is_system = TRUE THEN 1 END) as system_types
FROM project_types;

SELECT 
    COUNT(*) as total_rules,
    COUNT(CASE WHEN enabled = TRUE THEN 1 END) as enabled_rules
FROM project_type_filter_rules;

-- 显示创建的类型
SELECT id, name, code, remind_days, order_index, enabled, is_system FROM project_types ORDER BY order_index;

-- 显示筛选规则
SELECT 
    r.rule_name,
    t.name as type_name,
    r.priority,
    r.enabled
FROM project_type_filter_rules r 
JOIN project_types t ON r.project_type_id = t.id 
ORDER BY t.order_index, r.priority;

COMMIT; 