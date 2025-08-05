const { PrismaClient } = require('@prisma/client');

async function simpleTest() {
  const prisma = new PrismaClient();
  
  try {
    const counselorId = 'user-hr-001'; // 冯芹
    const studentId = 'user-market-001'; // 吴静
    
    console.log('🔍 简化测试...');
    
    // 查找分组关系
    const groups = await prisma.groupMember.findMany({
      where: {
        userId: counselorId,
        role: 'LEADER'
      },
      include: {
        group: {
          include: {
            project: true,
            members: {
              where: { userId: studentId, role: 'MEMBER' }
            }
          }
        }
      }
    });
    
    console.log('分组数量:', groups.length);
    const sharedGroup = groups.find(g => g.group.members.length > 0);
    
    if (sharedGroup) {
      console.log('找到共同分组:', sharedGroup.group.name);
      console.log('项目:', sharedGroup.group.project.name);
      
      // 查找任务
      const tasks = await prisma.trainingTask.findMany({
        where: {
          projectId: sharedGroup.group.project.id,
          type: 'homework'
        }
      });
      
      console.log('任务数量:', tasks.length);
      
      if (tasks.length > 0) {
        // 查找提交
        const submissions = await prisma.taskSubmission.findMany({
          where: {
            taskId: { in: tasks.map(t => t.id) },
            studentId: studentId,
            status: 'SUBMITTED'
          }
        });
        
        console.log('待批阅提交数量:', submissions.length);
      }
    }
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleTest(); 