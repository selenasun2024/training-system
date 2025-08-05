const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== 检查用户数据 ===');
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true }
    });
    console.log('用户列表:', users);

    console.log('\n=== 检查项目数据 ===');
    const projects = await prisma.trainingProject.findMany({
      select: { id: true, name: true, status: true, ownerId: true }
    });
    console.log('项目列表:', projects);

    console.log('\n=== 检查项目参与者数据 ===');
    const participants = await prisma.projectParticipant.findMany({
      include: {
        user: { select: { username: true, name: true } },
        project: { select: { name: true } }
      }
    });
    console.log('参与者列表:', participants);
    
  } catch (error) {
    console.error('检查数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 