import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProjectParticipantData() {
  try {
    console.log('=== 修复项目参与者数据 ===\n');
    
    // 1. 查找所有有观察记录但不在项目参与者表中的学员
    console.log('1. 查找需要修复的数据...');
    
    const observationRecords = await prisma.observationRecord.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`总观察记录数: ${observationRecords.length}`);
    
    // 按项目分组
    const recordsByProject = new Map<string, any[]>();
    observationRecords.forEach(record => {
      const projectId = record.projectId;
      if (!recordsByProject.has(projectId)) {
        recordsByProject.set(projectId, []);
      }
      recordsByProject.get(projectId)!.push(record);
    });
    
    console.log(`涉及项目数: ${recordsByProject.size}`);
    
    let totalFixed = 0;
    
    // 2. 对每个项目进行处理
    for (const [projectId, records] of recordsByProject) {
      const projectName = records[0].project.name;
      console.log(`\n处理项目: ${projectName} (${projectId})`);
      
      // 获取该项目的所有学员ID（去重）
      const studentIds = [...new Set(records.map(r => r.studentId))];
      console.log(`  该项目有观察记录的学员数: ${studentIds.length}`);
      
      // 检查这些学员是否在项目参与者表中
      const existingParticipants = await prisma.projectParticipant.findMany({
        where: {
          projectId: projectId,
          userId: { in: studentIds }
        }
      });
      
      const existingUserIds = new Set(existingParticipants.map(p => p.userId));
      const missingStudentIds = studentIds.filter(id => !existingUserIds.has(id));
      
      console.log(`  已在项目参与者表中的学员数: ${existingParticipants.length}`);
      console.log(`  需要添加的学员数: ${missingStudentIds.length}`);
      
      // 3. 为缺失的学员添加项目参与者记录
      if (missingStudentIds.length > 0) {
        console.log(`  开始添加缺失的学员记录...`);
        
        for (const studentId of missingStudentIds) {
          try {
            const student = records.find(r => r.studentId === studentId)?.student;
            console.log(`    添加学员: ${student?.name} (${studentId})`);
            
            await prisma.projectParticipant.create({
              data: {
                projectId: projectId,
                userId: studentId,
                role: 'STUDENT',
                status: 'ACTIVE',
                joinedAt: new Date()
              }
            });
            
            totalFixed++;
          } catch (error) {
            console.error(`    ❌ 添加学员 ${studentId} 失败:`, error.message);
          }
        }
      }
      
      // 4. 检查现有参与者的角色和状态
      console.log(`  检查现有参与者的角色和状态...`);
      for (const participant of existingParticipants) {
        if (participant.role !== 'STUDENT' || participant.status !== 'ACTIVE') {
          const student = records.find(r => r.studentId === participant.userId)?.student;
          console.log(`    需要更新学员状态: ${student?.name} (${participant.userId})`);
          console.log(`      当前: role=${participant.role}, status=${participant.status}`);
          console.log(`      更新为: role=STUDENT, status=ACTIVE`);
          
          try {
            await prisma.projectParticipant.update({
              where: {
                id: participant.id
              },
              data: {
                role: 'STUDENT',
                status: 'ACTIVE'
              }
            });
            console.log(`      ✅ 更新成功`);
            totalFixed++;
          } catch (error) {
            console.error(`      ❌ 更新失败:`, error.message);
          }
        }
      }
    }
    
    // 5. 总结
    console.log(`\n=== 修复完成 ===`);
    console.log(`总计修复记录数: ${totalFixed}`);
    
    if (totalFixed > 0) {
      console.log('\n建议重新测试推荐模块的学员表现仪表盘功能。');
    } else {
      console.log('\n没有发现需要修复的数据，问题可能在其他地方。');
    }
    
  } catch (error) {
    console.error('修复过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProjectParticipantData(); 