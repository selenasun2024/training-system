import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCounselorIds() {
  try {
    console.log('🔍 查询辅导员详细信息...\n');

    // 查询所有辅导员
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
        email: true,
        department: true,
      },
    });

    console.log(`👨‍🏫 找到 ${counselors.length} 名辅导员:\n`);

    counselors.forEach((counselor, index) => {
      console.log(`${index + 1}. ${counselor.name} (${counselor.username})`);
      console.log(`   ID: ${counselor.id}`);
      console.log(`   邮箱: ${counselor.email || '未设置'}`);
      console.log(`   部门: ${counselor.department || '未设置'}`);
      console.log('');
    });

    // 为了方便前端测试，输出一个测试用的localStorage设置代码
    if (counselors.length > 0) {
      const firstCounselor = counselors[0];
      console.log('🔧 前端测试用代码 (在浏览器控制台执行):');
      console.log(`localStorage.setItem('userId', '${firstCounselor.id}');`);
      console.log(`localStorage.setItem('username', '${firstCounselor.username}');`);
      console.log(`console.log('已切换到辅导员身份: ${firstCounselor.name}');`);
    }

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCounselorIds(); 