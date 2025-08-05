-- =====================================================
-- 全局用户档案数据库表创建脚本
-- 创建时间: 2024年12月
-- 说明: 基于前端GrowthProfile类型设计的完整数据库架构
-- 架构: 多表关系+JSON扩展的混合模式
-- =====================================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. 主表：user_growth_profiles（全局用户档案）
-- =====================================================

-- 全局用户档案主表（一个用户一个档案）
CREATE TABLE user_growth_profiles (
    id VARCHAR(36) COLLATE utf8mb4_unicode_ci PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE COMMENT '用户ID（全局档案，移除project_id）',
    
    -- 基本信息（从前端GrowthProfile提取）
    user_name VARCHAR(100) NOT NULL COMMENT '用户姓名',
    department VARCHAR(100) COMMENT '部门',
    position VARCHAR(100) COMMENT '职位',
    entry_date DATE COMMENT '入职日期',
    current_level ENUM('junior', 'intermediate', 'senior', 'expert') DEFAULT 'junior' COMMENT '当前级别',
    
    -- 核心统计数据（便于查询）
    total_training_projects INTEGER DEFAULT 0 COMMENT '培训项目总数',
    completed_training_projects INTEGER DEFAULT 0 COMMENT '已完成培训项目',
    total_mentorship_projects INTEGER DEFAULT 0 COMMENT '带教项目总数',
    total_achievements INTEGER DEFAULT 0 COMMENT '成就总数',
    total_skills INTEGER DEFAULT 0 COMMENT '技能总数',
    total_goals INTEGER DEFAULT 0 COMMENT '目标总数',
    average_rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '平均评分',
    
    -- 复杂数据用JSON存储（保持灵活性）
    statistics JSON DEFAULT ('{}') COMMENT '详细统计信息 (GrowthStatistics)',
    profile_config JSON DEFAULT ('{}') COMMENT '档案配置 (GrowthProfileConfig)',
    
    -- 元数据
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 外键和索引
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_department (department),
    INDEX idx_position (position),
    INDEX idx_level (current_level),
    INDEX idx_updated (last_updated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='全局用户成长档案主表';

-- =====================================================
-- 2. 成长时间线事件表：growth_timeline_events
-- =====================================================

-- 成长时间线事件表（支持高效的时间查询和分页）
CREATE TABLE growth_timeline_events (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    profile_id VARCHAR(36) NOT NULL COMMENT '档案ID',
    
    -- 事件基本信息
    event_date DATE NOT NULL COMMENT '事件日期',
    type ENUM('training', 'mentorship', 'achievement', 'milestone', 'feedback', 'goal', 'assessment') NOT NULL COMMENT '事件类型',
    category ENUM('learning', 'development', 'recognition', 'relationship', 'skill', 'career') NOT NULL COMMENT '事件分类',
    
    -- 事件内容
    title VARCHAR(255) NOT NULL COMMENT '事件标题',
    description TEXT COMMENT '事件描述',
    
    -- 关联信息
    related_project_id VARCHAR(36) COMMENT '关联项目ID',
    related_project_type ENUM('training', 'mentorship') COMMENT '关联项目类型',
    
    -- 事件属性
    importance ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT '重要性级别',
    tags JSON DEFAULT ('[]') COMMENT '事件标签',
    attachments JSON DEFAULT ('[]') COMMENT '附件列表',
    rating INTEGER COMMENT '评分（如果适用）',
    
    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 外键和索引
    FOREIGN KEY (profile_id) REFERENCES user_growth_profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_date (profile_id, event_date DESC),
    INDEX idx_type_category (type, category),
    INDEX idx_importance (importance)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成长时间线事件表';

-- =====================================================
-- 3. 技能发展表：growth_skills
-- =====================================================

-- 技能发展表（支持技能轨迹跟踪）
CREATE TABLE growth_skills (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    profile_id VARCHAR(36) NOT NULL COMMENT '档案ID',
    
    -- 技能基本信息
    skill_name VARCHAR(100) NOT NULL COMMENT '技能名称',
    skill_category ENUM('technical', 'soft', 'leadership', 'domain') NOT NULL COMMENT '技能分类',
    
    -- 技能水平
    current_level INTEGER NOT NULL DEFAULT 1 COMMENT '当前级别',
    target_level INTEGER COMMENT '目标级别',
    max_level INTEGER DEFAULT 5 COMMENT '最高级别',
    
    -- 发展信息
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium' COMMENT '优先级',
    last_assessed DATE COMMENT '最后评估日期',
    next_assessment DATE COMMENT '下次评估日期',
    
    -- 扩展数据（JSON存储复杂结构）
    progress_history JSON DEFAULT ('[]') COMMENT '进度历史 (SkillProgressRecord[])',
    learning_path JSON DEFAULT ('[]') COMMENT '学习路径 (SkillLearningPath[])',
    validations JSON DEFAULT ('[]') COMMENT '技能验证记录 (SkillValidation[])',
    
    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 外键和索引
    FOREIGN KEY (profile_id) REFERENCES user_growth_profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_category (profile_id, skill_category),
    INDEX idx_skill_name (skill_name),
    INDEX idx_priority (priority),
    INDEX idx_level (current_level, target_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='技能发展轨迹表';

-- =====================================================
-- 4. 成就记录表：growth_achievements
-- =====================================================

-- 成就记录表（支持成就展示和验证）
CREATE TABLE growth_achievements (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    profile_id VARCHAR(36) NOT NULL COMMENT '档案ID',
    
    -- 成就基本信息
    achievement_type ENUM('milestone', 'certification', 'recognition', 'project_completion', 'skill_mastery') NOT NULL COMMENT '成就类型',
    title VARCHAR(255) NOT NULL COMMENT '成就标题',
    description TEXT COMMENT '成就描述',
    achievement_date DATE NOT NULL COMMENT '获得日期',
    
    -- 来源信息
    source ENUM('training', 'mentorship', 'work', 'external') NOT NULL COMMENT '成就来源',
    source_id VARCHAR(36) COMMENT '来源ID（项目ID等）',
    
    -- 成就级别和验证
    level ENUM('bronze', 'silver', 'gold', 'platinum') NOT NULL COMMENT '成就级别',
    verified BOOLEAN DEFAULT FALSE COMMENT '是否已验证',
    verifier_id VARCHAR(36) COMMENT '验证人ID',
    verifier_name VARCHAR(100) COMMENT '验证人姓名',
    
    -- 影响和展示
    skill_impact JSON DEFAULT ('[]') COMMENT '技能影响',
    career_impact TEXT COMMENT '职业影响',
    visible BOOLEAN DEFAULT TRUE COMMENT '是否可见',
    featured BOOLEAN DEFAULT FALSE COMMENT '是否推荐展示',
    
    -- 证书信息
    certificate_url VARCHAR(500) COMMENT '证书链接',
    badge_url VARCHAR(500) COMMENT '徽章链接',
    
    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 外键和索引
    FOREIGN KEY (profile_id) REFERENCES user_growth_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (verifier_id) REFERENCES users(id),
    INDEX idx_profile_type (profile_id, achievement_type),
    INDEX idx_date (achievement_date DESC),
    INDEX idx_level (level),
    INDEX idx_featured (featured, visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成就记录表';

-- =====================================================
-- 5. 成长目标表：growth_goals
-- =====================================================

-- 成长目标表（支持目标管理和进度跟踪）
CREATE TABLE growth_goals (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    profile_id VARCHAR(36) NOT NULL COMMENT '档案ID',
    
    -- 目标基本信息
    title VARCHAR(255) NOT NULL COMMENT '目标标题',
    description TEXT COMMENT '目标描述',
    category ENUM('skill', 'career', 'leadership', 'knowledge', 'network') NOT NULL COMMENT '目标分类',
    
    -- 时间管理
    start_date DATE NOT NULL COMMENT '开始日期',
    target_date DATE NOT NULL COMMENT '目标日期',
    completed_date DATE COMMENT '完成日期',
    
    -- 状态和进度
    status ENUM('draft', 'active', 'completed', 'cancelled', 'overdue') DEFAULT 'draft' COMMENT '目标状态',
    progress INTEGER DEFAULT 0 COMMENT '进度百分比 0-100',
    
    -- 衡量和计划（JSON存储复杂结构）
    metrics JSON DEFAULT ('[]') COMMENT '衡量指标 (GoalMetric[])',
    action_plan JSON DEFAULT ('[]') COMMENT '行动计划 (ActionPlan[])',
    milestones JSON DEFAULT ('[]') COMMENT '里程碑 (GoalMilestone[])',
    support_resources JSON DEFAULT ('[]') COMMENT '支持资源',
    
    -- 导师支持
    mentor_id VARCHAR(36) COMMENT '导师ID',
    mentor_name VARCHAR(100) COMMENT '导师姓名',
    mentor_support_type ENUM('guidance', 'review', 'coaching') COMMENT '支持类型',
    
    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 外键和索引
    FOREIGN KEY (profile_id) REFERENCES user_growth_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id),
    INDEX idx_profile_status (profile_id, status),
    INDEX idx_category (category),
    INDEX idx_target_date (target_date),
    INDEX idx_progress (progress)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成长目标表';

-- =====================================================
-- 6. 反馈记录表：growth_feedback
-- =====================================================

-- 反馈记录表（支持360度反馈收集）
CREATE TABLE growth_feedback (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    profile_id VARCHAR(36) NOT NULL COMMENT '档案ID',
    
    -- 反馈基本信息
    feedback_type ENUM('mentor', 'peer', 'manager', 'instructor', 'self', '360_review') NOT NULL COMMENT '反馈类型',
    title VARCHAR(255) NOT NULL COMMENT '反馈标题',
    content TEXT NOT NULL COMMENT '反馈内容',
    
    -- 反馈提供者
    provider_id VARCHAR(36) COMMENT '反馈提供者ID',
    provider_name VARCHAR(100) NOT NULL COMMENT '反馈提供者姓名',
    provider_role VARCHAR(50) COMMENT '提供者角色',
    
    -- 评分和分类
    rating INTEGER COMMENT '评分（1-10）',
    categories JSON DEFAULT ('[]') COMMENT '反馈分类',
    tags JSON DEFAULT ('[]') COMMENT '反馈标签',
    
    -- 关联信息
    related_project_id VARCHAR(36) COMMENT '关联项目ID',
    related_event_id VARCHAR(36) COMMENT '关联事件ID',
    
    -- 可见性和状态
    visibility ENUM('private', 'shared', 'public') DEFAULT 'shared' COMMENT '可见性',
    status ENUM('draft', 'submitted', 'acknowledged') DEFAULT 'submitted' COMMENT '状态',
    acknowledged_at TIMESTAMP COMMENT '确认时间',
    
    -- 元数据
    feedback_date DATE NOT NULL COMMENT '反馈日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 外键和索引
    FOREIGN KEY (profile_id) REFERENCES user_growth_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES users(id),
    INDEX idx_profile_type (profile_id, feedback_type),
    INDEX idx_provider (provider_id),
    INDEX idx_rating (rating),
    INDEX idx_date (feedback_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='反馈记录表';

-- =====================================================
-- 7. 培训历史表：growth_training_history
-- =====================================================

-- 培训历史表（关联培训项目历史）
CREATE TABLE growth_training_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    profile_id VARCHAR(36) NOT NULL COMMENT '档案ID',
    
    -- 培训项目信息
    project_id VARCHAR(36) NOT NULL COMMENT '培训项目ID',
    project_name VARCHAR(255) NOT NULL COMMENT '项目名称',
    project_type ENUM('onboarding', 'skills', 'leadership', 'certification', 'custom') NOT NULL COMMENT '项目类型',
    
    -- 时间信息
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    
    -- 状态和成果
    status ENUM('enrolled', 'active', 'completed', 'dropped', 'suspended') NOT NULL COMMENT '参与状态',
    final_score INTEGER COMMENT '最终成绩',
    completion_rate DECIMAL(5,2) COMMENT '完成率',
    
    -- 培训成果
    certifications_obtained JSON DEFAULT ('[]') COMMENT '获得认证',
    skills_learned JSON DEFAULT ('[]') COMMENT '学习技能',
    
    -- 反馈信息
    instructor_feedback TEXT COMMENT '讲师反馈',
    self_reflection TEXT COMMENT '自我反思',
    
    -- 带教相关
    had_mentorship BOOLEAN DEFAULT FALSE COMMENT '是否有带教',
    mentor_name VARCHAR(100) COMMENT '导师姓名',
    mentorship_feedback TEXT COMMENT '带教反馈',
    
    -- 项目影响
    impact_areas JSON DEFAULT ('[]') COMMENT '影响领域',
    
    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 外键和索引
    FOREIGN KEY (profile_id) REFERENCES user_growth_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES training_projects(id),
    INDEX idx_profile_status (profile_id, status),
    INDEX idx_project_type (project_type),
    INDEX idx_completion_date (end_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='培训历史表';

-- =====================================================
-- 8. 带教历史表：growth_mentorship_history
-- =====================================================

-- 带教历史表（师徒关系历史记录）
CREATE TABLE growth_mentorship_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    profile_id VARCHAR(36) NOT NULL COMMENT '档案ID',
    
    -- 带教项目信息
    project_id VARCHAR(36) COMMENT '带教项目ID',
    project_name VARCHAR(255) NOT NULL COMMENT '项目名称',
    role ENUM('student', 'mentor') NOT NULL COMMENT '角色（学员/导师）',
    
    -- 参与者信息
    mentor_id VARCHAR(36) NOT NULL COMMENT '导师ID',
    mentor_name VARCHAR(100) NOT NULL COMMENT '导师姓名',
    student_id VARCHAR(36) NOT NULL COMMENT '学员ID',
    student_name VARCHAR(100) NOT NULL COMMENT '学员姓名',
    
    -- 时间信息
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    
    -- 状态和成果
    status ENUM('active', 'completed', 'paused', 'cancelled') NOT NULL COMMENT '状态',
    overall_rating INTEGER COMMENT '总体评分（1-10）',
    
    -- 来源信息
    source_type ENUM('training_project', 'direct_mentorship', 'skill_development') NOT NULL COMMENT '来源类型',
    source_project_id VARCHAR(36) COMMENT '来源项目ID',
    
    -- 成果记录
    completed_milestones JSON DEFAULT ('[]') COMMENT '完成里程碑',
    skills_improved JSON DEFAULT ('[]') COMMENT '提升技能',
    growth_areas JSON DEFAULT ('[]') COMMENT '成长领域',
    
    -- 双向反馈
    mentor_to_student_feedback TEXT COMMENT '导师给学员反馈',
    student_to_mentor_feedback TEXT COMMENT '学员给导师反馈',
    
    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 外键和索引
    FOREIGN KEY (profile_id) REFERENCES user_growth_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES training_projects(id),
    FOREIGN KEY (mentor_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    INDEX idx_profile_role (profile_id, role),
    INDEX idx_mentor_student (mentor_id, student_id),
    INDEX idx_status (status),
    INDEX idx_completion_date (end_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='带教历史表';

-- =====================================================
-- 数据库初始化脚本
-- =====================================================

-- 为现有用户自动创建全局成长档案
INSERT INTO user_growth_profiles (user_id, user_name, department, position, entry_date, current_level)
SELECT 
    u.id,
    u.name,
    u.department,
    u.position,
    '2020-01-01' as entry_date,  -- 默认入职日期，需要后续更新
    'junior' as current_level    -- 默认级别，需要后续更新
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_growth_profiles ugp WHERE ugp.user_id = u.id
);

-- 创建管理员账户的成长档案示例
INSERT INTO user_growth_profiles (
    id, user_id, user_name, department, position, 
    entry_date, current_level, total_training_projects, 
    statistics, profile_config
) VALUES (
    'ugp-admin-001', 
    'admin-001', 
    '系统管理员', 
    'IT部', 
    '系统管理员',
    '2020-01-01',
    'expert',
    0,
    '{"trainingProjects": {"total": 0, "completed": 0, "inProgress": 0, "completionRate": 0, "averageRating": 0}}',
    '{"visibility": {"public": false, "department": true, "mentors": true, "managers": true}}'
)
ON DUPLICATE KEY UPDATE
    user_name = VALUES(user_name),
    department = VALUES(department),
    position = VALUES(position);

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 创建完成
-- =====================================================

-- 显示创建结果
SELECT 
    'Global Growth Profiles Database Setup Completed!' as Status,
    COUNT(*) as UserProfiles
FROM user_growth_profiles;

-- 显示表统计信息
SELECT 
    TABLE_NAME as TableName,
    TABLE_ROWS as EstimatedRows,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as SizeMB
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME LIKE 'growth_%' 
    OR TABLE_NAME = 'user_growth_profiles'
ORDER BY TABLE_NAME; 