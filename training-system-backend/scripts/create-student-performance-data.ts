import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createStudentPerformanceData() {
  console.log('🔄 创建学员表现数据...');
  
  try {
    const project111Id = '7d38a303-81ad-4246-80f1-c36310920363'; // 111
    const projectTrainingId = '4bcf4bb2-2b78-4408-9687-e515cbff5da8'; // 新员工入职培训
    
    // 为项目111中的孙悦创建表现数据
    const performance1 = await prisma.studentPerformance.upsert({
      where: {
        projectId_studentId: {
          projectId: project111Id,
          studentId: 'user-prod-002' // 孙悦
        }
      },
      update: {
        rank: 2,
        attendance: 95,
        taskCompletion: 92,
        role: '小组副组长',
        observationTags: ['积极参与', '协作能力强', '沟通良好', '技术扎实', '思路清晰', '创新思维']
      },
      create: {
        projectId: project111Id,
        studentId: 'user-prod-002',
        rank: 2,
        attendance: 95,
        taskCompletion: 92,
        role: '小组副组长',
        observationTags: ['积极参与', '协作能力强', '沟通良好', '技术扎实', '思路清晰', '创新思维']
      }
    });
    
    console.log('✅ 创建孙悦的学员表现数据成功');
    
    // 为其他有观察记录的学员创建表现数据
    
    // user-market-001 (吴静) - 被student-003观察
    const performance2 = await prisma.studentPerformance.upsert({
      where: {
        projectId_studentId: {
          projectId: project111Id,
          studentId: 'user-market-001'
        }
      },
      update: {
        rank: 5,
        attendance: 88,
        taskCompletion: 85,
        role: '普通成员',
        observationTags: ['表现良好']
      },
      create: {
        projectId: project111Id,
        studentId: 'user-market-001',
        rank: 5,
        attendance: 88,
        taskCompletion: 85,
        role: '普通成员',
        observationTags: ['表现良好']
      }
    });
    
    // user-prod-003 (周杰) - 被student-003观察
    const performance3 = await prisma.studentPerformance.upsert({
      where: {
        projectId_studentId: {
          projectId: project111Id,
          studentId: 'user-prod-003'
        }
      },
      update: {
        rank: 1,
        attendance: 98,
        taskCompletion: 96,
        role: '项目组长',
        observationTags: ['优秀表现', '领导能力强']
      },
      create: {
        projectId: project111Id,
        studentId: 'user-prod-003',
        rank: 1,
        attendance: 98,
        taskCompletion: 96,
        role: '项目组长',
        observationTags: ['优秀表现', '领导能力强']
      }
    });
    
    // user-tech-005 (刘洋) - 被user-tech-001观察
    const performance4 = await prisma.studentPerformance.upsert({
      where: {
        projectId_studentId: {
          projectId: projectTrainingId,
          studentId: 'user-tech-005'
        }
      },
      update: {
        rank: 3,
        attendance: 90,
        taskCompletion: 88,
        role: '技术组员',
        observationTags: ['技术能力好']
      },
      create: {
        projectId: projectTrainingId,
        studentId: 'user-tech-005',
        rank: 3,
        attendance: 90,
        taskCompletion: 88,
        role: '技术组员',
        observationTags: ['技术能力好']
      }
    });
    
    console.log('✅ 创建所有学员表现数据成功');
    
    // 验证创建结果
    const allPerformances = await prisma.studentPerformance.findMany({
      include: {
        student: {
          select: {
            name: true
          }
        },
        project: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log('📊 当前学员表现数据:');
    allPerformances.forEach(perf => {
      console.log(`  - ${perf.student.name} 在 ${perf.project.name} 中排名第${perf.rank}位`);
      console.log(`    考勤率: ${perf.attendance}%, 完成率: ${perf.taskCompletion}%, 角色: ${perf.role}`);
    });
    
  } catch (error) {
    console.error('❌ 创建学员表现数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createStudentPerformanceData().catch(console.error); 