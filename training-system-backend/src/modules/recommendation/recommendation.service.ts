import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma.service';

export interface StudentPerformanceData {
  id: string;
  name: string;
  rank: number;
  attendance: number;
  taskCompletion: number;
  role: string;
  observationTags: string[];
  // 观察记录相关信息
  observationCount: number;
  lastObservationDate: string;
  hasObservationRecord: boolean;
}

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取有观察记录的学员表现数据
   * 根据标准：只有辅导员给学员做过观察记录并提交的学员，才显示在人才推荐页面
   */
  async getStudentPerformanceWithObservations(projectId: string, counselorId: string): Promise<StudentPerformanceData[]> {
    console.log('🔍 获取有观察记录的学员表现数据');
    console.log('🔍 项目ID:', projectId);
    console.log('🔍 辅导员ID:', counselorId);

    // 1. 获取该辅导员在该项目中提交的观察记录
    const observationRecords = await this.prisma.observationRecord.findMany({
      where: {
        projectId,
        observerId: counselorId
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('🔍 找到的观察记录数量:', observationRecords.length);

    if (observationRecords.length === 0) {
      console.log('🔍 该辅导员在该项目中没有观察记录');
      return [];
    }

    // 2. 获取有观察记录的学员ID列表
    const observedStudentIds = [...new Set(observationRecords.map(record => record.studentId))];
    console.log('🔍 有观察记录的学员ID:', observedStudentIds);

    // 3. 获取这些学员的项目参与信息
    const projectParticipants = await this.prisma.projectParticipant.findMany({
      where: {
        projectId,
        userId: { in: observedStudentIds },
        role: 'STUDENT',
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true
          }
        }
      }
    });

    console.log('🔍 找到的项目参与者数量:', projectParticipants.length);

    // 4. 获取学员的表现数据（如果存在）
    const studentPerformances = await this.prisma.studentPerformance.findMany({
      where: {
        projectId,
        studentId: { in: observedStudentIds }
      }
    });

    console.log('🔍 找到的学员表现数据数量:', studentPerformances.length);

    // 5. 构建返回数据
    const result: StudentPerformanceData[] = [];

    for (const participant of projectParticipants) {
      const studentId = participant.userId;
      const student = participant.user;
      
      // 获取该学员的观察记录
      const studentObservations = observationRecords.filter(record => record.studentId === studentId);
      
      // 获取该学员的表现数据
      const performanceData = studentPerformances.find(p => p.studentId === studentId);
      
      // 提取观察标签
      const observationTags = studentObservations.reduce((tags, record) => {
        if (Array.isArray(record.tags)) {
          tags.push(...record.tags as string[]);
        }
        return tags;
      }, [] as string[]);

      // 去重观察标签
      const uniqueTags = [...new Set(observationTags)];

      // 构建学员数据
      const studentData: StudentPerformanceData = {
        id: studentId,
        name: student.name,
        rank: performanceData?.rank || 0,
        attendance: performanceData?.attendance || 0,
        taskCompletion: performanceData?.taskCompletion || 0,
        role: performanceData?.role || '学员',
        observationTags: uniqueTags,
        observationCount: studentObservations.length,
        lastObservationDate: studentObservations[0]?.createdAt?.toISOString() || '',
        hasObservationRecord: true
      };

      result.push(studentData);
    }

    console.log('🔍 最终返回的学员数据数量:', result.length);
    return result;
  }

  /**
   * 提交推荐
   */
  async submitRecommendations(projectId: string, counselorId: string, recommendations: any): Promise<void> {
    console.log('🔍 提交推荐');
    console.log('🔍 项目ID:', projectId);
    console.log('🔍 辅导员ID:', counselorId);
    console.log('🔍 推荐数据:', recommendations);

    // 处理羽林卫推荐
    if (recommendations.yulinList && recommendations.yulinList.length > 0) {
      for (const studentId of recommendations.yulinList) {
        const evaluation = recommendations.evaluations[studentId];
        
        await this.prisma.recommendation.upsert({
          where: {
            projectId_studentId_type: {
              projectId,
              studentId,
              type: 'YULIN'
            }
          },
          update: {
            leadership: evaluation?.leadership || 0,
            innovation: evaluation?.innovation || 0,
            execution: evaluation?.execution || 0,
            teamwork: evaluation?.teamwork || 0,
            reason: evaluation?.reason || '',
            status: 'PENDING',
            updatedAt: new Date()
          },
          create: {
            projectId,
            studentId,
            counselorId,
            type: 'YULIN',
            leadership: evaluation?.leadership || 0,
            innovation: evaluation?.innovation || 0,
            execution: evaluation?.execution || 0,
            teamwork: evaluation?.teamwork || 0,
            reason: evaluation?.reason || '',
            status: 'PENDING'
          }
        });
      }
    }

    // 处理锦衣卫推荐
    if (recommendations.jinyiList && recommendations.jinyiList.length > 0) {
      for (const studentId of recommendations.jinyiList) {
        const evaluation = recommendations.evaluations[studentId];
        
        await this.prisma.recommendation.upsert({
          where: {
            projectId_studentId_type: {
              projectId,
              studentId,
              type: 'JINYI'
            }
          },
          update: {
            leadership: evaluation?.leadership || 0,
            innovation: evaluation?.innovation || 0,
            execution: evaluation?.execution || 0,
            teamwork: evaluation?.teamwork || 0,
            reason: evaluation?.reason || '',
            status: 'PENDING',
            updatedAt: new Date()
          },
          create: {
            projectId,
            studentId,
            counselorId,
            type: 'JINYI',
            leadership: evaluation?.leadership || 0,
            innovation: evaluation?.innovation || 0,
            execution: evaluation?.execution || 0,
            teamwork: evaluation?.teamwork || 0,
            reason: evaluation?.reason || '',
            status: 'PENDING'
          }
        });
      }
    }

    console.log('✅ 推荐提交完成');
  }

  /**
   * 获取辅导员的推荐记录
   */
  async getCounselorRecommendations(projectId: string, counselorId: string): Promise<any[]> {
    console.log('🔍 获取辅导员推荐记录');
    console.log('🔍 项目ID:', projectId);
    console.log('🔍 辅导员ID:', counselorId);

    const recommendations = await this.prisma.recommendation.findMany({
      where: {
        projectId,
        counselorId
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('🔍 找到的推荐记录数量:', recommendations.length);

    // 转换数据格式，添加便于前端使用的字段
    const formattedRecommendations = recommendations.map(rec => ({
      id: rec.id,
      studentId: rec.studentId,
      studentName: rec.student.name,
      studentDepartment: rec.student.department,
      type: rec.type,
      status: rec.status,
      evaluation: {
        leadership: rec.leadership,
        innovation: rec.innovation,
        execution: rec.execution,
        teamwork: rec.teamwork,
        reason: rec.reason
      },
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt
    }));

    return formattedRecommendations;
  }

  /**
   * 更新学员表现数据
   */
  async updateStudentPerformance(projectId: string, studentId: string, performance: Partial<StudentPerformanceData>): Promise<void> {
    await this.prisma.studentPerformance.upsert({
      where: {
        projectId_studentId: {
          projectId,
          studentId
        }
      },
      update: {
        rank: performance.rank,
        attendance: performance.attendance,
        taskCompletion: performance.taskCompletion,
        role: performance.role,
        observationTags: performance.observationTags || [],
        updatedAt: new Date()
      },
      create: {
        projectId,
        studentId,
        rank: performance.rank || 0,
        attendance: performance.attendance || 0,
        taskCompletion: performance.taskCompletion || 0,
        role: performance.role || '学员',
        observationTags: performance.observationTags || []
      }
    });
  }
} 