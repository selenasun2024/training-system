const { PrismaClient } = require('@prisma/client');

async function testWujingTasks() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 测试吴静的作业任务获取...\n');
    
    const userId = 'user-market-001'; // 吴静的正确用户ID
    
    // 1. 验证吴静用户是否存在
    console.log('1. 检查吴静用户:');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, name: true }
    });
    
    if (!user) {
      console.log('❌ 用户不存在，需要先创建吴静用户');
      return;
    }
    
    console.log(`✅ 找到用户: ${user.name} (${user.username}) [${user.id}]`);
    console.log();
    
    // 2. 查找吴静参与的项目
    console.log('2. 吴静参与的项目:');
    const participations = await prisma.projectParticipant.findMany({
      where: { 
        userId: userId,
        status: 'ACTIVE',
        role: 'STUDENT'
      },
      include: {
        project: {
          select: { id: true, name: true, status: true }
        }
      }
    });
    
    if (participations.length === 0) {
      console.log('❌ 吴静没有参与任何项目作为学员');
      return;
    }
    
    participations.forEach(p => {
      console.log(`  - ${p.project.name} [${p.project.id}] - 角色: ${p.role}, 状态: ${p.status}`);
    });
    console.log();
    
    // 3. 查找这些项目中的作业任务
    console.log('3. 可用的作业任务:');
    const projectIds = participations.map(p => p.projectId);
    
    const tasks = await prisma.trainingTask.findMany({
      where: {
        projectId: { in: projectIds },
        type: 'homework',
        status: 'ACTIVE'
      },
      include: {
        stage: {
          select: { id: true, name: true, type: true }
        },
        project: {
          select: { name: true }
        }
      },
      orderBy: [
        { stage: { sequence: 'asc' } },
        { sequence: 'asc' }
      ]
    });
    
    if (tasks.length === 0) {
      console.log('❌ 没有找到作业任务');
      return;
    }
    
    tasks.forEach(task => {
      console.log(`  - ${task.name} [${task.id}]`);
      console.log(`    项目: ${task.project.name}`);
      console.log(`    阶段: ${task.stage?.name || '无阶段'} (${task.stage?.type || 'N/A'})`);
      console.log(`    状态: ${task.status}`);
      console.log();
    });
    
    // 4. 检查现有提交记录
    console.log('4. 现有提交记录:');
    const submissions = await prisma.taskSubmission.findMany({
      where: {
        studentId: userId,
        taskId: { in: tasks.map(t => t.id) }
      },
      include: {
        task: {
          select: { name: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
    
    if (submissions.length === 0) {
      console.log('  - 暂无提交记录');
    } else {
      submissions.forEach(sub => {
        console.log(`  - "${sub.task.name}" - 状态: ${sub.status} (${sub.submittedAt})`);
      });
    }
    
    console.log('\n✅ 测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWujingTasks(); 