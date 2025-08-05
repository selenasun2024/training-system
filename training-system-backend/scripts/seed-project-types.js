const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化培训类型数据...')

  try {
    // 先确保有管理员用户存在
    let adminUser = await prisma.user.findUnique({
      where: { id: 'admin-001' }
    })

    if (!adminUser) {
      console.log('创建管理员用户...')
      adminUser = await prisma.user.create({
        data: {
          id: 'admin-001',
          username: 'admin',
          realName: '系统管理员',
          email: 'admin@example.com',
          passwordHash: 'temp123',
          department: 'IT',
          position: '系统管理员',
          level: 'ADMIN',
          status: 'ACTIVE'
        }
      })
      console.log('✅ 管理员用户创建成功')
    }

    // 创建培训类型
    const projectTypes = await prisma.projectType.createMany({
      data: [
        {
          id: 'type-001',
          name: '新员工入职培训',
          code: 'NEW_HIRE',
          description: '针对新入职员工的综合培训项目',
          remindDays: 7,
          enabled: true,
          orderIndex: 1,
          isSystem: true,
          createdBy: 'admin-001'
        },
        {
          id: 'type-002',
          name: '干部入线子培训',
          code: 'LEADERSHIP',
          description: '面向管理干部的领导力发展培训',
          remindDays: 5,
          enabled: true,
          orderIndex: 2,
          isSystem: true,
          createdBy: 'admin-001'
        },
        {
          id: 'type-003',
          name: '员工入线子培训',
          code: 'STAFF_TRAINING',
          description: '面向一般员工的技能提升培训',
          remindDays: 3,
          enabled: true,
          orderIndex: 3,
          isSystem: true,
          createdBy: 'admin-001'
        },
        {
          id: 'type-004',
          name: '战狼培训',
          code: 'WARRIOR',
          description: '高强度业务能力提升培训',
          remindDays: 7,
          enabled: true,
          orderIndex: 4,
          isSystem: true,
          createdBy: 'admin-001'
        },
        {
          id: 'type-005',
          name: '海豹培训',
          code: 'SEAL',
          description: '精英人才特训项目',
          remindDays: 10,
          enabled: true,
          orderIndex: 5,
          isSystem: true,
          createdBy: 'admin-001'
        }
      ],
      skipDuplicates: true
    })

    console.log(`✅ 成功创建 ${projectTypes.count} 个培训类型`)

    // 验证结果
    const createdTypes = await prisma.projectType.findMany({
      where: { isSystem: true },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, name: true, code: true, enabled: true }
    })

    console.log('=== 创建的培训类型 ===')
    createdTypes.forEach(type => {
      console.log(`${type.id}: ${type.name} (${type.code}) - ${type.enabled ? '启用' : '禁用'}`)
    })

    console.log('🎉 培训类型数据初始化完成！')

  } catch (error) {
    console.error('❌ 初始化失败:', error.message)
    if (error.code === 'P2002') {
      console.log('注意：某些数据可能已存在（重复键冲突）')
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ 执行失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 