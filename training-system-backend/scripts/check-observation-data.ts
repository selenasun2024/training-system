import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkObservationData() {
  console.log('🔍 检查观察记录数据...');
  
  try {
    // 检查观察记录总数
    const totalCount = await prisma.observationRecord.count();
    console.log(`📊 观察记录总数: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('⚠️ 没有找到任何观察记录');
      return;
    }
    
    // 按观察者分组统计
    const observerStats = await prisma.observationRecord.groupBy({
      by: ['observerId'],
      _count: true,
      orderBy: { observerId: 'asc' }
    });
    
    console.log('📊 按观察者统计:');
    observerStats.forEach(stat => {
      console.log(`  观察者ID: ${stat.observerId}, 记录数: ${stat._count}`);
    });
    
    // 按项目分组统计
    const projectStats = await prisma.observationRecord.groupBy({
      by: ['projectId'],
      _count: true,
      orderBy: { projectId: 'asc' }
    });
    
    console.log('📊 按项目统计:');
    projectStats.forEach(stat => {
      console.log(`  项目ID: ${stat.projectId}, 记录数: ${stat._count}`);
    });
    
    // 显示前几条记录的详细信息
    const sampleRecords = await prisma.observationRecord.findMany({
      take: 5,
      select: {
        id: true,
        observerId: true,
        studentId: true,
        projectId: true,
        content: true,
        tags: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📊 示例记录:');
    sampleRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. 观察者: ${record.observerId}, 学员: ${record.studentId}, 项目: ${record.projectId}`);
      console.log(`     内容: ${record.content}`);
      console.log(`     标签: ${JSON.stringify(record.tags)}`);
      console.log(`     时间: ${record.createdAt}`);
      console.log('');
    });
    
    // 检查是否有user-hr-001的记录
    const userHrRecords = await prisma.observationRecord.count({
      where: { observerId: 'user-hr-001' }
    });
    console.log(`📊 user-hr-001的观察记录数: ${userHrRecords}`);
    
    // 检查是否有counselor-001的记录
    const counselorRecords = await prisma.observationRecord.count({
      where: { observerId: 'counselor-001' }
    });
    console.log(`📊 counselor-001的观察记录数: ${counselorRecords}`);
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkObservationData().catch(console.error); 