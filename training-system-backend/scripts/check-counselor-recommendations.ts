import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCounselorRecommendations() {
  console.log('🔍 检查辅导员推荐记录问题...\n');
  
  try {
    // 1. 检查辅导员推荐记录
    const recommendations = await prisma.recommendation.findMany({
      where: {
        counselorId: 'user-hr-001' // 冯芹的ID
      },
      select: {
        id: true,
        projectId: true,
        studentId: true,
        counselorId: true,
        type: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log(`📊 辅导员 user-hr-001 的推荐记录数量: ${recommendations.length}`);
    if (recommendations.length > 0) {
      console.log('📊 推荐记录详情:');
      recommendations.forEach(rec => {
        console.log(`  推荐ID: ${rec.id.substring(0, 8)}...`);
        console.log(`  项目ID: ${rec.projectId}`);
        console.log(`  学员ID: ${rec.studentId}`);
        console.log(`  类型: ${rec.type}`);
        console.log(`  状态: ${rec.status}`);
        console.log(`  创建时间: ${rec.createdAt.toLocaleString()}`);
        console.log('');
      });
    }
    
    // 2. 检查辅导员参与的项目
    console.log('📊 检查辅导员参与的项目...');
    const projectParticipants = await prisma.projectParticipant.findMany({
      where: {
        userId: 'user-hr-001',
        role: 'COUNSELOR'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
    
    console.log(`📊 辅导员参与的项目数量: ${projectParticipants.length}`);
    if (projectParticipants.length > 0) {
      console.log('📊 参与项目详情:');
      projectParticipants.forEach(pp => {
        console.log(`  项目ID: ${pp.project.id}`);
        console.log(`  项目名称: ${pp.project.name}`);
        console.log(`  项目状态: ${pp.project.status}`);
        console.log(`  参与角色: ${pp.role}`);
        console.log('');
      });
    }
    
    // 3. 检查观察记录
    console.log('📊 检查辅导员的观察记录...');
    const observationRecords = await prisma.observationRecord.findMany({
      where: {
        observerId: 'user-hr-001'
      },
      select: {
        id: true,
        projectId: true,
        studentId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    console.log(`📊 辅导员的观察记录数量: ${observationRecords.length}`);
    if (observationRecords.length > 0) {
      console.log('📊 最近的观察记录:');
      observationRecords.forEach(obs => {
        console.log(`  观察记录ID: ${obs.id.substring(0, 8)}...`);
        console.log(`  项目ID: ${obs.projectId}`);
        console.log(`  学员ID: ${obs.studentId}`);
        console.log(`  创建时间: ${obs.createdAt.toLocaleString()}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCounselorRecommendations(); 