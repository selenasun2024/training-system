import axios from 'axios';

async function testProjectAPI() {
  try {
    console.log('🔍 测试项目详情API...');
    
    const response = await axios.get('http://localhost:3000/api/projects/demo-project-001');
    
    console.log('📊 API响应状态:', response.status);
    console.log('📊 响应头:', response.headers['content-type']);
    console.log('📊 响应体结构:', {
      code: response.data.code,
      message: response.data.message,
      hasData: !!response.data.data,
    });
    
    if (response.data.data) {
      const project = response.data.data;
      console.log('\n📋 项目基本信息:');
      console.log('  - ID:', project.id);
      console.log('  - 名称:', project.name);
      console.log('  - 编号:', project.projectNo);
      console.log('  - config存在:', !!project.config);
      console.log('  - participants存在:', !!project.participants);
      console.log('  - participants数量:', project.participants?.length || 0);
      
      // 🔍 检查participants数据结构
      if (project.participants && project.participants.length > 0) {
        console.log('\n👥 Participants详细信息:');
        project.participants.forEach((participant: any, index: number) => {
          console.log(`  参与者${index + 1}:`);
          console.log(`    - ID: ${participant.id}`);
          console.log(`    - 用户ID: ${participant.userId}`);
          console.log(`    - 角色: ${participant.role}`);
          console.log(`    - 状态: ${participant.status}`);
          if (participant.user) {
            console.log(`    - 用户名: ${participant.user.name}`);
            console.log(`    - 邮箱: ${participant.user.email}`);
          }
        });
      } else {
        console.log('\n👥 Participants: 无参与者数据');
      }
      
      if (project.config) {
        console.log('\n🔧 Config详细内容:');
        console.log('Config JSON:', JSON.stringify(project.config, null, 2));
        
        console.log('\n🔍 基本信息字段检查:');
        console.log('  - type:', project.config.type);
        console.log('  - target:', project.config.target);
        console.log('  - org:', project.config.org);
        console.log('  - location:', project.config.location);
        console.log('  - goal:', project.config.goal);
        
        console.log('\n🔍 系统配置字段检查:');
        console.log('  - enabledModules存在:', !!project.config.enabledModules);
        console.log('  - workflows存在:', !!project.config.workflows);
        
        console.log('\n🔍 所有config键:', Object.keys(project.config));
      } else {
        console.log('❌ config字段不存在');
      }
    } else {
      console.log('❌ 响应中没有data字段');
    }
    
  } catch (error: any) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testProjectAPI(); 