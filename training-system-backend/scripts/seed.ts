import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据种子初始化...');

  // 创建默认管理员用户
  const defaultAdmin = await prisma.user.upsert({
    where: { id: 'user-admin-001' },
    update: {},
    create: {
      id: 'user-admin-001',
      username: 'admin',
      email: 'admin@training.com',
      password: await bcrypt.hash('admin123', 10),
      realName: '系统管理员',
      status: 'ACTIVE',
      phone: '13800000000',
      department: '系统管理部',
      position: '系统管理员',
      level: '管理员',
    },
  });

  console.log('✅ 默认管理员用户创建成功:', defaultAdmin.realName);

  // 创建默认用户角色
  await prisma.userRole.upsert({
    where: { 
      userId_roleName: { 
        userId: 'user-admin-001', 
        roleName: 'ADMIN' 
      } 
    },
    update: {},
    create: {
      userId: 'user-admin-001',
      roleName: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ 管理员角色分配成功');
  
  console.log('🎉 数据种子初始化完成！');
}

main()
  .catch((e) => {
    console.error('❌ 数据种子初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 