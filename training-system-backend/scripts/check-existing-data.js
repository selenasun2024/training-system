const { PrismaClient } = require('@prisma/client');

async function checkExistingData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 检查现有数据状态...\n');
    
    // 1. 查找冯芹和吴静的用户信息
    console.log('1. 用户信息:');
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { in: ['冯芹', '吴静'] } },
          { username: { in: ['feng-qin', 'wujing'] } }
        ]
      },
      select: {
        id: true,
        username: true,
        name: true,
        department: true,
        position: true
      }
    });
    
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.username}) [${user.id}]`);
    });
    console.log();
    
    // 2. 查找新员工入职培训项目
    console.log('2. 新员工入职培训项目:');
    const projects = await prisma.trainingProject.findMany({
      where: {
        name: { contains: '新员工入职培训' }
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    });
    
    projects.forEach(project => {
      console.log(`  - ${project.name} [${project.id}] - 状态: ${project.status}`);
    });
    console.log();
    
    // 3. 查找项目参与者关系
    if (projects.length > 0 && users.length > 0) {
      const projectId = projects[0].id;
      const userIds = users.map(u => u.id);
      
      console.log('3. 项目参与情况:');
      const participants = await prisma.projectParticipant.findMany({
        where: {
          projectId: projectId,
          userId: { in: userIds }
        },
        include: {
          user: {
            select: { name: true, username: true }
          },
          project: {
            select: { name: true }
          }
        }
      });
      
      participants.forEach(p => {
        console.log(`  - ${p.user.name}: ${p.role} (状态: ${p.status})`);
      });
      console.log();
      
      // 4. 查找项目中的作业任务
      console.log('4. 项目作业任务:');
      const tasks = await prisma.trainingTask.findMany({
        where: {
          projectId: projectId,
          type: 'homework'
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true
        }
      });
      
      tasks.forEach(task => {
        console.log(`  - ${task.name} [${task.id}] - 类型: ${task.type}, 状态: ${task.status}`);
      });
      console.log();
      
      // 5. 查找提交记录
      if (tasks.length > 0) {
        console.log('5. 作业提交记录:');
        const submissions = await prisma.taskSubmission.findMany({
          where: {
            taskId: { in: tasks.map(t => t.id) }
          },
          include: {
            student: {
              select: { name: true, username: true }
            },
            task: {
              select: { name: true }
            }
          },
          orderBy: { submittedAt: 'desc' }
        });
        
        if (submissions.length > 0) {
          submissions.forEach(sub => {
            console.log(`  - ${sub.student.name} 提交了 "${sub.task.name}" (状态: ${sub.status}) - ${sub.submittedAt}`);
          });
        } else {
          console.log('  - 暂无提交记录');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingData(); 