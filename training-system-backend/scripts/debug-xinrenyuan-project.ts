import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugXinrenyuanProject() {
  console.log('🔍 调试"新员工入职培训"数据');
  
  try {
    // 1. 找到"新员工入职培训"
    const project = await prisma.trainingProject.findFirst({
      where: {
        name: '新员工入职培训'
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      console.log('❌ 没有找到"新员工入职培训"');
      return;
    }

    console.log('✅ 项目信息:', {
      id: project.id,
      name: project.name,
      status: project.status
    });

    // 2. 查看项目的所有观察记录
    const observationRecords = await prisma.observationRecord.findMany({
      where: {
        projectId: project.id
      },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        },
        observer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📝 项目中的所有观察记录:', observationRecords.length, '条');
    observationRecords.forEach((record, index) => {
      console.log(`${index + 1}. 观察者: ${record.observer.name} (${record.observerId})`);
      console.log(`   学员: ${record.student.name} (${record.studentId})`);
      console.log(`   类型: ${record.type}`);
      console.log(`   创建时间: ${record.createdAt}`);
      console.log('   ---');
    });

    // 3. 查看项目的分组情况
    const groups = await prisma.trainingGroup.findMany({
      where: {
        projectId: project.id
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    console.log('\n👥 项目中的分组情况:', groups.length, '个分组');
    groups.forEach((group, index) => {
      console.log(`\n分组 ${index + 1}: ${group.name} (${group.id})`);
      
      const leaders = group.members.filter(m => m.role === 'LEADER');
      const members = group.members.filter(m => m.role === 'MEMBER');
      
      console.log('   组长:', leaders.map(l => `${l.user.name} (${l.userId})`));
      console.log('   成员:', members.map(m => `${m.user.name} (${m.userId})`));
    });

    // 4. 查看项目参与者情况
    console.log('\n🏃 项目参与者情况:');
    const counselors = project.participants.filter(p => p.role === 'COUNSELOR');
    const students = project.participants.filter(p => p.role === 'STUDENT');
    
    console.log('辅导员:', counselors.map(c => `${c.user.name} (${c.userId})`));
    console.log('学员:', students.map(s => `${s.user.name} (${s.userId})`));

    // 5. 针对每个辅导员，查看他们的观察记录
    console.log('\n🔍 各辅导员的观察记录统计:');
    for (const counselor of counselors) {
      const counselorObservations = observationRecords.filter(r => r.observerId === counselor.userId);
      console.log(`${counselor.user.name} (${counselor.userId}): ${counselorObservations.length} 条观察记录`);
      
      if (counselorObservations.length > 0) {
        counselorObservations.forEach(obs => {
          console.log(`  -> 学员: ${obs.student.name}, 时间: ${obs.createdAt}`);
        });
      }
    }

    // 6. 检查特定辅导员 user-hr-001 的情况
    console.log('\n🔍 特别检查辅导员 user-hr-001:');
    const hr001Observations = observationRecords.filter(r => r.observerId === 'user-hr-001');
    console.log(`user-hr-001 的观察记录数量: ${hr001Observations.length}`);
    
    // 检查 user-hr-001 是否是分组LEADER
    const hr001Groups = groups.filter(g => 
      g.members.some(m => m.userId === 'user-hr-001' && m.role === 'LEADER')
    );
    console.log(`user-hr-001 担任组长的分组数量: ${hr001Groups.length}`);
    hr001Groups.forEach(group => {
      console.log(`  担任组长的分组: ${group.name}`);
    });

  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugXinrenyuanProject(); 