import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createObservationRecords() {
  console.log('🔄 为 user-hr-001 创建观察记录...');
  
  try {
    // 项目信息
    const project111Id = '7d38a303-81ad-4246-80f1-c36310920363'; // 111
    const projectTrainingId = '4bcf4bb2-2b78-4408-9687-e515cbff5da8'; // 新员工入职培训
    
    // 创建观察记录 - 项目 "111" 中
    const record1 = await prisma.observationRecord.create({
      data: {
        id: `obs-${Date.now()}-1`,
        observerId: 'user-hr-001',
        studentId: 'user-prod-002', // 孙悦 - 项目111中的成员
        projectId: project111Id,
        type: 'DAILY',
        title: '团队协作观察',
        content: '在小组讨论中表现积极，能够主动分享观点，协作能力强',
        tags: ['积极参与', '协作能力强', '沟通良好'],
        visibility: 'PUBLIC'
      }
    });
    
    const record2 = await prisma.observationRecord.create({
      data: {
        id: `obs-${Date.now()}-2`,
        observerId: 'user-hr-001',
        studentId: 'user-prod-002', // 孙悦
        projectId: project111Id,
        type: 'WEEKLY',
        title: '技能表现观察',
        content: '技术掌握扎实，解决问题思路清晰，有一定的创新思维',
        tags: ['技术扎实', '思路清晰', '创新思维'],
        visibility: 'PUBLIC'
      }
    });
    
    // 创建观察记录 - 项目 "新员工入职培训" 中
    // 首先查找该项目中的学员
    const trainingProjectGroups = await prisma.trainingGroup.findMany({
      where: {
        projectId: projectTrainingId,
        members: {
          some: {
            userId: 'user-hr-001',
            role: 'LEADER'
          }
        }
      },
      include: {
        members: {
          where: {
            role: 'MEMBER'
          },
          include: {
            user: true
          }
        }
      }
    });
    
    console.log('📋 新员工入职培训项目中冯芹负责的分组和成员:');
    let studentsInTraining: string[] = [];
    trainingProjectGroups.forEach(group => {
      console.log(`  分组: ${group.name}`);
      group.members.forEach(member => {
        console.log(`    学员: ${member.user.name} (${member.user.id})`);
        studentsInTraining.push(member.user.id);
      });
    });
    
    // 为新员工入职培训项目创建观察记录
    if (studentsInTraining.length > 0) {
      const studentId = studentsInTraining[0]; // 选择第一个学员
      
             const record3 = await prisma.observationRecord.create({
         data: {
           id: `obs-${Date.now()}-3`,
           observerId: 'user-hr-001',
           studentId: studentId,
           projectId: projectTrainingId,
           type: 'MILESTONE',
           title: '入职表现观察',
           content: '学习态度认真，适应能力强，能够快速融入团队',
           tags: ['学习态度好', '适应能力强', '团队融入快'],
           visibility: 'PUBLIC'
         }
       });
      
      console.log('✅ 成功创建观察记录:');
      console.log(`  - 记录1: 项目111 - 孙悦 - 团队协作观察`);
      console.log(`  - 记录2: 项目111 - 孙悦 - 技能表现观察`);
      console.log(`  - 记录3: 新员工入职培训 - ${studentId} - 入职表现观察`);
    } else {
      console.log('⚠️ 在新员工入职培训项目中未找到冯芹负责的学员');
      console.log('✅ 已创建2条观察记录:');
      console.log(`  - 记录1: 项目111 - 孙悦 - 团队协作观察`);
      console.log(`  - 记录2: 项目111 - 孙悦 - 技能表现观察`);
    }
    
    // 验证创建结果
    const newRecordsCount = await prisma.observationRecord.count({
      where: { observerId: 'user-hr-001' }
    });
    
    console.log(`\n📊 user-hr-001 现在共有 ${newRecordsCount} 条观察记录`);
    
  } catch (error) {
    console.error('❌ 创建观察记录失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createObservationRecords().catch(console.error); 