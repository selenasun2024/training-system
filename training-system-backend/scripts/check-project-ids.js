const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProjectIds() {
  try {
    console.log('=== 检查项目ID ===\n');

    // 获取所有项目
    const projects = await prisma.trainingProject.findMany({
      select: {
        id: true,
        name: true,
        projectNo: true,
      },
    });

    console.log('📊 所有项目:');
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ID: ${project.id}`);
      console.log(`   名称: ${project.name}`);
      console.log(`   项目编号: ${project.projectNo}\n`);
    });

    // 检查有观察记录的项目
    const projectsWithObservations = await prisma.observationRecord.findMany({
      select: {
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      distinct: ['projectId'],
    });

    console.log('📝 有观察记录的项目:');
    projectsWithObservations.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.projectId}`);
      console.log(`   名称: ${item.project.name}\n`);
    });

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectIds(); 