const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugGroupData() {
  try {
    console.log('=== 数据库调试信息 ===\n');
    
    // 查询所有小组
    console.log('📋 查询所有小组:');
    const groups = await prisma.trainingGroup.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`找到 ${groups.length} 个小组:\n`);
    
    groups.forEach(group => {
      console.log(`小组: ${group.name} (ID: ${group.id})`);
      console.log(`项目: ${group.project?.name || '未知项目'} (${group.projectId})`);
      console.log(`成员数量: ${group.members.length}`);
      
      if (group.members.length > 0) {
        group.members.forEach(member => {
          console.log(`  - ${member.user.name} (${member.user.username}) - 角色: ${member.role}`);
        });
      } else {
        console.log('  - 暂无成员');
      }
      console.log('---');
    });
    
    // 查询项目参与者
    console.log('\n👥 查询项目参与者:');
    const projectId = 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79'; // 从截图中的项目ID
    const participants = await prisma.projectParticipant.findMany({
      where: {
        projectId: projectId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true
          }
        }
      }
    });
    
    console.log(`项目参与者数量: ${participants.length}`);
    participants.forEach(p => {
      console.log(`  - ${p.user.name} (${p.user.username}) - 角色: ${p.role} - 状态: ${p.status}`);
    });
    
    // 查询用户信息
    console.log('\n🔍 查询特定用户:');
    const testUsers = ['user-hr-001', 'user-tech-005'];
    for (const username of testUsers) {
      const user = await prisma.user.findFirst({
        where: {
          username: username
        }
      });
      
      if (user) {
        console.log(`用户: ${user.name} (${user.username}) - UUID: ${user.id}`);
        
        // 检查这个用户在哪个小组中
        const groupMembership = await prisma.groupMember.findFirst({
          where: {
            userId: user.id
          },
          include: {
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        if (groupMembership) {
          console.log(`  当前所在小组: ${groupMembership.group.name} (${groupMembership.group.id}) - 角色: ${groupMembership.role}`);
        } else {
          console.log(`  当前未在任何小组中`);
        }
      } else {
        console.log(`用户 ${username} 不存在`);
      }
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugGroupData(); 