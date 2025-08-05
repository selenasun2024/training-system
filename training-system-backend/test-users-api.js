const axios = require('axios');

async function testUsersAPI() {
  try {
    console.log('🔍 测试用户API...');
    
    // 测试获取用户列表
    const response = await axios.get('http://localhost:3000/api/users', {
      params: { limit: 10 }
    });
    
    console.log('✅ 用户API响应成功:');
    console.log('  状态码:', response.status);
    console.log('  用户数量:', response.data?.data?.users?.length || 0);
    
    if (response.data?.data?.users) {
      console.log('  前5个用户:');
      response.data.data.users.slice(0, 5).forEach(user => {
        console.log(`    - ${user.id}: ${user.name} (${user.department})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 用户API错误:');
    console.error('  状态码:', error.response?.status);
    console.error('  错误信息:', error.response?.data);
    console.error('  错误详情:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ 连接被拒绝，请确认后端服务是否启动 (端口3000)');
    }
  }
}

testUsersAPI(); 