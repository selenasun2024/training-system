import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getRealCounselors() {
  try {
    console.log('🔍 查询实际存在的辅导员...\n');

    // 查询所有作为辅导员的用户
    const counselors = await prisma.groupMember.findMany({
      where: {
        role: 'LEADER'
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            department: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            projectId: true,
            project: {
              select: {
                name: true
              }
            }
          }
        }
      },
      take: 10
    });

    // 去重获取唯一的辅导员
    const uniqueCounselors = new Map();
    counselors.forEach(c => {
      if (!uniqueCounselors.has(c.userId)) {
        uniqueCounselors.set(c.userId, {
          user: c.user,
          projects: []
        });
      }
      uniqueCounselors.get(c.userId).projects.push({
        groupId: c.group.id,
        groupName: c.group.name,
        projectId: c.group.projectId,
        projectName: c.group.project.name
      });
    });

    console.log(`👨‍🏫 找到 ${uniqueCounselors.size} 名实际辅导员:\n`);

    let index = 1;
    for (const [userId, data] of uniqueCounselors) {
      console.log(`${index}. ${data.user.name} (${data.user.username})`);
      console.log(`   用户ID: ${data.user.id}`);
      console.log(`   邮箱: ${data.user.email || '未设置'}`);
      console.log(`   部门: ${data.user.department || '未设置'}`);
      console.log(`   负责项目: ${data.projects.map(p => p.projectName).join(', ')}`);
      console.log('');
      index++;
    }

    // 选择第一个辅导员作为测试用户
    if (uniqueCounselors.size > 0) {
      const firstCounselor = Array.from(uniqueCounselors.values())[0];
      console.log('🔧 前端测试用代码 (在浏览器控制台执行):');
      console.log(`localStorage.setItem('userId', '${firstCounselor.user.id}');`);
      console.log(`localStorage.setItem('username', '${firstCounselor.user.username}');`);
      console.log(`localStorage.setItem('name', '${firstCounselor.user.name}');`);
      console.log(`console.log('已切换到辅导员身份: ${firstCounselor.user.name}');`);
      console.log(`location.reload(); // 刷新页面`);
    }

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getRealCounselors(); 