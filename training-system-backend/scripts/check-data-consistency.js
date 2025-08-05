/**
 * 师徒关系数据一致性检查脚本
 * 运行: node scripts/check-data-consistency.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDataConsistency() {
  console.log('🔍 开始检查师徒关系数据一致性...\n');

  try {
    // 1. 检查师徒关系状态分布
    console.log('📊 1. 师徒关系状态分布:');
    const statusStats = await prisma.mentorshipRelationship.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });
    
    statusStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.id} 条`);
    });
    console.log('');

    // 2. 检查孤立的评价任务
    console.log('🔍 2. 检查孤立的评价任务（评价存在但师徒关系不存在）:');
    const orphanedEvaluations = await prisma.mentorshipEvaluation.findMany({
      where: {
        relationship: null
      },
      select: {
        id: true,
        relationshipId: true,
        evaluatorType: true,
        status: true,
        createdAt: true
      }
    });
    
    if (orphanedEvaluations.length > 0) {
      console.log(`   ❌ 发现 ${orphanedEvaluations.length} 个孤立的评价任务:`);
      orphanedEvaluations.forEach(eval => {
        console.log(`      - ID: ${eval.id}, 关系ID: ${eval.relationshipId}, 类型: ${eval.evaluatorType}`);
      });
    } else {
      console.log('   ✅ 未发现孤立的评价任务');
    }
    console.log('');

    // 3. 检查已终止关系对应的评价任务
    console.log('🔍 3. 检查已终止关系对应的评价任务:');
    const terminatedRelationshipEvaluations = await prisma.mentorshipEvaluation.findMany({
      where: {
        relationship: {
          status: 'TERMINATED'
        }
      },
      include: {
        relationship: {
          select: {
            id: true,
            status: true,
            mentorName: true,
            studentName: true,
            terminationDate: true
          }
        }
      }
    });
    
    if (terminatedRelationshipEvaluations.length > 0) {
      console.log(`   ⚠️ 发现 ${terminatedRelationshipEvaluations.length} 个已终止关系的评价任务:`);
      terminatedRelationshipEvaluations.forEach(eval => {
        console.log(`      - 评价ID: ${eval.id}, 关系: ${eval.relationship.mentorName} → ${eval.relationship.studentName}`);
      });
    } else {
      console.log('   ✅ 未发现已终止关系的评价任务');
    }
    console.log('');

    // 4. 检查状态异常的师徒关系
    console.log('🔍 4. 检查状态异常的师徒关系:');
    const invalidStatusRelationships = await prisma.mentorshipRelationship.findMany({
      where: {
        OR: [
          { status: null },
          { 
            status: {
              notIn: ['ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED']
            }
          }
        ]
      },
      select: {
        id: true,
        mentorName: true,
        studentName: true,
        status: true,
        createdAt: true
      }
    });
    
    if (invalidStatusRelationships.length > 0) {
      console.log(`   ❌ 发现 ${invalidStatusRelationships.length} 个状态异常的师徒关系:`);
      invalidStatusRelationships.forEach(rel => {
        console.log(`      - ID: ${rel.id}, ${rel.mentorName} → ${rel.studentName}, 状态: ${rel.status}`);
      });
    } else {
      console.log('   ✅ 未发现状态异常的师徒关系');
    }
    console.log('');

    // 5. 检查已终止但缺少终止日期的关系
    console.log('🔍 5. 检查已终止但缺少终止日期的关系:');
    const terminatedWithoutDate = await prisma.mentorshipRelationship.findMany({
      where: {
        status: 'TERMINATED',
        terminationDate: null
      },
      select: {
        id: true,
        mentorName: true,
        studentName: true,
        updatedAt: true
      }
    });
    
    if (terminatedWithoutDate.length > 0) {
      console.log(`   ⚠️ 发现 ${terminatedWithoutDate.length} 个已终止但缺少终止日期的关系:`);
      terminatedWithoutDate.forEach(rel => {
        console.log(`      - ID: ${rel.id}, ${rel.mentorName} → ${rel.studentName}`);
      });
    } else {
      console.log('   ✅ 未发现缺少终止日期的已终止关系');
    }
    console.log('');

    // 6. 数据统计汇总
    console.log('📈 6. 数据统计汇总:');
    
    const totalRelationships = await prisma.mentorshipRelationship.count();
    const activeRelationships = await prisma.mentorshipRelationship.count({
      where: { status: { not: 'TERMINATED' } }
    });
    const totalEvaluations = await prisma.mentorshipEvaluation.count();
    
    console.log(`   总师徒关系: ${totalRelationships}`);
    console.log(`   有效师徒关系: ${activeRelationships}`);
    console.log(`   总评价任务: ${totalEvaluations}`);
    console.log('');

    // 7. 修复建议
    console.log('🔧 修复建议:');
    if (orphanedEvaluations.length > 0) {
      console.log(`   - 删除 ${orphanedEvaluations.length} 个孤立的评价任务`);
    }
    if (terminatedRelationshipEvaluations.length > 0) {
      console.log(`   - 删除 ${terminatedRelationshipEvaluations.length} 个已终止关系的评价任务`);
    }
    if (terminatedWithoutDate.length > 0) {
      console.log(`   - 为 ${terminatedWithoutDate.length} 个关系补充终止日期`);
    }
    if (invalidStatusRelationships.length > 0) {
      console.log(`   - 修复 ${invalidStatusRelationships.length} 个状态异常的师徒关系`);
    }
    
    if (orphanedEvaluations.length === 0 && 
        terminatedRelationshipEvaluations.length === 0 && 
        terminatedWithoutDate.length === 0 && 
        invalidStatusRelationships.length === 0) {
      console.log('   ✅ 数据一致性良好，无需修复');
    } else {
      console.log('\n💡 要执行数据清理，请运行: node scripts/clean-data-consistency.js');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行检查
checkDataConsistency(); 