const { PrismaClient } = require('@prisma/client');

async function testCounselorReviewWorkflow() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 测试辅导员批阅工作流程...\n');
    
    const counselorId = 'user-hr-001'; // 冯芹的用户ID
    const studentId = 'user-market-001'; // 吴静的用户ID
    
    console.log('=== 1. 验证用户信息 ===');
    const counselor = await prisma.user.findUnique({
      where: { id: counselorId },
      select: { id: true, username: true, name: true }
    });
    
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, username: true, name: true }
    });
    
    if (!counselor) {
      console.log('❌ 辅导员用户不存在:', counselorId);
      return;
    }
    
    if (!student) {
      console.log('❌ 学员用户不存在:', studentId);
      return;
    }
    
    console.log(`✅ 辅导员: ${counselor.name} (${counselor.username})`);
    console.log(`✅ 学员: ${student.name} (${student.username})\n`);
    
    console.log('=== 2. 检查分组关系 ===');
    // 查找冯芹作为LEADER的分组
    const counselorGroups = await prisma.groupMember.findMany({
      where: {
        userId: counselorId,
        role: 'LEADER'
      },
      include: {
        group: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            },
            members: {
              where: {
                userId: studentId,
                role: 'MEMBER'
              },
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    console.log(`🔍 冯芹担任组长的分组数量: ${counselorGroups.length}`);
    
    const sharedGroups = counselorGroups.filter(cg => cg.group.members.length > 0);
    console.log(`🔍 冯芹和吴静共同的分组数量: ${sharedGroups.length}`);
    
    if (sharedGroups.length === 0) {
      console.log('❌ 冯芹和吴静不在同一个分组中');
      console.log('❌ 需要先在项目分组中设置冯芹为组长，吴静为组员');
      return;
    }
    
    for (const group of sharedGroups) {
      console.log(`✅ 共同分组: ${group.group.name} (项目: ${group.group.project.name})`);
    }
    console.log();
    
    console.log('=== 3. 检查项目参与关系 ===');
    const projectIds = sharedGroups.map(g => g.group.project.id);
    
    for (const projectId of projectIds) {
      const projectName = sharedGroups.find(g => g.group.project.id === projectId)?.group.project.name;
      
      const counselorParticipation = await prisma.projectParticipant.findFirst({
        where: {
          projectId: projectId,
          userId: counselorId
        }
      });
      
      const studentParticipation = await prisma.projectParticipant.findFirst({
        where: {
          projectId: projectId,
          userId: studentId,
          role: 'STUDENT',
          status: 'ACTIVE'
        }
      });
      
      console.log(`项目 ${projectName}:`);
      console.log(`  冯芹参与: ${counselorParticipation ? '✅ ' + counselorParticipation.role : '❌ 未参与'}`);
      console.log(`  吴静参与: ${studentParticipation ? '✅ ' + studentParticipation.role : '❌ 未参与'}`);
    }
    console.log();
    
    console.log('=== 4. 检查作业任务 ===');
    // 先查看所有任务
    const allTasks = await prisma.trainingTask.findMany({
      where: {
        projectId: { in: projectIds }
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`🔍 相关项目中的所有任务数量: ${allTasks.length}`);
    
    if (allTasks.length > 0) {
      console.log('所有任务:');
      for (const task of allTasks) {
        console.log(`  📝 ${task.name} - 类型: ${task.type}, 状态: ${task.status} (项目: ${task.project.name})`);
      }
    }
    
    // 再查找作业任务
    const tasks = await prisma.trainingTask.findMany({
      where: {
        projectId: { in: projectIds },
        type: 'homework',
        status: { in: ['ACTIVE', 'PENDING'] } // 支持PENDING状态
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`🔍 作业任务 (type='homework', status=['ACTIVE','PENDING']) 数量: ${tasks.length}`);
    
    if (tasks.length === 0) {
      console.log('❌ 没有找到符合条件的作业任务');
      
      // 检查是否有其他类型的任务
      const homeworkTasks = allTasks.filter(t => t.type === 'homework');
      if (homeworkTasks.length > 0) {
        console.log(`💡 发现 ${homeworkTasks.length} 个 homework 类型的任务，但状态可能不是 ACTIVE:`);
        for (const task of homeworkTasks) {
          console.log(`   - ${task.name} (状态: ${task.status})`);
        }
      }
      
      return;
    }
    
    for (const task of tasks) {
      console.log(`📝 作业: ${task.name} (项目: ${task.project.name})`);
    }
    console.log();
    
    console.log('=== 5. 检查吴静的提交记录 ===');
    const taskIds = tasks.map(t => t.id);
    
    const submissions = await prisma.taskSubmission.findMany({
      where: {
        taskId: { in: taskIds },
        studentId: studentId
      },
      include: {
        task: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
    
    console.log(`🔍 吴静的提交记录数量: ${submissions.length}`);
    
    if (submissions.length === 0) {
      console.log('❌ 吴静还没有提交任何作业');
      console.log('💡 建议: 先让吴静在个人中心提交作业');
      return;
    }
    
    for (const submission of submissions) {
      console.log(`📋 提交: ${submission.task.name}`);
      console.log(`   状态: ${submission.status}`);
      console.log(`   提交时间: ${submission.submittedAt}`);
      console.log(`   内容: ${submission.content?.substring(0, 50)}...`);
    }
    console.log();
    
    console.log('=== 6. 模拟API调用 ===');
    console.log(`🔍 调用 API: /api/tasks/review?role=counselor&counselorId=${counselorId}`);
    
    // 这里应该与TaskService.getTasksForCounselorByGroup方法的逻辑一致
    const pendingSubmissions = submissions.filter(s => s.status === 'SUBMITTED');
    
    if (pendingSubmissions.length > 0) {
      console.log(`✅ 冯芹应该能看到 ${pendingSubmissions.length} 个待批阅的提交`);
      for (const sub of pendingSubmissions) {
        console.log(`   - ${sub.task.name} (吴静提交)`);
      }
    } else {
      console.log('❌ 没有待批阅的提交（可能都已经批阅过了）');
    }
    
    console.log('\n✅ 测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCounselorReviewWorkflow(); 