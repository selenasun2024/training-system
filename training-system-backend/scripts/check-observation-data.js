const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkObservationData() {
  try {
    console.log('=== 检查观察记录数据 ===\n');

    // 1. 统计观察记录数量
    const stats = await prisma.observationRecord.aggregate({
      _count: {
        id: true,
      },
    });

    const uniqueStudents = await prisma.observationRecord.findMany({
      select: {
        studentId: true,
      },
      distinct: ['studentId'],
    });

    const uniqueProjects = await prisma.observationRecord.findMany({
      select: {
        projectId: true,
      },
      distinct: ['projectId'],
    });

    console.log('📊 观察记录统计:');
    console.log(`- 总观察记录数: ${stats._count.id}`);
    console.log(`- 有观察记录的学生数: ${uniqueStudents.length}`);
    console.log(`- 有观察记录的项目数: ${uniqueProjects.length}\n`);

    // 2. 获取最近的观察记录
    const recentObservations = await prisma.observationRecord.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        observer: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('📝 最近的观察记录:');
    recentObservations.forEach((obs, index) => {
      console.log(`${index + 1}. [${obs.project.name}] ${obs.student.name} - ${obs.title}`);
      console.log(`   观察者: ${obs.observer.name}`);
      console.log(`   类型: ${obs.type}, 评分: ${obs.score || '未评分'}`);
      console.log(`   时间: ${obs.createdAt.toLocaleString()}\n`);
    });

    // 3. 按项目统计观察记录
    const projectStats = await prisma.observationRecord.groupBy({
      by: ['projectId'],
      _count: {
        id: true,
      },
    });

    console.log('📊 按项目统计观察记录:');
    for (const stat of projectStats) {
      const project = await prisma.trainingProject.findUnique({
        where: { id: stat.projectId },
        select: { name: true },
      });
      
      const uniqueStudentsInProject = await prisma.observationRecord.findMany({
        where: { projectId: stat.projectId },
        select: { studentId: true },
        distinct: ['studentId'],
      });

      console.log(`- ${project?.name || '未知项目'}: ${stat._count.id} 条记录, ${uniqueStudentsInProject.length} 名学生`);
    }

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkObservationData(); 