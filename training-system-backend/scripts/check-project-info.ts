import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProjectInfo() {
  console.log('🔍 检查项目信息和分组情况...');
  
  try {
    // 查看所有项目
    const projects = await prisma.trainingProject.findMany({
      select: {
        id: true,
        name: true,
        projectNo: true,
        status: true,
        groups: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                userId: true,
                role: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    console.log('📋 项目和分组信息:');
    projects.forEach(project => {
      console.log(`\n项目: ${project.name} (${project.id})`);
      console.log(`  编号: ${project.projectNo}`);
      console.log(`  状态: ${project.status}`);
      
      if (project.groups.length === 0) {
        console.log('  ⚠️ 没有分组');
      } else {
        project.groups.forEach(group => {
          console.log(`  分组: ${group.name} (${group.id})`);
          group.members.forEach(member => {
            const roleIcon = member.role === 'LEADER' ? '👑' : '👤';
            console.log(`    ${roleIcon} ${member.user.name} (${member.user.id}) - ${member.role}`);
          });
        });
      }
    });
    
    // 检查user-hr-001是否在任何分组中
    const userHrGroups = await prisma.groupMember.findMany({
      where: { userId: 'user-hr-001' },
      include: {
        group: {
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    console.log('\n👑 user-hr-001 (冯芹) 的分组情况:');
    if (userHrGroups.length === 0) {
      console.log('  ⚠️ user-hr-001 没有参与任何分组');
    } else {
      userHrGroups.forEach(group => {
        console.log(`  - 项目: ${group.group.project.name}`);
        console.log(`    分组: ${group.group.name}`);
        console.log(`    角色: ${group.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectInfo().catch(console.error); 