import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOrphanedData() {
  try {
    console.log('🔍 检查数据库一致性...\n');

    // 1. 检查孤儿分组（指向不存在项目的分组）
    const allGroups = await prisma.trainingGroup.findMany({
      include: {
        project: true,
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    const orphanedGroups = allGroups.filter(group => !group.project);

    console.log(`🗑️  找到 ${orphanedGroups.length} 个孤儿分组（指向不存在的项目）:`);
    orphanedGroups.forEach(group => {
      console.log(`  - 分组 ${group.name} (${group.id}) -> 项目ID: ${group.projectId}, 成员数: ${group._count.members}`);
    });

    // 2. 检查存在的项目
    const existingProjects = await prisma.trainingProject.findMany({
      select: {
        id: true,
        name: true
      }
    });

    console.log(`\n📂 现存项目 ${existingProjects.length} 个:`);
    existingProjects.forEach(project => {
      console.log(`  - ${project.name} (${project.id})`);
    });

    // 3. 检查冯芹的辅导员数据
    console.log(`\n👩‍🏫 检查冯芹的辅导员数据:`);
    const fengqinCounseling = await prisma.groupMember.findMany({
      where: {
        userId: 'user-hr-001',
        role: 'LEADER'
      },
      include: {
        group: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            username: true
          }
        }
      }
    });

    console.log(`  冯芹作为辅导员的分组: ${fengqinCounseling.length} 个`);
    fengqinCounseling.forEach(record => {
      const project = record.group.project;
      console.log(`    - 分组: ${record.group.name} (${record.group.id})`);
      console.log(`      项目: ${project ? `${project.name} (${project.id}) - ${project.status}` : '❌ 项目不存在'}`);
    });

    // 4. 清理孤儿数据（如果用户确认）
    if (orphanedGroups.length > 0) {
      console.log(`\n🧹 准备清理 ${orphanedGroups.length} 个孤儿分组...`);
      
      // 首先删除孤儿分组的成员
      for (const group of orphanedGroups) {
        const deletedMembers = await prisma.groupMember.deleteMany({
          where: {
            groupId: group.id
          }
        });
        console.log(`  ✅ 删除分组 ${group.name} 的 ${deletedMembers.count} 个成员`);
      }

      // 然后删除孤儿分组
      const deletedGroups = await prisma.trainingGroup.deleteMany({
        where: {
          id: {
            in: orphanedGroups.map(g => g.id)
          }
        }
      });
      console.log(`  ✅ 删除了 ${deletedGroups.count} 个孤儿分组`);
    }

    // 5. 重新检查冯芹的数据
    console.log(`\n🔄 重新检查冯芹的辅导员数据:`);
    const fengqinAfterCleanup = await prisma.groupMember.findMany({
      where: {
        userId: 'user-hr-001',
        role: 'LEADER'
      },
      include: {
        group: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        }
      }
    });

    console.log(`  清理后，冯芹作为辅导员的有效分组: ${fengqinAfterCleanup.length} 个`);
    fengqinAfterCleanup.forEach(record => {
      const project = record.group.project;
      console.log(`    - 分组: ${record.group.name}`);
      console.log(`      项目: ${project.name} (${project.id}) - ${project.status}`);
    });

    // 6. 验证我的查询逻辑
    console.log(`\n🔍 验证获取项目的查询逻辑:`);
    const counselorGroups = await prisma.groupMember.findMany({
      where: {
        userId: 'user-hr-001',
        role: 'LEADER'
      },
      include: {
        group: {
          select: {
            projectId: true
          }
        }
      }
    });

    const projectIds = counselorGroups.map(group => group.group.projectId);
    console.log(`  冯芹负责的项目ID: [${projectIds.join(', ')}]`);

    const projects = await prisma.trainingProject.findMany({
      where: {
        id: {
          in: projectIds
        }
      },
      select: {
        id: true,
        name: true,
        projectNo: true,
        status: true,
        currentStage: true
      }
    });

    console.log(`  应该返回的项目: ${projects.length} 个`);
    projects.forEach(project => {
      console.log(`    - ${project.name} (${project.id}) - ${project.status}`);
    });

  } catch (error) {
    console.error('❌ 操作失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedData(); 