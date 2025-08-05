import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProjectData() {
  try {
    console.log('🔍 检查数据库中的项目数据...');
    
    const projects = await prisma.trainingProject.findMany({
      select: {
        id: true,
        projectNo: true,
        name: true,
        config: true,
      },
    });
    
    console.log(`📊 找到 ${projects.length} 个项目:`);
    
    for (const project of projects) {
      console.log(`\n📋 项目: ${project.name} (${project.projectNo})`);
      console.log(`🔧 Config:`, JSON.stringify(project.config, null, 2));
      
      if (project.config && typeof project.config === 'object') {
        const config = project.config as any;
        console.log(`  - type: ${config.type}`);
        console.log(`  - target: ${config.target}`);
        console.log(`  - org: ${config.org}`);
        console.log(`  - location: ${config.location}`);
        console.log(`  - goal: ${config.goal}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 检查数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectData(); 