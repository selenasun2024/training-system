import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugProjectDataMismatch() {
  try {
    console.log('=== 调试项目数据不一致问题 ===\n');
    
    // 1. 查找所有项目，特别是"新员工入职培训项目"
    console.log('1. 查找所有项目:');
    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        status: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('所有项目列表:');
    allProjects.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.name} (ID: ${project.id}, 状态: ${project.status})`);
    });
    
    // 查找新员工入职培训项目
    const newEmployeeProject = allProjects.find(p => p.name.includes('新员工入职培训'));
    
    if (!newEmployeeProject) {
      console.log('\n❌ 未找到"新员工入职培训项目"');
      return;
    }
    
    console.log(`\n✅ 找到项目: ${newEmployeeProject.name} (ID: ${newEmployeeProject.id})`);
    
    const projectId = newEmployeeProject.id;
    const counselorId = 'user-hr-001'; // 当前测试的辅导员ID
    
    // 2. 检查该项目的观察记录
    console.log('\n2. 检查观察记录:');
    const observationRecords = await prisma.observationRecord.findMany({
      where: {
        projectId: projectId
      },
      include: {
        observer: {
          select: {
            id: true,
            name: true
          }
        },
        student: {
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
    
    console.log(`观察记录总数: ${observationRecords.length}`);
    if (observationRecords.length > 0) {
      console.log('观察记录详情:');
      observationRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. 观察者: ${record.observer.name} (${record.observerId})`);
        console.log(`     学员: ${record.student.name} (${record.studentId})`);
        console.log(`     创建时间: ${record.createdAt}`);
        console.log('');
      });
    }
    
    // 3. 检查该辅导员的观察记录
    console.log(`3. 检查辅导员 ${counselorId} 的观察记录:`);
    const counselorObservations = observationRecords.filter(r => r.observerId === counselorId);
    console.log(`该辅导员的观察记录数: ${counselorObservations.length}`);
    
    if (counselorObservations.length > 0) {
      console.log('该辅导员的观察记录:');
      counselorObservations.forEach((record, index) => {
        console.log(`  ${index + 1}. 学员: ${record.student.name} (${record.studentId})`);
      });
      
      // 获取该辅导员观察过的学员ID列表
      const observedStudentIds = [...new Set(counselorObservations.map(r => r.studentId))];
      console.log(`该辅导员观察过的学员ID: ${observedStudentIds.join(', ')}`);
      
      // 4. 检查这些学员在项目参与者表中的记录
      console.log('\n4. 检查项目参与者表:');
      const allProjectParticipants = await prisma.projectParticipant.findMany({
        where: {
          projectId: projectId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      console.log(`项目参与者总数: ${allProjectParticipants.length}`);
      if (allProjectParticipants.length > 0) {
        console.log('所有项目参与者:');
        allProjectParticipants.forEach((participant, index) => {
          console.log(`  ${index + 1}. ${participant.user.name} (${participant.userId})`);
          console.log(`     角色: ${participant.role}, 状态: ${participant.status}`);
        });
      }
      
      // 5. 检查观察过的学员是否在项目参与者表中
      console.log('\n5. 检查数据一致性:');
      for (const studentId of observedStudentIds) {
        const participant = allProjectParticipants.find(p => p.userId === studentId);
        if (participant) {
          console.log(`✅ 学员 ${studentId} 在项目参与者表中`);
          console.log(`   角色: ${participant.role}, 状态: ${participant.status}`);
          
          // 检查是否符合推荐模块的查询条件
          if (participant.role === 'STUDENT' && participant.status === 'ACTIVE') {
            console.log(`   ✅ 符合推荐模块查询条件 (role: STUDENT, status: ACTIVE)`);
          } else {
            console.log(`   ❌ 不符合推荐模块查询条件 (需要 role: STUDENT, status: ACTIVE)`);
          }
        } else {
          console.log(`❌ 学员 ${studentId} 不在项目参与者表中`);
        }
      }
      
      // 6. 检查分组信息
      console.log('\n6. 检查分组信息:');
      const projectGroups = await prisma.group.findMany({
        where: {
          projectId: projectId
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
      
      console.log(`项目分组数: ${projectGroups.length}`);
      projectGroups.forEach((group, index) => {
        console.log(`  分组 ${index + 1}: ${group.name}`);
        console.log(`    成员数: ${group.members.length}`);
        group.members.forEach(member => {
          console.log(`      - ${member.user.name} (${member.userId}) - 角色: ${member.role}`);
        });
      });
      
    } else {
      console.log('该辅导员没有观察记录');
    }
    
    // 7. 建议修复方案
    console.log('\n7. 问题分析和建议修复方案:');
    console.log('如果发现学员有观察记录但不在项目参与者表中，可能需要:');
    console.log('  - 将学员添加到项目参与者表中，角色为 STUDENT，状态为 ACTIVE');
    console.log('  - 或者修改推荐模块的查询逻辑，使其能够通过分组关系查找学员');
    
  } catch (error) {
    console.error('调试过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProjectDataMismatch(); 