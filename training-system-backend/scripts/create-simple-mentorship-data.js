const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSimpleMentorshipData() {
  console.log('🔍 检查师徒关系数据...');

  try {
    // 1. 检查现有师徒关系数据
    const existingRelationships = await prisma.mentorshipRelationship.count();
    console.log(`📊 现有师徒关系数量: ${existingRelationships}`);

    if (existingRelationships > 0) {
      const relationships = await prisma.mentorshipRelationship.findMany({
        take: 5,
        include: {
          mentor: { select: { id: true, name: true, department: true } },
          student: { select: { id: true, name: true, department: true } }
        }
      });
      console.log('📋 现有师徒关系:', relationships);
      return;
    }

    // 2. 检查可用的培训项目
    const trainingProjects = await prisma.trainingProject.findMany({
      take: 5,
      select: { id: true, name: true, status: true }
    });
    console.log('📋 可用培训项目:', trainingProjects);

    if (trainingProjects.length === 0) {
      console.log('❌ 没有培训项目，无法创建师徒关系');
      return;
    }

    // 3. 检查可用用户
    const users = await prisma.user.findMany({
      where: { 
        status: 'ACTIVE',
        department: { not: null }
      },
      select: { id: true, name: true, department: true, position: true },
      take: 10
    });
    console.log('👥 可用用户:', users);

    if (users.length < 2) {
      console.log('❌ 用户数量不足，无法创建师徒关系');
      return;
    }

    // 4. 创建或查找MentorshipProject
    const firstProject = trainingProjects[0];
    console.log(`🎯 使用项目: ${firstProject.name} (${firstProject.id})`);

    let mentorshipProject = await prisma.mentorshipProject.findFirst({
      where: { sourceTrainingProjectId: firstProject.id }
    });

    if (!mentorshipProject) {
      console.log('🆕 创建MentorshipProject...');
      mentorshipProject = await prisma.mentorshipProject.create({
        data: {
          id: `mp-${Date.now()}`,
          name: `${firstProject.name}-师徒项目`,
          sourceTrainingProjectId: firstProject.id,
          description: '测试师徒关系项目',
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天后
          createdBy: 'system'
        }
      });
      console.log('✅ MentorshipProject创建成功:', mentorshipProject.id);
    }

    // 5. 创建师徒关系
    const mentors = users.filter(u => u.position && u.position.includes('导师') || u.position?.includes('经理'));
    const students = users.filter(u => !mentors.includes(u));

    console.log(`👨‍🏫 潜在导师: ${mentors.length}个`, mentors.map(m => m.name));
    console.log(`👨‍🎓 潜在学员: ${students.length}个`, students.map(s => s.name));

    // 如果没有明确的导师，就从前几个用户中选择
    if (mentors.length === 0 && users.length >= 2) {
      mentors.push(users[0]);
      students.push(...users.slice(1));
    }

    const relationships = [];
    const maxRelationships = Math.min(mentors.length, students.length, 3);

    for (let i = 0; i < maxRelationships; i++) {
      const mentor = mentors[i % mentors.length];
      const student = students[i];

      const relationshipData = {
        id: `rel-test-${Date.now()}-${i}`,
        projectId: mentorshipProject.id,
        projectType: 'TRAINING_PROJECT',
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorType: 'DEPARTMENT_ASSIGNED',
        studentId: student.id,
        studentName: student.name,
        relationshipType: 'ONE_TO_ONE',
        scope: 'PROJECT_WIDE',
        matchingType: 'MANUAL',
        matchingReasons: [],
        matchingCriteria: {},
        establishedDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // 每个关系间隔一天
        expectedDuration: 90,
        status: i === 0 ? 'COMPLETED' : 'ACTIVE', // 第一个设置为已完成，其他为进行中
        totalInteractions: Math.floor(Math.random() * 10) + 1,
        completedMilestones: Math.floor(Math.random() * 5),
        totalMilestones: 8,
        createdBy: 'system'
      };

      const relationship = await prisma.mentorshipRelationship.create({
        data: relationshipData,
        include: {
          mentor: { select: { id: true, name: true, department: true } },
          student: { select: { id: true, name: true, department: true } }
        }
      });

      relationships.push(relationship);
      console.log(`✅ 创建师徒关系 ${i + 1}: ${mentor.name} → ${student.name}`);
    }

    console.log(`🎉 成功创建 ${relationships.length} 个师徒关系`);

    // 6. 验证创建结果
    const finalCount = await prisma.mentorshipRelationship.count();
    console.log(`📊 最终师徒关系数量: ${finalCount}`);

  } catch (error) {
    console.error('❌ 创建师徒关系数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleMentorshipData(); 