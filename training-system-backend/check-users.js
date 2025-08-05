const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 检查数据库中的用户...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true
      },
      take: 20
    });
    
    console.log('✅ 找到用户:', users.length, '个');
    users.forEach(user => {
      console.log(`  - ${user.id}: ${user.name} (${user.department})`);
    });
    
    // 检查特定用户
    const mentor1 = await prisma.user.findUnique({
      where: { id: 'mentor1' }
    });
    
    const userHr001 = await prisma.user.findUnique({
      where: { id: 'user-hr-001' }
    });
    
    console.log('\n🔍 检查测试用户:');
    console.log('  mentor1:', mentor1 ? '存在' : '不存在');
    console.log('  user-hr-001:', userHr001 ? '存在' : '不存在');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ 查询用户失败:', error.message);
    await prisma.$disconnect();
  }
}

checkUsers(); 