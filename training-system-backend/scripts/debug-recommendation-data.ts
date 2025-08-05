import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugRecommendationData() {
  try {
    console.log('=== 推荐记录详细调试 ===\n');
    
    const projectId = '7d38a303-81ad-4246-80f1-c36310920363';
    const counselorId = 'user-hr-001';
    const studentId = 'user-prod-002';
    
    // 1. 检查该学生的所有推荐记录
    console.log('1. 该学生的所有推荐记录：');
    const allStudentRecommendations = await prisma.recommendation.findMany({
      where: {
        studentId: studentId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`学生 ${studentId} 的所有推荐记录 (${allStudentRecommendations.length} 条):`);
    allStudentRecommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ID: ${rec.id}`);
      console.log(`     类型: ${rec.type}`);
      console.log(`     状态: ${rec.status}`);
      console.log(`     推荐人: ${rec.counselorId}`);
      console.log(`     项目ID: ${rec.projectId}`);
      console.log(`     创建时间: ${rec.createdAt}`);
      console.log(`     更新时间: ${rec.updatedAt}`);
      console.log('');
    });
    
    // 2. 检查该项目的所有推荐记录
    console.log('2. 该项目的所有推荐记录：');
    const allProjectRecommendations = await prisma.recommendation.findMany({
      where: {
        projectId: projectId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`项目 ${projectId} 的所有推荐记录 (${allProjectRecommendations.length} 条):`);
    allProjectRecommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ID: ${rec.id}`);
      console.log(`     学生: ${rec.studentId}`);
      console.log(`     类型: ${rec.type}`);
      console.log(`     状态: ${rec.status}`);
      console.log(`     推荐人: ${rec.counselorId}`);
      console.log(`     创建时间: ${rec.createdAt}`);
      console.log(`     更新时间: ${rec.updatedAt}`);
      console.log('');
    });
    
    // 3. 检查该辅导员的所有推荐记录
    console.log('3. 该辅导员的所有推荐记录：');
    const allCounselorRecommendations = await prisma.recommendation.findMany({
      where: {
        counselorId: counselorId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`辅导员 ${counselorId} 的所有推荐记录 (${allCounselorRecommendations.length} 条):`);
    allCounselorRecommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ID: ${rec.id}`);
      console.log(`     学生: ${rec.studentId}`);
      console.log(`     类型: ${rec.type}`);
      console.log(`     状态: ${rec.status}`);
      console.log(`     项目ID: ${rec.projectId}`);
      console.log(`     创建时间: ${rec.createdAt}`);
      console.log(`     更新时间: ${rec.updatedAt}`);
      console.log('');
    });
    
    // 4. 检查是否有重复或冲突的记录
    console.log('4. 重复记录检查：');
    const duplicateCheck = await prisma.recommendation.groupBy({
      by: ['studentId', 'projectId', 'counselorId'],
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    if (duplicateCheck.length > 0) {
      console.log('发现重复记录：');
      duplicateCheck.forEach(dup => {
        console.log(`  学生: ${dup.studentId}, 项目: ${dup.projectId}, 辅导员: ${dup.counselorId}, 数量: ${dup._count.id}`);
      });
    } else {
      console.log('没有发现重复记录');
    }
    
    // 5. 检查最近的记录变更
    console.log('5. 最近24小时的记录变更：');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentChanges = await prisma.recommendation.findMany({
      where: {
        updatedAt: {
          gte: yesterday
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    console.log(`最近24小时变更的记录 (${recentChanges.length} 条):`);
    recentChanges.forEach((rec, index) => {
      console.log(`  ${index + 1}. ID: ${rec.id}`);
      console.log(`     学生: ${rec.studentId}`);
      console.log(`     类型: ${rec.type}`);
      console.log(`     状态: ${rec.status}`);
      console.log(`     推荐人: ${rec.counselorId}`);
      console.log(`     项目ID: ${rec.projectId}`);
      console.log(`     创建时间: ${rec.createdAt}`);
      console.log(`     更新时间: ${rec.updatedAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('调试推荐数据时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRecommendationData(); 