-- =====================================================
-- 吴静成长档案测试数据
-- 创建时间: 2024年12月
-- 说明: 为用户"吴静"(user-market-001)创建完整的成长档案测试数据
-- =====================================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 更新用户基本信息
UPDATE users SET 
    department = '市场部',
    position = '高级市场专员',
    hire_date = '2021-03-15'
WHERE id = 'user-market-001';

-- 2. 更新主档案信息
UPDATE user_growth_profiles SET 
    user_name = '吴静',
    department = '市场部',
    position = '高级市场专员',
    entry_date = '2021-03-15',
    current_level = 'intermediate',
    total_training_projects = 4,
    completed_training_projects = 3,
    total_mentorship_projects = 2,
    total_achievements = 6,
    total_skills = 8,
    total_goals = 3,
    average_rating = 4.2,
    statistics = JSON_OBJECT(
        'trainingProjects', JSON_OBJECT(
            'total', 4,
            'completed', 3,
            'inProgress', 1,
            'completionRate', 0.75,
            'averageRating', 4.2
        ),
        'mentorshipProjects', JSON_OBJECT(
            'asStudent', 2,
            'asMentor', 0,
            'completed', 1,
            'inProgress', 1,
            'averageRating', 4.5
        ),
        'skills', JSON_OBJECT(
            'total', 8,
            'mastered', 4,
            'inProgress', 4,
            'averageLevel', 3.1,
            'improvementRate', 0.7
        ),
        'achievements', JSON_OBJECT(
            'total', 6,
            'byType', JSON_OBJECT(
                'milestone', 2,
                'certification', 2,
                'recognition', 1,
                'skill_mastery', 1
            ),
            'byLevel', JSON_OBJECT(
                'bronze', 3,
                'silver', 2,
                'gold', 1,
                'platinum', 0
            )
        ),
        'feedback', JSON_OBJECT(
            'total', 12,
            'averageRating', 4.2,
            'byType', JSON_OBJECT(
                'mentor_feedback', 4,
                'peer_feedback', 5,
                'manager_feedback', 2,
                'instructor_feedback', 1
            )
        ),
        'activity', JSON_OBJECT(
            'totalEvents', 45,
            'lastActivityDate', CURDATE(),
            'monthlyActivity', JSON_OBJECT()
        )
    ),
    profile_config = JSON_OBJECT(
        'visibility', JSON_OBJECT(
            'public', false,
            'department', true,
            'mentors', true,
            'managers', true
        ),
        'notifications', JSON_OBJECT(
            'goalReminders', true,
            'feedbackAlerts', true,
            'achievementSharing', true
        )
    )
WHERE user_id = 'user-market-001';

-- 3. 成长时间线事件
INSERT INTO growth_timeline_events (id, profile_id, event_date, type, category, title, description, importance, tags) VALUES
('event-wj-001', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '2024-01-15', 'training', 'learning', '市场营销进阶培训开始', '参加为期3个月的市场营销进阶培训课程', 'high', JSON_ARRAY('培训', '市场营销', '技能提升')),
('event-wj-002', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '2024-03-20', 'achievement', 'recognition', '获得季度优秀员工', '因市场推广活动表现优异获得Q1季度优秀员工', 'high', JSON_ARRAY('成就', '季度奖', '认可')),
('event-wj-003', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '2024-04-10', 'training', 'learning', '完成市场营销进阶培训', '成功完成培训并获得优秀学员证书', 'medium', JSON_ARRAY('培训完成', '证书', '优秀学员')),
('event-wj-004', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '2024-06-01', 'mentorship', 'development', '开始数字营销带教', '在数字营销领域接受资深同事带教指导', 'medium', JSON_ARRAY('带教', '数字营销', '成长')),
('event-wj-005', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '2024-08-15', 'milestone', 'career', '主导重要市场活动', '成功主导公司年中营销活动策划与执行', 'high', JSON_ARRAY('里程碑', '项目管理', '领导力'));

-- 4. 技能发展记录
INSERT INTO growth_skills (id, profile_id, skill_name, skill_category, current_level, target_level, priority, last_assessed, progress_history) VALUES
('skill-wj-001', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '市场营销策划', 'domain', 4, 5, 'high', '2024-08-01', JSON_ARRAY(
    JSON_OBJECT('date', '2024-01-01', 'level', 3, 'assessment', '基础扎实'),
    JSON_OBJECT('date', '2024-04-01', 'level', 3.5, 'assessment', '培训后有提升'),
    JSON_OBJECT('date', '2024-08-01', 'level', 4, 'assessment', '项目实践中表现优秀')
)),
('skill-wj-002', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '数据分析', 'technical', 3, 4, 'high', '2024-07-15', JSON_ARRAY(
    JSON_OBJECT('date', '2024-01-01', 'level', 2, 'assessment', '需要加强'),
    JSON_OBJECT('date', '2024-07-15', 'level', 3, 'assessment', '通过学习有显著提升')
)),
('skill-wj-003', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '团队协作', 'soft', 4, 4, 'medium', '2024-06-01', JSON_ARRAY()),
('skill-wj-004', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '项目管理', 'leadership', 3, 4, 'medium', '2024-08-15', JSON_ARRAY()),
('skill-wj-005', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '客户沟通', 'soft', 4, 5, 'medium', '2024-05-01', JSON_ARRAY()),
('skill-wj-006', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '品牌管理', 'domain', 2, 3, 'low', '2024-03-01', JSON_ARRAY()),
('skill-wj-007', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '数字营销', 'technical', 3, 4, 'high', '2024-06-15', JSON_ARRAY()),
('skill-wj-008', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '演讲表达', 'soft', 3, 4, 'medium', '2024-07-01', JSON_ARRAY());

-- 5. 成就记录
INSERT INTO growth_achievements (id, profile_id, achievement_type, title, description, achievement_date, source, level, verified, skill_impact, career_impact, visible, featured) VALUES
('ach-wj-001', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'recognition', 'Q1季度优秀员工', '市场推广活动表现优异，获得季度优秀员工称号', '2024-03-20', 'work', 'gold', true, JSON_ARRAY('市场营销策划', '团队协作'), '提升了在团队中的影响力和认可度', true, true),
('ach-wj-002', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'certification', '市场营销进阶证书', '完成市场营销进阶培训并获得优秀学员证书', '2024-04-10', 'training', 'silver', true, JSON_ARRAY('市场营销策划'), '获得了更系统的营销理论知识', true, false),
('ach-wj-003', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'milestone', '首次主导大型活动', '独立策划并执行公司年中营销活动', '2024-08-15', 'work', 'gold', true, JSON_ARRAY('项目管理', '市场营销策划'), '证明了独立负责重要项目的能力', true, true),
('ach-wj-004', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'certification', '数字营销基础认证', '通过在线学习获得数字营销基础认证', '2024-07-01', 'external', 'bronze', true, JSON_ARRAY('数字营销'), '掌握了数字营销的基础理论', true, false),
('ach-wj-005', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'skill_mastery', '客户满意度提升专家', '负责的客户满意度较去年同期提升15%', '2024-09-01', 'work', 'silver', true, JSON_ARRAY('客户沟通'), '提升了客户关系管理能力', true, false),
('ach-wj-006', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'milestone', '团队协作标兵', '在跨部门项目中表现突出，获得团队协作标兵', '2024-05-15', 'work', 'bronze', true, JSON_ARRAY('团队协作'), '增强了跨部门合作能力', true, false);

-- 6. 成长目标
INSERT INTO growth_goals (id, profile_id, title, description, category, start_date, target_date, status, progress, metrics, action_plan, milestones) VALUES
('goal-wj-001', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '晋升为市场主管', '在一年内获得市场主管职位，负责团队管理', 'career', '2024-01-01', '2024-12-31', 'active', 65, 
JSON_ARRAY(
    JSON_OBJECT('name', '管理培训完成率', 'target', 100, 'current', 80, 'unit', '%'),
    JSON_OBJECT('name', '团队项目成功率', 'target', 90, 'current', 85, 'unit', '%')
),
JSON_ARRAY(
    JSON_OBJECT('action', '完成管理培训课程', 'deadline', '2024-06-30', 'status', 'completed'),
    JSON_OBJECT('action', '主导至少2个重要项目', 'deadline', '2024-09-30', 'status', 'in_progress'),
    JSON_OBJECT('action', '获得上级推荐', 'deadline', '2024-11-30', 'status', 'pending')
),
JSON_ARRAY(
    JSON_OBJECT('title', '完成管理基础培训', 'targetDate', '2024-04-30', 'completed', true),
    JSON_OBJECT('title', '主导年中营销活动', 'targetDate', '2024-08-31', 'completed', true),
    JSON_OBJECT('title', '获得季度优秀评价', 'targetDate', '2024-10-31', 'completed', false),
    JSON_OBJECT('title', '通过晋升评估', 'targetDate', '2024-12-15', 'completed', false)
)),
('goal-wj-002', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '掌握数据分析技能', '提升数据分析能力，能够独立完成市场数据分析报告', 'skill', '2024-06-01', '2024-11-30', 'active', 70,
JSON_ARRAY(
    JSON_OBJECT('name', '数据分析技能等级', 'target', 4, 'current', 3, 'unit', '级'),
    JSON_OBJECT('name', '独立完成报告数量', 'target', 5, 'current', 3, 'unit', '份')
),
JSON_ARRAY(
    JSON_OBJECT('action', '学习Excel高级功能', 'deadline', '2024-07-31', 'status', 'completed'),
    JSON_OBJECT('action', '学习SQL基础', 'deadline', '2024-09-30', 'status', 'in_progress'),
    JSON_OBJECT('action', '完成3份分析报告', 'deadline', '2024-11-30', 'status', 'in_progress')
),
JSON_ARRAY()),
('goal-wj-003', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '建立行业影响力', '通过知识分享和行业交流建立个人品牌影响力', 'network', '2024-03-01', '2025-02-28', 'active', 40,
JSON_ARRAY(
    JSON_OBJECT('name', '内部分享次数', 'target', 6, 'current', 2, 'unit', '次'),
    JSON_OBJECT('name', '行业活动参与', 'target', 4, 'current', 1, 'unit', '次')
),
JSON_ARRAY(
    JSON_OBJECT('action', '每季度进行内部分享', 'deadline', '2024-12-31', 'status', 'in_progress'),
    JSON_OBJECT('action', '参加行业会议', 'deadline', '2024-10-31', 'status', 'pending'),
    JSON_OBJECT('action', '发表专业文章', 'deadline', '2025-01-31', 'status', 'pending')
),
JSON_ARRAY());

-- 7. 反馈记录
INSERT INTO growth_feedback (id, profile_id, feedback_type, title, content, provider_name, provider_role, rating, feedback_date, visibility, status) VALUES
('fb-wj-001', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'manager', '年中绩效反馈', '吴静在市场营销方面表现优秀，策划能力强，执行力到位。建议在数据分析方面继续加强，并且可以尝试更多跨部门协作项目。', '张主管', '直属上级', 8, '2024-07-15', 'shared', 'acknowledged'),
('fb-wj-002', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'mentor', '带教中期反馈', '在数字营销学习过程中态度积极，学习能力强。理论掌握较好，建议多在实际项目中应用所学知识。', '李老师', '数字营销导师', 9, '2024-08-01', 'shared', 'acknowledged'),
('fb-wj-003', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'peer', '项目协作反馈', '在年中活动项目中合作愉快，沟通顺畅，能够很好地协调各方资源。希望未来能有更多合作机会。', '王同事', '产品部同事', 8, '2024-08-20', 'shared', 'acknowledged'),
('fb-wj-004', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'instructor', '培训课程反馈', '课程参与度高，思维活跃，经常提出有建设性的问题。作业完成质量较高，是班级的优秀学员。', '陈讲师', '培训讲师', 9, '2024-04-05', 'shared', 'acknowledged');

-- 8. 培训历史
INSERT INTO growth_training_history (id, profile_id, project_id, project_name, project_type, start_date, end_date, status, final_score, completion_rate, certifications_obtained, skills_learned, instructor_feedback, self_reflection) VALUES
('th-wj-001', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'proj-marketing-advanced', '市场营销进阶培训', 'skills', '2024-01-15', '2024-04-10', 'completed', 92, 100.00, 
JSON_ARRAY('市场营销进阶证书', '优秀学员证书'),
JSON_ARRAY('营销策略制定', '市场分析', '品牌管理', '客户关系管理'),
'学习态度认真，理论掌握扎实，实践能力强，是本期培训的优秀学员。',
'通过这次培训，我系统地学习了现代营销理论，特别是数字化营销的相关知识，对我的工作帮助很大。'),
('th-wj-002', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'proj-leadership-basic', '基础管理技能培训', 'leadership', '2024-05-01', '2024-06-30', 'completed', 88, 95.50, 
JSON_ARRAY('管理基础证书'),
JSON_ARRAY('团队管理', '沟通技巧', '项目管理基础'),
'积极参与讨论，管理思维清晰，具备不错的领导潜质。',
'学会了很多管理方法和沟通技巧，对我目前的工作以及未来的职业发展都很有价值。'),
('th-wj-003', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), 'proj-digital-marketing', '数字营销实战', 'skills', '2024-09-01', NULL, 'active', NULL, 75.00,
JSON_ARRAY(),
JSON_ARRAY('社交媒体营销', 'SEO优化', '内容营销'),
NULL,
'目前正在学习中，内容很实用，希望能将所学应用到实际工作中。');

-- 9. 带教历史  
INSERT INTO growth_mentorship_history (id, profile_id, project_name, role, mentor_id, mentor_name, student_id, student_name, start_date, end_date, status, overall_rating, source_type, completed_milestones, skills_improved, mentor_to_student_feedback) VALUES
('mh-wj-001', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '数字营销技能提升', 'student', 'user-market-senior-001', '李资深', 'user-market-001', '吴静', '2024-06-01', NULL, 'active', NULL, 'skill_development',
JSON_ARRAY('完成数字营销基础理论学习', '参与2个实际项目'),
JSON_ARRAY('数字营销', '数据分析', '内容策划'),
'学习积极主动，理解能力强，能够快速将理论知识应用到实践中。建议多关注行业最新趋势。'),
('mh-wj-002', (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001'), '新人带教项目', 'student', 'user-market-manager-001', '张主管', 'user-market-001', '吴静', '2021-03-15', '2021-09-15', 'completed', 9, 'training_project',
JSON_ARRAY('完成岗位技能培训', '独立完成第一个项目', '通过试用期考核'),
JSON_ARRAY('市场营销策划', '客户沟通', '团队协作'),
'新人适应能力强，学习速度快，工作态度积极。在试用期内就能独立承担工作，表现优秀。');

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 显示创建结果
SELECT 
    '吴静成长档案测试数据创建完成!' as Status,
    (SELECT COUNT(*) FROM growth_timeline_events WHERE profile_id = (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001')) as TimelineEvents,
    (SELECT COUNT(*) FROM growth_skills WHERE profile_id = (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001')) as Skills,
    (SELECT COUNT(*) FROM growth_achievements WHERE profile_id = (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001')) as Achievements,
    (SELECT COUNT(*) FROM growth_goals WHERE profile_id = (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001')) as Goals,
    (SELECT COUNT(*) FROM growth_feedback WHERE profile_id = (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001')) as Feedback,
    (SELECT COUNT(*) FROM growth_training_history WHERE profile_id = (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001')) as TrainingHistory,
    (SELECT COUNT(*) FROM growth_mentorship_history WHERE profile_id = (SELECT id FROM user_growth_profiles WHERE user_id = 'user-market-001')) as MentorshipHistory; 