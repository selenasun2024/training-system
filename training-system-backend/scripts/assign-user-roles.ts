import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignUserRoles() {
  try {
    console.log('🔄 开始为用户分配角色...\n');

    // 获取管理员用户作为角色分配者
    const adminUser = await prisma.user.findFirst({
      where: {
        username: 'admin'
      }
    });

    if (!adminUser) {
      console.error('❌ 未找到管理员用户，无法分配角色');
      return;
    }

    console.log(`✅ 使用管理员 ${adminUser.name} (${adminUser.username}) 分配角色\n`);

    // 角色分配规则
    const roleAssignments = [
      // 管理员角色
      { username: 'admin', roleName: 'admin' },
      { username: 'admin001', roleName: 'admin' },
      
      // 辅导员角色
      { username: 'counselor001', roleName: 'counselor' },
      { username: 'counselor002', roleName: 'counselor' },
      
      // 学生角色
      { username: 'student001', roleName: 'student' },
      { username: 'student002', roleName: 'student' },
      { username: 'student003', roleName: 'student' },
      { username: 'student004', roleName: 'student' },
    ];

    let successCount = 0;

    for (const assignment of roleAssignments) {
      try {
        // 查找用户
        const user = await prisma.user.findUnique({
          where: { username: assignment.username }
        });

        if (!user) {
          console.log(`⚠️  用户 ${assignment.username} 不存在，跳过`);
          continue;
        }

        // 检查是否已经有该角色
        const existingRole = await prisma.userRole.findFirst({
          where: {
            userId: user.id,
            roleName: assignment.roleName as any,
            status: 'ACTIVE',
          }
        });

        if (existingRole) {
          console.log(`ℹ️  用户 ${user.name} 已经有 ${assignment.roleName} 角色，跳过`);
          continue;
        }

        // 分配角色
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleName: assignment.roleName as any,
            grantedBy: adminUser.id,
            status: 'ACTIVE',
          }
        });

        console.log(`✅ 为用户 ${user.name} (${user.username}) 分配了 ${assignment.roleName} 角色`);
        successCount++;

      } catch (error) {
        console.error(`❌ 为用户 ${assignment.username} 分配角色失败:`, error.message);
      }
    }

    console.log(`\n🎉 角色分配完成！成功分配了 ${successCount} 个角色`);

    // 验证结果
    console.log('\n🔍 验证辅导员角色分配结果:');
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

    console.log(`👨‍🏫 辅导员用户数量: ${counselors.length}`);
    counselors.forEach((counselor, index) => {
      console.log(`${index + 1}. ${counselor.name} (${counselor.username})`);
    });

  } catch (error) {
    console.error('❌ 分配角色失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignUserRoles(); 