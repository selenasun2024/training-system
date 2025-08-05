import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service';

export interface StudentScore {
  userId: string;
  name: string;
  groupId?: string;
  groupName?: string;
  exam?: number;
  homework?: number;
  attendance?: number;
  total?: number;
  rank?: number;
}

export interface ProjectScoresResponse {
  students: StudentScore[];
  groupScores?: Record<string, number>;
  groupTaskDetails?: Record<string, { taskId: string; taskName: string; score: number }[]>;
}

@Injectable()
export class ScoreService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取项目成绩数据
   */
  async getProjectScores(projectId: string, groupId?: string): Promise<ProjectScoresResponse> {
    console.log('🔍 ScoreService: 获取项目成绩 - 项目ID:', projectId);

    // 1. 获取项目参与的学员
    const projectParticipants = await this.prisma.projectParticipant.findMany({
      where: {
        projectId,
        role: 'STUDENT',
        status: 'ACTIVE',
        ...(groupId && {
          user: {
            groupMemberships: {
              some: {
                group: {
                  id: groupId,
                  projectId
                }
              }
            }
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            groupMemberships: {
              where: {
                group: {
                  projectId
                }
              },
              include: {
                group: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`📊 找到 ${projectParticipants.length} 个学员`);

    // 2. 为每个学员计算成绩
    const students: StudentScore[] = [];
    
    for (const participant of projectParticipants) {
      const user = participant.user;
      const studentScore: StudentScore = {
        userId: user.id,
        name: user.name,
      };

      // 获取分组信息
      if (user.groupMemberships && user.groupMemberships.length > 0) {
        const groupMember = user.groupMemberships[0];
        studentScore.groupId = groupMember.group.id;
        studentScore.groupName = groupMember.group.name;
      }

      // 计算作业分数（从TaskSubmission表获取）
      const homeworkScore = await this.calculateHomeworkScore(projectId, user.id);
      studentScore.homework = homeworkScore;

      // 计算考试分数（从TaskSubmission表获取，类型为exam）
      const examScore = await this.calculateExamScore(projectId, user.id);
      studentScore.exam = examScore;

      // 计算考勤分数（暂时使用模拟数据，后续可以从考勤表获取）
      studentScore.attendance = await this.calculateAttendanceScore(projectId, user.id);

      students.push(studentScore);
    }

    // 3. 计算总分和排名
    this.calculateTotalScoresAndRanking(students);

    // 4. 获取小组协同作业分数（如果需要）
    const groupScores: Record<string, number> = {};
    const groupTaskDetails: Record<string, { taskId: string; taskName: string; score: number }[]> = {};

    if (!groupId) {
      // 获取所有小组的协同作业分数
      await this.calculateGroupScores(projectId, groupScores, groupTaskDetails);
    }

    console.log(`✅ ScoreService: 成绩计算完成，学员数量: ${students.length}`);

    return {
      students,
      groupScores,
      groupTaskDetails,
    };
  }

  /**
   * 获取学员个人成绩详情
   */
  async getStudentScore(projectId: string, studentId: string): Promise<StudentScore> {
    console.log('🔍 ScoreService: 获取学员成绩 - 学员ID:', studentId);

    const scores = await this.getProjectScores(projectId);
    const studentScore = scores.students.find(s => s.userId === studentId);

    if (!studentScore) {
      throw new Error('学员不存在或不属于该项目');
    }

    return studentScore;
  }

  /**
   * 计算作业分数
   */
  private async calculateHomeworkScore(projectId: string, studentId: string): Promise<number> {
    try {
      // 获取项目中的作业任务
      const homeworkSubmissions = await this.prisma.taskSubmission.findMany({
        where: {
          studentId,
          status: 'REVIEWED', // 只计算已批阅的作业
          task: {
            projectId,
            type: 'homework'
          }
        },
        select: {
          score: true,
          task: {
            select: {
              name: true
            }
          }
        }
      });

      if (homeworkSubmissions.length === 0) {
        console.log(`📝 学员 ${studentId} 没有已批阅的作业`);
        return 0;
      }

      // 计算平均分
      const totalScore = homeworkSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      const averageScore = Math.round(totalScore / homeworkSubmissions.length);

      console.log(`📝 学员 ${studentId} 作业分数: ${averageScore} (共${homeworkSubmissions.length}份作业)`);
      return averageScore;
    } catch (error) {
      console.error(`❌ 计算作业分数失败 - 学员ID: ${studentId}`, error);
      return 0;
    }
  }

  /**
   * 计算考试分数
   */
  private async calculateExamScore(projectId: string, studentId: string): Promise<number> {
    try {
      // 获取项目中的考试任务
      const examSubmissions = await this.prisma.taskSubmission.findMany({
        where: {
          studentId,
          status: 'REVIEWED',
          task: {
            projectId,
            type: 'exam'
          }
        },
        select: {
          score: true
        }
      });

      if (examSubmissions.length === 0) {
        console.log(`📝 学员 ${studentId} 没有已批阅的考试`);
        return 0; // 没有考试成绩时返回0分
      }

      const totalScore = examSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      const averageScore = Math.round(totalScore / examSubmissions.length);

      console.log(`📝 学员 ${studentId} 考试分数: ${averageScore}`);
      return averageScore;
    } catch (error) {
      console.error(`❌ 计算考试分数失败 - 学员ID: ${studentId}`, error);
      return 0; // 出错时返回0分，避免随机数据
    }
  }

  /**
   * 计算考勤分数
   */
  private async calculateAttendanceScore(projectId: string, studentId: string): Promise<number> {
    try {
      // TODO: 后续从考勤表获取真实数据
      // 暂时返回满分，等待考勤功能完善
      console.log(`📅 学员 ${studentId} 考勤分数: 100 (待考勤功能完善)`);
      return 100;
    } catch (error) {
      console.error(`❌ 计算考勤分数失败 - 学员ID: ${studentId}`, error);
      return 100;
    }
  }

  /**
   * 计算总分和排名
   */
  private calculateTotalScoresAndRanking(students: StudentScore[]): void {
    // 计算总分
    students.forEach(student => {
      const exam = student.exam || 0;
      const homework = student.homework || 0;
      const attendance = student.attendance || 0;
      
      // 简单平均分计算，后续可以根据权重配置调整
      student.total = Math.round((exam + homework + attendance) / 3);
    });

    // 按总分排序并设置排名
    students.sort((a, b) => (b.total || 0) - (a.total || 0));
    students.forEach((student, index) => {
      student.rank = index + 1;
    });
  }

  /**
   * 计算小组协同作业分数
   */
  private async calculateGroupScores(
    projectId: string,
    groupScores: Record<string, number>,
    groupTaskDetails: Record<string, { taskId: string; taskName: string; score: number }[]>
  ): Promise<void> {
    try {
      // 获取项目中的协同作业任务
      const cooperationTasks = await this.prisma.trainingTask.findMany({
        where: {
          projectId,
          type: 'cooperation'
        },
        select: {
          id: true,
          name: true,
          config: true
        }
      });

      // 获取所有小组
      const groups = await this.prisma.trainingGroup.findMany({
        where: {
          projectId
        },
        select: {
          id: true,
          name: true
        }
      });

      // 为每个小组计算协同作业分数
      for (const group of groups) {
        groupTaskDetails[group.id] = [];
        let totalScore = 0;

        for (const task of cooperationTasks) {
          // 从任务配置中获取小组分数
          const config = task.config as any;
          const groupScore = config?.groupScores?.[group.id] || 0;
          
          groupTaskDetails[group.id].push({
            taskId: task.id,
            taskName: task.name,
            score: groupScore
          });

          totalScore += groupScore;
        }

        groupScores[group.id] = totalScore;
      }
    } catch (error) {
      console.error('❌ 计算小组分数失败:', error);
    }
  }
} 