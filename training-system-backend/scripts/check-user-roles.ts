import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRoles() {
  try {
    console.log('🔍 查询数据库中的用户和角色数据...\n');

    // 查询所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        userRoles: {
          where: {
            status: 'ACTIVE',
            revokedAt: null,
          },
          select: {
            roleName: true,
          },
        },
      },
    });

    console.log(`📊 总共找到 ${users.length} 个用户:\n`);

    users.forEach((user, index) => {
      const roles = user.userRoles.map(ur => ur.roleName).join(', ');
      console.log(`${index + 1}. ${user.name} (${user.username})`);
      console.log(`   角色: ${roles || '无角色'}`);
      console.log('');
    });

    // 专门查询辅导员
    const counselors = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            roleName: 'counselor',
            status: 'ACTIVE',
            revokedAt: null,
          },
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
      },
    });

    console.log(`\n👨‍🏫 辅导员用户数量: ${counselors.length}`);
    counselors.forEach((counselor, index) => {
      console.log(`${index + 1}. ${counselor.name} (${counselor.username})`);
    });

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoles(); 