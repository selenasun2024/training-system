// 智能导师匹配算法服务

import type { Mentor, Student, MatchingCriteria, MatchingResult } from '@/types';

// 匹配标准接口
export interface MatchingCriteria {
  studentId: string;
  requiredSkills: string[];
  department?: string;
  preferredStyle?: 'hands-on' | 'guidance' | 'collaborative' | 'structured';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  maxWorkload?: number;
  minRating?: number;
  sameTimezone?: boolean;
  criteria: ('skills' | 'department' | 'workload' | 'rating' | 'experience' | 'style')[];
}

// 匹配结果接口
export interface MatchingResult {
  mentor: Mentor;
  score: number;
  breakdown: {
    skillsMatch: number;
    departmentMatch: number;
    workloadScore: number;
    ratingScore: number;
    experienceScore: number;
    styleMatch: number;
    overallFit: number;
  };
  reasons: string[];
  warnings: string[];
}

// 技能匹配详情
export interface SkillMatchDetail {
  skill: string;
  mentorLevel: number;
  studentNeed: number;
  match: boolean;
  weight: number;
}

export class MentorMatchingService {
  private mentors: Mentor[] = [];
  private students: Student[] = [];
  private skillWeights: Record<string, number> = {};

  constructor() {
    this.loadSkillWeights();
  }

  /**
   * 加载技能权重配置
   */
  private loadSkillWeights() {
    this.skillWeights = {
      // 技术技能
      'JavaScript': 0.9,
      'TypeScript': 0.9,
      'Vue.js': 0.8,
      'React': 0.8,
      'Node.js': 0.8,
      'Python': 0.8,
      'Java': 0.7,
      'Database': 0.7,
      
      // 软技能
      'Leadership': 0.9,
      'Communication': 0.8,
      'ProjectManagement': 0.8,
      'Teamwork': 0.7,
      'ProblemSolving': 0.8,
      
      // 领域知识
      'Finance': 0.6,
      'Healthcare': 0.6,
      'Education': 0.6,
      'Retail': 0.5
    };
  }

  /**
   * 查找最佳导师匹配
   */
  async findBestMatches(criteria: MatchingCriteria): Promise<MatchingResult[]> {
    try {
      // 加载可用导师
      const availableMentors = await this.getAvailableMentors(criteria);
      
      if (availableMentors.length === 0) {
        throw new Error('没有可用的导师');
      }

      // 计算每个导师的匹配分数
      const matches: MatchingResult[] = [];
      
      for (const mentor of availableMentors) {
        const result = await this.calculateMatch(mentor, criteria);
        if (result.score > 0.3) { // 最低匹配阈值
          matches.push(result);
        }
      }

      // 按分数排序
      matches.sort((a, b) => b.score - a.score);

      // 返回前5个最佳匹配
      return matches.slice(0, 5);
      
    } catch (error) {
      console.error('导师匹配失败:', error);
      throw error;
    }
  }

  /**
   * 获取可用导师列表
   */
  private async getAvailableMentors(criteria: MatchingCriteria): Promise<Mentor[]> {
    // 这里应该从API获取导师数据
    // const response = await mentorApi.getAvailableMentors(criteria);
    // return response.data;
    
    // 模拟数据
    return [
      {
        id: 'mentor-1',
        mentorId: 'mentor-1',
        name: '李高级',
        email: 'li@example.com',
        department: '技术部',
        position: '高级工程师',
        expertise: ['JavaScript', 'Vue.js', 'Node.js', 'Leadership'],
        certifications: [
          { name: 'Vue.js认证', level: 'advanced', issuer: 'Vue.js官方' }
        ],
        currentLoad: 2,
        maxLoad: 5,
        rating: 4.8,
        trainingMentorships: ['training-1', 'training-2'],
        mentorshipProjects: ['project-1', 'project-2'],
        style: 'hands-on',
        timezone: 'Asia/Shanghai',
        experience: {
          totalYears: 8,
          mentorshipYears: 3,
          successfulMentorships: 15
        },
        entryDate: new Date('2015-01-01'),
        status: 'active'
      },
      {
        id: 'mentor-2',
        mentorId: 'mentor-2',
        name: '王架构师',
        email: 'wang@example.com',
        department: '技术部',
        position: '架构师',
        expertise: ['Java', 'Python', 'Database', 'SystemDesign', 'Leadership'],
        certifications: [
          { name: 'Java架构师认证', level: 'expert', issuer: 'Oracle' }
        ],
        currentLoad: 3,
        maxLoad: 4,
        rating: 4.9,
        trainingMentorships: ['training-3'],
        mentorshipProjects: ['project-3', 'project-4', 'project-5'],
        style: 'structured',
        timezone: 'Asia/Shanghai',
        experience: {
          totalYears: 12,
          mentorshipYears: 5,
          successfulMentorships: 28
        },
        entryDate: new Date('2011-03-01'),
        status: 'active'
      },
      {
        id: 'mentor-3',
        mentorId: 'mentor-3',
        name: '张产品',
        email: 'zhang@example.com',
        department: '产品部',
        position: '产品总监',
        expertise: ['ProductManagement', 'UserExperience', 'DataAnalysis', 'Communication'],
        certifications: [
          { name: '产品经理认证', level: 'advanced', issuer: 'PMI' }
        ],
        currentLoad: 1,
        maxLoad: 3,
        rating: 4.7,
        trainingMentorships: [],
        mentorshipProjects: ['project-6'],
        style: 'collaborative',
        timezone: 'Asia/Shanghai',
        experience: {
          totalYears: 10,
          mentorshipYears: 2,
          successfulMentorships: 8
        },
        entryDate: new Date('2013-06-01'),
        status: 'active'
      }
    ] as Mentor[];
  }

  /**
   * 计算导师匹配度
   */
  private async calculateMatch(mentor: Mentor, criteria: MatchingCriteria): Promise<MatchingResult> {
    const breakdown = {
      skillsMatch: 0,
      departmentMatch: 0,
      workloadScore: 0,
      ratingScore: 0,
      experienceScore: 0,
      styleMatch: 0,
      overallFit: 0
    };
    
    const reasons: string[] = [];
    const warnings: string[] = [];

    // 1. 技能匹配度计算
    if (criteria.criteria.includes('skills')) {
      const skillsResult = this.calculateSkillsMatch(mentor, criteria.requiredSkills);
      breakdown.skillsMatch = skillsResult.score;
      reasons.push(...skillsResult.reasons);
      if (skillsResult.warnings.length > 0) {
        warnings.push(...skillsResult.warnings);
      }
    }

    // 2. 部门匹配度
    if (criteria.criteria.includes('department') && criteria.department) {
      if (mentor.department === criteria.department) {
        breakdown.departmentMatch = 1.0;
        reasons.push('同部门，便于沟通协作');
      } else {
        breakdown.departmentMatch = 0.6;
        warnings.push('跨部门合作可能存在沟通成本');
      }
    }

    // 3. 工作负载评分
    if (criteria.criteria.includes('workload')) {
      const workloadRatio = mentor.currentLoad / mentor.maxLoad;
      if (workloadRatio <= 0.6) {
        breakdown.workloadScore = 1.0;
        reasons.push('当前工作负载较轻，有充足时间进行指导');
      } else if (workloadRatio <= 0.8) {
        breakdown.workloadScore = 0.7;
        reasons.push('当前工作负载适中');
      } else {
        breakdown.workloadScore = 0.3;
        warnings.push('当前工作负载较重，可能影响指导质量');
      }
    }

    // 4. 评分评估
    if (criteria.criteria.includes('rating')) {
      const minRating = criteria.minRating || 4.0;
      if (mentor.rating >= minRating) {
        breakdown.ratingScore = Math.min(mentor.rating / 5.0, 1.0);
        reasons.push(`导师评分${mentor.rating}/5.0，口碑良好`);
      } else {
        breakdown.ratingScore = 0.5;
        warnings.push('导师评分低于期望值');
      }
    }

    // 5. 经验评分
    if (criteria.criteria.includes('experience')) {
      const experienceScore = this.calculateExperienceScore(mentor);
      breakdown.experienceScore = experienceScore.score;
      reasons.push(...experienceScore.reasons);
    }

    // 6. 指导风格匹配
    if (criteria.criteria.includes('style') && criteria.preferredStyle) {
      if (mentor.style === criteria.preferredStyle) {
        breakdown.styleMatch = 1.0;
        reasons.push(`指导风格匹配（${criteria.preferredStyle}）`);
      } else {
        breakdown.styleMatch = 0.5;
        warnings.push('指导风格与偏好不完全匹配');
      }
    }

    // 计算综合分数
    const weights = {
      skills: 0.35,
      department: 0.15,
      workload: 0.2,
      rating: 0.15,
      experience: 0.1,
      style: 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    criteria.criteria.forEach(criterion => {
      const weight = weights[criterion] || 0;
      totalWeight += weight;
      
      switch (criterion) {
        case 'skills':
          totalScore += breakdown.skillsMatch * weight;
          break;
        case 'department':
          totalScore += breakdown.departmentMatch * weight;
          break;
        case 'workload':
          totalScore += breakdown.workloadScore * weight;
          break;
        case 'rating':
          totalScore += breakdown.ratingScore * weight;
          break;
        case 'experience':
          totalScore += breakdown.experienceScore * weight;
          break;
        case 'style':
          totalScore += breakdown.styleMatch * weight;
          break;
      }
    });

    breakdown.overallFit = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      mentor,
      score: breakdown.overallFit,
      breakdown,
      reasons,
      warnings
    };
  }

  /**
   * 计算技能匹配度
   */
  private calculateSkillsMatch(mentor: Mentor, requiredSkills: string[]): {
    score: number;
    reasons: string[];
    warnings: string[];
    details: SkillMatchDetail[];
  } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    const details: SkillMatchDetail[] = [];
    
    if (requiredSkills.length === 0) {
      return { score: 0.5, reasons: ['未指定技能要求'], warnings, details };
    }

    let totalWeight = 0;
    let matchedWeight = 0;
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    requiredSkills.forEach(skill => {
      const weight = this.skillWeights[skill] || 0.5;
      totalWeight += weight;
      
      const mentorHasSkill = mentor.expertise.includes(skill);
      
      const detail: SkillMatchDetail = {
        skill,
        mentorLevel: mentorHasSkill ? 1 : 0, // 简化，实际应该有技能等级
        studentNeed: 1,
        match: mentorHasSkill,
        weight
      };
      details.push(detail);

      if (mentorHasSkill) {
        matchedWeight += weight;
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    // 生成原因说明
    if (matchedSkills.length > 0) {
      reasons.push(`匹配技能: ${matchedSkills.join(', ')}`);
    }
    
    if (missingSkills.length > 0) {
      warnings.push(`缺少技能: ${missingSkills.join(', ')}`);
    }

    // 额外技能加分
    const extraSkills = mentor.expertise.filter(skill => !requiredSkills.includes(skill));
    if (extraSkills.length > 0) {
      reasons.push(`额外技能: ${extraSkills.slice(0, 3).join(', ')}`);
    }

    return { score, reasons, warnings, details };
  }

  /**
   * 计算经验评分
   */
  private calculateExperienceScore(mentor: Mentor): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // 总工作经验
    const totalYears = mentor.experience?.totalYears || 0;
    if (totalYears >= 8) {
      score += 0.4;
      reasons.push(`${totalYears}年工作经验，经验丰富`);
    } else if (totalYears >= 5) {
      score += 0.3;
      reasons.push(`${totalYears}年工作经验`);
    } else {
      score += 0.2;
      reasons.push(`${totalYears}年工作经验，相对较少`);
    }

    // 带教经验
    const mentorshipYears = mentor.experience?.mentorshipYears || 0;
    if (mentorshipYears >= 3) {
      score += 0.3;
      reasons.push(`${mentorshipYears}年带教经验`);
    } else if (mentorshipYears >= 1) {
      score += 0.2;
      reasons.push(`${mentorshipYears}年带教经验`);
    } else {
      score += 0.1;
      reasons.push('带教经验较少');
    }

    // 成功案例
    const successfulCount = mentor.experience?.successfulMentorships || 0;
    if (successfulCount >= 20) {
      score += 0.3;
      reasons.push(`成功指导${successfulCount}名学员`);
    } else if (successfulCount >= 10) {
      score += 0.2;
      reasons.push(`成功指导${successfulCount}名学员`);
    } else if (successfulCount >= 5) {
      score += 0.1;
      reasons.push(`成功指导${successfulCount}名学员`);
    }

    return { score: Math.min(score, 1.0), reasons };
  }

  /**
   * 批量匹配多个学员
   */
  async batchMatch(requests: MatchingCriteria[]): Promise<{ 
    studentId: string; 
    matches: MatchingResult[]; 
    errors?: string[] 
  }[]> {
    const results = [];
    
    for (const request of requests) {
      try {
        const matches = await this.findBestMatches(request);
        results.push({ studentId: request.studentId, matches });
      } catch (error) {
        results.push({ 
          studentId: request.studentId, 
          matches: [], 
          errors: [error.message] 
        });
      }
    }
    
    return results;
  }

  /**
   * 获取匹配统计信息
   */
  async getMatchingStatistics(criteria: MatchingCriteria): Promise<{
    totalMentors: number;
    availableMentors: number;
    averageWorkload: number;
    skillCoverage: Record<string, number>;
    departmentDistribution: Record<string, number>;
  }> {
    const mentors = await this.getAvailableMentors(criteria);
    
    const stats = {
      totalMentors: mentors.length,
      availableMentors: mentors.filter(m => m.currentLoad < m.maxLoad).length,
      averageWorkload: 0,
      skillCoverage: {} as Record<string, number>,
      departmentDistribution: {} as Record<string, number>
    };

    if (mentors.length === 0) return stats;

    // 计算平均工作负载
    stats.averageWorkload = mentors.reduce((sum, m) => sum + (m.currentLoad / m.maxLoad), 0) / mentors.length;

    // 计算技能覆盖率
    criteria.requiredSkills.forEach(skill => {
      const count = mentors.filter(m => m.expertise.includes(skill)).length;
      stats.skillCoverage[skill] = count / mentors.length;
    });

    // 计算部门分布
    mentors.forEach(mentor => {
      stats.departmentDistribution[mentor.department] = 
        (stats.departmentDistribution[mentor.department] || 0) + 1;
    });

    return stats;
  }

  /**
   * 预测匹配成功率
   */
  predictMatchingSuccess(mentor: Mentor, student: Student): {
    probability: number;
    factors: { factor: string; impact: number; description: string }[];
  } {
    const factors = [];
    let probability = 0.5; // 基础概率

    // 技能匹配因子
    const commonSkills = mentor.expertise.filter(skill => student.skills.includes(skill));
    const skillFactor = commonSkills.length / Math.max(student.skills.length, 1);
    factors.push({
      factor: '技能匹配',
      impact: skillFactor * 0.3,
      description: `共同技能: ${commonSkills.join(', ')}`
    });
    probability += skillFactor * 0.3;

    // 部门因子
    const deptFactor = mentor.department === student.department ? 0.2 : -0.1;
    factors.push({
      factor: '部门匹配',
      impact: deptFactor,
      description: mentor.department === student.department ? '同部门' : '跨部门'
    });
    probability += deptFactor;

    // 经验因子
    const expFactor = Math.min((mentor.experience?.mentorshipYears || 0) / 5, 1) * 0.2;
    factors.push({
      factor: '带教经验',
      impact: expFactor,
      description: `${mentor.experience?.mentorshipYears || 0}年带教经验`
    });
    probability += expFactor;

    // 评分因子
    const ratingFactor = (mentor.rating - 4.0) * 0.1;
    factors.push({
      factor: '导师评分',
      impact: ratingFactor,
      description: `评分: ${mentor.rating}/5.0`
    });
    probability += ratingFactor;

    return {
      probability: Math.max(0, Math.min(1, probability)),
      factors
    };
  }
}

// 导出服务实例
export const mentorMatchingService = new MentorMatchingService(); 