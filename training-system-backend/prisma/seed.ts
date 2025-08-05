import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始添加观察功能测试数据...')

  // 1. 添加用户数据
  console.log('📝 添加用户数据...')
  
  // 辅导员
  const counselor1 = await prisma.user.upsert({
    where: { username: 'counselor001' },
    update: {},
    create: {
      id: 'counselor-001',
      username: 'counselor001',
      passwordHash: '$2b$10$example.hash.here',
      email: 'counselor001@example.com',
      name: '李辅导员',
      status: 'ACTIVE'
    }
  })

  const counselor2 = await prisma.user.upsert({
    where: { username: 'counselor002' },
    update: {},
    create: {
      id: 'counselor-002',
      username: 'counselor002',
      passwordHash: '$2b$10$example.hash.here',
      email: 'counselor002@example.com',
      name: '张辅导员',
      status: 'ACTIVE'
    }
  })

  // 学员
  const student1 = await prisma.user.upsert({
    where: { username: 'student001' },
    update: {},
    create: {
      id: 'student-001',
      username: 'student001',
      passwordHash: '$2b$10$example.hash.here',
      email: 'student001@example.com',
      name: '王小明',
      status: 'ACTIVE'
    }
  })

  const student2 = await prisma.user.upsert({
    where: { username: 'student002' },
    update: {},
    create: {
      id: 'student-002',
      username: 'student002',
      passwordHash: '$2b$10$example.hash.here',
      email: 'student002@example.com',
      name: '李小红',
      status: 'ACTIVE'
    }
  })

  const student3 = await prisma.user.upsert({
    where: { username: 'student003' },
    update: {},
    create: {
      id: 'student-003',
      username: 'student003',
      passwordHash: '$2b$10$example.hash.here',
      email: 'student003@example.com',
      name: '张小强',
      status: 'ACTIVE'
    }
  })

  const student4 = await prisma.user.upsert({
    where: { username: 'student004' },
    update: {},
    create: {
      id: 'student-004',
      username: 'student004',
      passwordHash: '$2b$10$example.hash.here',
      email: 'student004@example.com',
      name: '赵小美',
      status: 'ACTIVE'
    }
  })

  // 管理员
  const admin1 = await prisma.user.upsert({
    where: { username: 'admin001' },
    update: {},
    create: {
      id: 'admin-001',
      username: 'admin001',
      passwordHash: '$2b$10$example.hash.here',
      email: 'admin001@example.com',
      name: '教务管理员',
      status: 'ACTIVE'
    }
  })

  // 2. 添加项目类型
  console.log('📂 添加项目类型...')
  const projectType1 = await prisma.projectType.upsert({
    where: { code: 'leadership' },
    update: {},
    create: {
      id: 'type-leadership',
      name: '领导力培训',
      code: 'leadership',
      description: '针对管理层的领导力提升培训',
      enabled: true
    }
  })

  const projectType2 = await prisma.projectType.upsert({
    where: { code: 'skills' },
    update: {},
    create: {
      id: 'type-skills',
      name: '技能培训',
      code: 'skills',
      description: '专业技能提升培训',
      enabled: true
    }
  })

  // 3. 添加培训项目
  console.log('🎯 添加培训项目...')
  const project1 = await prisma.trainingProject.upsert({
    where: { id: 'project-001' },
    update: {},
    create: {
      id: 'project-001',
      name: '2024年领导力提升培训第一期',
      description: '面向中层管理人员的领导力提升培训项目',
      projectTypeId: 'type-leadership',
      managerId: 'admin-001',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15')
    }
  })

  const project2 = await prisma.trainingProject.upsert({
    where: { id: 'project-002' },
    update: {},
    create: {
      id: 'project-002',
      name: '2024年新员工技能培训',
      description: '新入职员工的基础技能培训项目',
      projectTypeId: 'type-skills',
      managerId: 'admin-001',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-03-01')
    }
  })

  // 4. 添加项目参与者关系
  console.log('👥 添加项目参与者关系...')
  
  // 项目1的参与者
  await prisma.projectParticipant.upsert({
    where: { 
      projectId_userId: { 
        projectId: 'project-001', 
        userId: 'counselor-001' 
      } 
    },
    update: {},
    create: {
      id: 'pp-001',
      projectId: 'project-001',
      userId: 'counselor-001',
      role: 'COUNSELOR',
      status: 'ACTIVE',
      notes: '负责A组学员'
    }
  })

  await prisma.projectParticipant.upsert({
    where: { 
      projectId_userId: { 
        projectId: 'project-001', 
        userId: 'student-001' 
      } 
    },
    update: {},
    create: {
      id: 'pp-002',
      projectId: 'project-001',
      userId: 'student-001',
      role: 'STUDENT',
      status: 'ACTIVE',
      notes: 'A组学员'
    }
  })

  await prisma.projectParticipant.upsert({
    where: { 
      projectId_userId: { 
        projectId: 'project-001', 
        userId: 'student-002' 
      } 
    },
    update: {},
    create: {
      id: 'pp-003',
      projectId: 'project-001',
      userId: 'student-002',
      role: 'STUDENT',
      status: 'ACTIVE',
      notes: 'A组学员'
    }
  })

  // 项目2的参与者
  await prisma.projectParticipant.upsert({
    where: { 
      projectId_userId: { 
        projectId: 'project-002', 
        userId: 'counselor-002' 
      } 
    },
    update: {},
    create: {
      id: 'pp-004',
      projectId: 'project-002',
      userId: 'counselor-002',
      role: 'COUNSELOR',
      status: 'ACTIVE',
      notes: '负责B组学员'
    }
  })

  await prisma.projectParticipant.upsert({
    where: { 
      projectId_userId: { 
        projectId: 'project-002', 
        userId: 'student-003' 
      } 
    },
    update: {},
    create: {
      id: 'pp-005',
      projectId: 'project-002',
      userId: 'student-003',
      role: 'STUDENT',
      status: 'ACTIVE',
      notes: 'B组学员'
    }
  })

  await prisma.projectParticipant.upsert({
    where: { 
      projectId_userId: { 
        projectId: 'project-002', 
        userId: 'student-004' 
      } 
    },
    update: {},
    create: {
      id: 'pp-006',
      projectId: 'project-002',
      userId: 'student-004',
      role: 'STUDENT',
      status: 'ACTIVE',
      notes: 'B组学员'
    }
  })

  // 让counselor-001也能看到项目2的学员
  await prisma.projectParticipant.upsert({
    where: { 
      projectId_userId: { 
        projectId: 'project-002', 
        userId: 'counselor-001' 
      } 
    },
    update: {},
    create: {
      id: 'pp-007',
      projectId: 'project-002',
      userId: 'counselor-001',
      role: 'COUNSELOR',
      status: 'ACTIVE',
      notes: '协助指导'
    }
  })

  // 5. 添加一些示例观察记录
  console.log('👁️ 添加观察记录...')
  await prisma.observationRecord.upsert({
    where: { id: 'obs-001' },
    update: {},
    create: {
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
    }
  })

  await prisma.observationRecord.upsert({
    where: { id: 'obs-002' },
    update: {},
    create: {
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
    }
  })

  await prisma.observationRecord.upsert({
    where: { id: 'obs-003' },
    update: {},
    create: {
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
  })

  console.log('✅ 测试数据添加完成!')
  
  // 验证数据
  console.log('\n=== 数据验证 ===')
  const projects = await prisma.trainingProject.findMany({
    select: { id: true, name: true, status: true }
  })
  console.log('项目:', projects)

  const participants = await prisma.projectParticipant.findMany({
    include: {
      project: { select: { name: true } },
      user: { select: { name: true } }
    }
  })
  console.log('参与者:', participants.map(p => ({
    project: p.project.name,
    user: p.user.name,
    role: p.role
  })))

  const observations = await prisma.observationRecord.findMany({
    include: {
      project: { select: { name: true } },
      student: { select: { name: true } },
      observer: { select: { name: true } }
    }
  })
  console.log('观察记录:', observations.map(o => ({
    project: o.project.name,
    student: o.student.name,
    observer: o.observer.name,
    type: o.type,
    title: o.title
  })))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }) 