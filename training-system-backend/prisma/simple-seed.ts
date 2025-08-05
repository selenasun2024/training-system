import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始添加观察功能测试数据...')

  try {
    // 1. 添加用户数据
    console.log('📝 添加用户...')
    
    // 删除已存在的数据（为了重新创建）
    await prisma.observationRecord.deleteMany({})
    await prisma.projectParticipant.deleteMany({})
    await prisma.trainingProject.deleteMany({})
    await prisma.projectType.deleteMany({})
    await prisma.user.deleteMany({
      where: {
        username: {
          in: ['counselor001', 'counselor002', 'student001', 'student002', 'student003', 'student004', 'admin001']
        }
      }
    })

    // 创建用户
    const users = await prisma.user.createMany({
      data: [
        {
          id: 'counselor-001',
          username: 'counselor001',
          passwordHash: '$2b$10$example.hash.here',
          email: 'counselor001@example.com',
          name: '李辅导员'
        },
        {
          id: 'counselor-002',
          username: 'counselor002',
          passwordHash: '$2b$10$example.hash.here',
          email: 'counselor002@example.com',
          name: '张辅导员'
        },
        {
          id: 'student-001',
          username: 'student001',
          passwordHash: '$2b$10$example.hash.here',
          email: 'student001@example.com',
          name: '王小明'
        },
        {
          id: 'student-002',
          username: 'student002',
          passwordHash: '$2b$10$example.hash.here',
          email: 'student002@example.com',
          name: '李小红'
        },
        {
          id: 'student-003',
          username: 'student003',
          passwordHash: '$2b$10$example.hash.here',
          email: 'student003@example.com',
          name: '张小强'
        },
        {
          id: 'student-004',
          username: 'student004',
          passwordHash: '$2b$10$example.hash.here',
          email: 'student004@example.com',
          name: '赵小美'
        },
        {
          id: 'admin-001',
          username: 'admin001',
          passwordHash: '$2b$10$example.hash.here',
          email: 'admin001@example.com',
          name: '教务管理员'
        }
      ]
    })
    console.log(`✅ 添加了 ${users.count} 个用户`)

    // 2. 添加项目类型
    console.log('📂 添加项目类型...')
    const projectTypes = await prisma.projectType.createMany({
      data: [
        {
          id: 'type-leadership',
          name: '领导力培训',
          code: 'leadership',
          description: '针对管理层的领导力提升培训'
        },
        {
          id: 'type-skills',
          name: '技能培训',
          code: 'skills',
          description: '专业技能提升培训'
        }
      ]
    })
    console.log(`✅ 添加了 ${projectTypes.count} 个项目类型`)

    // 3. 添加培训项目
    console.log('🎯 添加培训项目...')
    const projects = await prisma.trainingProject.createMany({
      data: [
                 {
           id: 'project-001',
           projectNo: 'P001',
           name: '2024年领导力提升培训第一期',
           description: '面向中层管理人员的领导力提升培训项目',
           type: 'type-leadership',
           ownerId: 'admin-001',
           status: 'ACTIVE',
           startDate: new Date('2024-01-15'),
           endDate: new Date('2024-03-15')
         },
         {
           id: 'project-002',
           projectNo: 'P002',
           name: '2024年新员工技能培训',
           description: '新入职员工的基础技能培训项目',
           type: 'type-skills',
           ownerId: 'admin-001',
           status: 'ACTIVE',
           startDate: new Date('2024-02-01'),
           endDate: new Date('2024-03-01')
         }
      ]
    })
    console.log(`✅ 添加了 ${projects.count} 个培训项目`)

    // 4. 添加项目参与者关系
    console.log('👥 添加项目参与者...')
    const participants = await prisma.projectParticipant.createMany({
      data: [
        // 项目1的参与者
        {
          id: 'pp-001',
          projectId: 'project-001',
          userId: 'counselor-001',
          role: 'COUNSELOR',
          status: 'ACTIVE',
          notes: '负责A组学员'
        },
        {
          id: 'pp-002',
          projectId: 'project-001',
          userId: 'student-001',
          role: 'STUDENT',
          status: 'ACTIVE',
          notes: 'A组学员'
        },
        {
          id: 'pp-003',
          projectId: 'project-001',
          userId: 'student-002',
          role: 'STUDENT',
          status: 'ACTIVE',
          notes: 'A组学员'
        },
        // 项目2的参与者
        {
          id: 'pp-004',
          projectId: 'project-002',
          userId: 'counselor-002',
          role: 'COUNSELOR',
          status: 'ACTIVE',
          notes: '负责B组学员'
        },
        {
          id: 'pp-005',
          projectId: 'project-002',
          userId: 'student-003',
          role: 'STUDENT',
          status: 'ACTIVE',
          notes: 'B组学员'
        },
        {
          id: 'pp-006',
          projectId: 'project-002',
          userId: 'student-004',
          role: 'STUDENT',
          status: 'ACTIVE',
          notes: 'B组学员'
        },
        // 让counselor-001也能看到项目2的学员
        {
          id: 'pp-007',
          projectId: 'project-002',
          userId: 'counselor-001',
          role: 'COUNSELOR',
          status: 'ACTIVE',
          notes: '协助指导'
        }
      ]
    })
    console.log(`✅ 添加了 ${participants.count} 个项目参与者`)

    // 5. 添加一些示例观察记录
    console.log('👁️ 添加观察记录...')
    const observations = await prisma.observationRecord.createMany({
      data: [
        {
          id: 'obs-001',
          projectId: 'project-001',
          studentId: 'student-001',
          observerId: 'counselor-001',
          type: 'DAILY',
          title: '王小明日常观察',
          content: '今日表现积极主动，参与讨论活跃',
          attachments: [],
          tags: ['highlight', '积极'],
          score: 8,
          visibility: 'TEACHER'
        },
        {
          id: 'obs-002',
          projectId: 'project-001',
          studentId: 'student-002',
          observerId: 'counselor-001',
          type: 'WEEKLY',
          title: '李小红周度观察',
          content: '本周学习态度认真，但时间管理需要改进',
          attachments: [],
          tags: ['improve', '时间管理'],
          score: 6,
          visibility: 'TEACHER'
        },
        {
          id: 'obs-003',
          projectId: 'project-002',
          studentId: 'student-003',
          observerId: 'counselor-002',
          type: 'DAILY',
          title: '张小强日常观察',
          content: '沟通能力强，善于团队协作',
          attachments: [],
          tags: ['highlight', '团队协作'],
          score: 9,
          visibility: 'TEACHER'
        }
      ]
    })
    console.log(`✅ 添加了 ${observations.count} 个观察记录`)

    console.log('\n🎉 测试数据添加完成!')
    
    // 验证数据
    console.log('\n=== 数据验证 ===')
    const projectCount = await prisma.trainingProject.count()
    const participantCount = await prisma.projectParticipant.count()
    const observationCount = await prisma.observationRecord.count()
    
    console.log(`📊 项目数量: ${projectCount}`)
    console.log(`👥 参与者数量: ${participantCount}`)
    console.log(`👁️ 观察记录数量: ${observationCount}`)

    // 显示辅导员counselor-001可以看到的学员
    const counselor001Targets = await prisma.projectParticipant.findMany({
      where: {
        projectId: {
          in: await prisma.projectParticipant.findMany({
            where: { userId: 'counselor-001', role: 'COUNSELOR' },
            select: { projectId: true }
          }).then(results => results.map(r => r.projectId))
        },
        role: 'STUDENT'
      },
      include: {
        project: { select: { name: true } },
        user: { select: { name: true } }
      }
    })

    console.log('\n📋 辅导员李辅导员(counselor-001)可以观察的学员:')
    counselor001Targets.forEach(target => {
      console.log(`  - ${target.user.name} (项目: ${target.project.name})`)
    })

  } catch (error) {
    console.error('❌ 添加测试数据失败:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('\n✅ 数据库连接已关闭')
  })
  .catch(async (e) => {
    console.error('❌ 执行失败:', e)
    await prisma.$disconnect()
    // 注释掉 process.exit(1) 来避免类型错误
    // process.exit(1)
  }) 