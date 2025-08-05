import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateObserverIds() {
  console.log('🔄 开始更新观察记录中的观察者ID...');
  
  try {
    // 查看当前数据状态
    const beforeCount = await prisma.observationRecord.count({
      where: { observerId: 'counselor-001' }
    });
    
    console.log(`📊 找到 ${beforeCount} 条使用 counselor-001 的观察记录`);
    
    if (beforeCount === 0) {
      console.log('✅ 没有需要更新的记录');
      return;
    }
    
    // 执行更新
    const updateResult = await prisma.observationRecord.updateMany({
      where: { observerId: 'counselor-001' },
      data: { observerId: 'user-hr-001' }
    });
    
    console.log(`✅ 成功更新 ${updateResult.count} 条记录`);
    
    // 验证更新结果
    const afterCount = await prisma.observationRecord.count({
      where: { observerId: 'user-hr-001' }
    });
    
    console.log(`📊 更新后：${afterCount} 条记录使用 user-hr-001`);
    
    // 显示按观察者分组的统计
    const stats = await prisma.observationRecord.groupBy({
      by: ['observerId', 'projectId'],
      _count: true,
      orderBy: [
        { observerId: 'asc' },
        { projectId: 'asc' }
      ]
    });
    
    console.log('📊 观察记录统计:');
    stats.forEach(stat => {
      console.log(`  观察者: ${stat.observerId}, 项目: ${stat.projectId}, 记录数: ${stat._count}`);
    });
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateObserverIds().catch(console.error); 