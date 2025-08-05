import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNewProject() {
  try {
    console.log('🔍 检查新建项目的参与者情况...\n');

    // 查找最新的项目
    const newProject = await prisma.trainingProject.findFirst({
      where: {
        name: {
          contains: '新员工入职培训'
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true
              }
            }
          }
        },
        groups: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!newProject) {
      console.log('❌ 没有找到新员工入职培训项目');
      return;
    }

    console.log('📋 新项目信息:');
    console.log(`  - 项目ID: ${newProject.id}`);
    console.log(`  - 项目名称: ${newProject.name}`);
    console.log(`  - 项目状态: ${newProject.status}`);
    console.log(`  - 当前阶段: ${newProject.currentStage}`);
    console.log(`  - 创建者: ${newProject.ownerId}`);

    console.log('\n👥 项目参与者:');
    if (newProject.participants.length === 0) {
      console.log('  ❌ 没有找到项目参与者');
    } else {
      newProject.participants.forEach(p => {
        console.log(`  - ${p.user.username} (${p.user.id}): ${p.role}`);
      });
    }

    console.log('\n👥 项目小组:');
    if (newProject.groups.length === 0) {
      console.log('  ❌ 没有找到项目小组');
    } else {
      newProject.groups.forEach(group => {
        console.log(`  - ${group.name} (${group.id}):`);
        group.members.forEach(member => {
          console.log(`    > ${member.user.username} (${member.user.id}): ${member.role}`);
        });
      });
    }

    // 检查辅导员是否被分配
    const counselors = newProject.participants.filter(p => p.role === 'COUNSELOR');
    console.log('\n👨‍🏫 辅导员分配:');
    if (counselors.length === 0) {
      console.log('  ❌ 没有分配辅导员');
    } else {
      counselors.forEach(counselor => {
        console.log(`  - ${counselor.user.username} (${counselor.user.id})`);
      });
    }

    // 检查学员是否被分配
    const students = newProject.participants.filter(p => p.role === 'STUDENT');
    console.log('\n👨‍🎓 学员分配:');
    if (students.length === 0) {
      console.log('  ❌ 没有分配学员');
    } else {
      students.forEach(student => {
        console.log(`  - ${student.user.username} (${student.user.id})`);
      });
    }

    // 检查项目是否需要特定状态才能生成观察目标
    console.log('\n📊 观察目标生成条件分析:');
    console.log(`  - 项目状态: ${newProject.status} (需要检查是否允许观察)`);
    console.log(`  - 辅导员数量: ${counselors.length}`);
    console.log(`  - 学员数量: ${students.length}`);
    console.log(`  - 小组数量: ${newProject.groups.length}`);
    
    if (newProject.status === 'DRAFT') {
      console.log('  ⚠️  项目状态为草稿，可能需要启动项目才能生成观察目标');
    }
    
    if (counselors.length === 0) {
      console.log('  ❌ 没有辅导员，无法生成观察目标');
    }
    
    if (students.length === 0) {
      console.log('  ❌ 没有学员，无法生成观察目标');
    }

  } catch (error) {
    console.error('❌ 检查新项目时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewProject(); 