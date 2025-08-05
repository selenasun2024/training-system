import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCounselorToProject() {
  try {
    console.log('🔍 为新员工入职培训项目添加辅导员...\n');

    // 查找新项目
    const newProject = await prisma.trainingProject.findFirst({
      where: {
        name: {
          contains: '新员工入职培训'
        }
      }
    });

    if (!newProject) {
      console.log('❌ 没有找到新员工入职培训项目');
      return;
    }

    console.log(`📋 找到项目: ${newProject.name} (${newProject.id})`);

    // 添加辅导员到项目
    const counselorIds = ['counselor-001', 'counselor-002'];

    for (const counselorId of counselorIds) {
      // 检查辅导员是否已经存在
      const existingParticipant = await prisma.projectParticipant.findFirst({
        where: {
          projectId: newProject.id,
          userId: counselorId,
          role: 'COUNSELOR'
        }
      });

      if (existingParticipant) {
        console.log(`✅ 辅导员 ${counselorId} 已存在于项目中`);
        continue;
      }

      // 添加辅导员
      await prisma.projectParticipant.create({
        data: {
          projectId: newProject.id,
          userId: counselorId,
          role: 'COUNSELOR',
          joinedAt: new Date()
        }
      });

      console.log(`✅ 成功添加辅导员 ${counselorId} 到项目`);
    }

    // 验证添加结果
    const participants = await prisma.projectParticipant.findMany({
      where: {
        projectId: newProject.id
      },
      include: {
        user: {
          select: {
            username: true,
            name: true
          }
        }
      }
    });

    console.log('\n👥 项目参与者更新后:');
    participants.forEach(p => {
      console.log(`  - ${p.user.username} (${p.user.name}): ${p.role}`);
    });

    // 检查辅导员数量
    const counselors = participants.filter(p => p.role === 'COUNSELOR');
    const students = participants.filter(p => p.role === 'STUDENT');

    console.log('\n📊 统计结果:');
    console.log(`  - 辅导员数量: ${counselors.length}`);
    console.log(`  - 学员数量: ${students.length}`);

    if (counselors.length > 0 && students.length > 0) {
      console.log('✅ 项目现在具备了生成观察目标的条件！');
    } else {
      console.log('❌ 项目仍缺少必要条件');
    }

  } catch (error) {
    console.error('❌ 添加辅导员时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCounselorToProject(); 