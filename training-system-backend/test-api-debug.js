const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 测试师徒关系创建API...');
    
    const testData = {
      projectId: '2ac800f1-0fab-42af-92c9-0c1f8ca28aa7',
      studentId: 'user-hr-001',  // 冯芹 (人事部) - 作为学员
      mentorId: 'counselor-001', // 李辅导员 - 作为导师
      remarks: '测试师徒关系创建'
    };
    
    console.log('📝 发送数据:', testData);
    
    const response = await axios.post(
      'http://localhost:3000/api/projects/2ac800f1-0fab-42af-92c9-0c1f8ca28aa7/mentorship/relationships',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ API响应成功:', response.data);
  } catch (error) {
    console.error('❌ API错误:');
    console.error('  状态码:', error.response?.status);
    console.error('  错误信息:', error.response?.data);
    console.error('  错误详情:', error.message);
  }
}

testAPI(); 