import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecommendationUsers() {
  console.log('🔍 检查推荐系统相关用户完整性...\n');

  try {
    // 1. 检查推荐记录中的用户
    const recommendations = await prisma.recommendation.findMany({
      select: {
        id: true,
        projectId: true,
        studentId: true,
        counselorId: true,
        type: true,
        status: true,
        createdAt: true
      }
    });

    console.log(`📊 总推荐记录数: ${recommendations.length}`);
    
    if (recommendations.length === 0) {
      console.log('✅ 没有推荐记录，无需检查用户关联');
      return;
    }

    // 2. 提取所有相关用户ID
    const studentIds = [...new Set(recommendations.map(r => r.studentId))];
    const counselorIds = [...new Set(recommendations.map(r => r.counselorId))];
    const allUserIds = [...new Set([...studentIds, ...counselorIds])];

    console.log(`📊 涉及的学员ID数量: ${studentIds.length}`);
    console.log(`📊 涉及的辅导员ID数量: ${counselorIds.length}`);
    console.log(`📊 总用户ID数量: ${allUserIds.length}`);

    // 3. 检查这些用户是否在users表中存在
    const existingUsers = await prisma.user.findMany({
      where: {
        id: { in: allUserIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true
      }
    });

    const existingUserIds = new Set(existingUsers.map(u => u.id));
    console.log(`📊 在users表中存在的用户: ${existingUsers.length}`);

    // 4. 查找缺失的用户
    const missingUserIds = allUserIds.filter(id => !existingUserIds.has(id));
    
    if (missingUserIds.length > 0) {
      console.log(`\n❌ 发现 ${missingUserIds.length} 个缺失的用户ID:`);
      missingUserIds.forEach(id => {
        console.log(`  - ${id}`);
      });

      // 5. 显示受影响的推荐记录
      const affectedRecommendations = recommendations.filter(r => 
        missingUserIds.includes(r.studentId) || missingUserIds.includes(r.counselorId)
      );

      console.log(`\n🚨 受影响的推荐记录 (${affectedRecommendations.length} 条):`);
      affectedRecommendations.forEach(rec => {
        const missingStudent = missingUserIds.includes(rec.studentId);
        const missingCounselor = missingUserIds.includes(rec.counselorId);
        
        console.log(`  推荐ID: ${rec.id.substring(0, 8)}...`);
        console.log(`    项目: ${rec.projectId}`);
        console.log(`    类型: ${rec.type}`);
        console.log(`    状态: ${rec.status}`);
        if (missingStudent) console.log(`    ❌ 缺失学员: ${rec.studentId}`);
        if (missingCounselor) console.log(`    ❌ 缺失辅导员: ${rec.counselorId}`);
        console.log(`    创建时间: ${rec.createdAt.toLocaleString()}`);
        console.log('');
      });

      // 6. 提供修复建议
      console.log('🔧 修复建议:');
      console.log('1. 执行 add-sample-users.sql 脚本确保基础用户存在');
      console.log('2. 或者删除引用不存在用户的推荐记录');
      console.log('3. 或者使用 LEFT JOIN 查询避免数据丢失（已在代码中修复）');

    } else {
      console.log('\n✅ 所有推荐记录的用户关联都完整');
    }

    // 7. 检查关键用户
    const keyUsers = ['user-hr-001', 'user-admin-001'];
    const missingKeyUsers = keyUsers.filter(id => !existingUserIds.has(id));
    
    if (missingKeyUsers.length > 0) {
      console.log(`\n⚠️ 关键用户缺失: ${missingKeyUsers.join(', ')}`);
      console.log('请确保执行了用户初始化脚本');
    }

    // 8. 显示现有用户列表
    console.log('\n👥 现有用户列表:');
    existingUsers.forEach(user => {
      console.log(`  ${user.id} - ${user.name} (${user.department})`);
    });

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

export { checkRecommendationUsers };

// 立即执行函数用于测试
checkRecommendationUsers(); 