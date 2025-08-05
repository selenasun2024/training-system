import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProjectIds() {
  console.log('🔍 检查推荐记录中的项目ID...\n');
  
  try {
    const recommendations = await prisma.recommendation.findMany({
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
    
    console.log(`📊 推荐记录详情 (${recommendations.length} 条):`);
    recommendations.forEach(rec => {
      console.log(`  推荐ID: ${rec.id.substring(0, 8)}...`);
      console.log(`  项目ID: ${rec.projectId}`);
      console.log(`  学员ID: ${rec.studentId}`);
      console.log(`  辅导员ID: ${rec.counselorId}`);
      console.log(`  类型: ${rec.type}`);
      console.log(`  状态: ${rec.status}`);
      console.log(`  创建时间: ${rec.createdAt.toLocaleString()}`);
      console.log('');
    });
    
    // 统计项目ID
    const projectIds = [...new Set(recommendations.map(r => r.projectId))];
    console.log(`📊 涉及的项目ID: ${projectIds.join(', ')}`);
    
    if (projectIds.length > 0) {
      console.log(`\n💡 管理员查询时需要使用这些项目ID才能看到推荐记录:`);
      projectIds.forEach(id => {
        console.log(`  - ${id}`);
      });
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectIds(); 