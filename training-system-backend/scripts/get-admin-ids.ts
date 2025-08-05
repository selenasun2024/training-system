import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getAdminIds() {
  try {
    console.log('🔍 查询所有管理员账户...\n');

    // 获取所有管理员用户
    const admins = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        userRoles: {
          some: {
            roleName: 'admin',
            status: 'ACTIVE'
          }
        }
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        department: true,
        userRoles: {
          where: {
            roleName: 'admin',
            status: 'ACTIVE'
          },
          select: {
            roleName: true,
            grantedAt: true
          }
        }
      }
    });

    if (admins.length === 0) {
      console.log('❌ 未找到任何管理员账户');
      return;
    }

    console.log(`✅ 找到 ${admins.length} 个管理员账户:\n`);

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name || admin.username}`);
      console.log(`   用户ID: ${admin.id}`);
      console.log(`   用户名: ${admin.username}`);
      console.log(`   邮箱: ${admin.email || '未设置'}`);
      console.log(`   部门: ${admin.department || '未设置'}`);
      console.log(`   角色分配时间: ${admin.userRoles[0]?.grantedAt || '未知'}`);
      console.log('');
    });

    console.log('📋 测试命令示例:');
    console.log('');
    console.log('1. 获取管理员观察概览:');
    console.log(`   GET /api/observations/admin/overview?adminId=${admins[0].id}`);
    console.log('');
    
    console.log('2. 管理员访问指定辅导员数据:');
    console.log(`   GET /api/observations/counselor/counselor-001?requesterId=${admins[0].id}`);
    console.log('');

    console.log('3. 前端localStorage设置 (用于测试):');
    console.log(`   localStorage.setItem('userId', '${admins[0].id}');`);
    console.log(`   localStorage.setItem('username', '${admins[0].username}');`);
    console.log(`   localStorage.setItem('userRole', 'admin');`);

  } catch (error) {
    console.error('❌ 获取管理员信息失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAdminIds(); 