import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllProjects() {
  try {
    const projects = await prisma.trainingProject.findMany({
      select: {
        id: true,
        name: true,
        status: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('📋 数据库中的所有项目:');
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} (ID: ${project.id}, 状态: ${project.status})`);
    });

  } catch (error) {
    console.error('❌ 查询项目时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllProjects(); 