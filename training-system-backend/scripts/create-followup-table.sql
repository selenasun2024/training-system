-- 创建教务回访记录表
USE training_system;

-- 创建回访记录表
CREATE TABLE IF NOT EXISTS evaluation_followups (
  id VARCHAR(36) PRIMARY KEY,
  evaluation_id VARCHAR(36) NOT NULL,
  followup_by VARCHAR(100) NOT NULL COMMENT '回访人员',
  followup_date DATETIME NOT NULL COMMENT '回访日期',
  followup_type ENUM('phone', 'visit', 'online') DEFAULT 'phone' COMMENT '回访方式',
  followup_content TEXT NOT NULL COMMENT '回访内容',
  followup_score INT DEFAULT NULL COMMENT '回访评分',
  suggestions TEXT DEFAULT NULL COMMENT '改进建议',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_evaluation_id (evaluation_id),
  INDEX idx_followup_date (followup_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评价回访记录表';

-- 查看表结构
DESCRIBE evaluation_followups; 