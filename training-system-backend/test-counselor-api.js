const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const PROJECT_ID = '7d38a303-81ad-4246-80f1-c36310920363';
const COUNSELOR_ID = 'user-hr-001';

async function testCounselorAPI() {
  console.log('🔍 测试辅导员推荐记录API...\n');

  try {
    // 1. 测试获取推荐记录API
    console.log('1. 测试获取辅导员推荐记录...');
    const recommendationsResponse = await axios.get(
      `${BASE_URL}/recommendations/projects/${PROJECT_ID}/my-recommendations`,
      {
        params: {
          counselorId: COUNSELOR_ID
        },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ 推荐记录API响应成功!');
    console.log('状态码:', recommendationsResponse.status);
    console.log('响应数据:', JSON.stringify(recommendationsResponse.data, null, 2));
    
    // 2. 测试获取学员表现数据API
    console.log('\n2. 测试获取学员表现数据...');
    const studentsResponse = await axios.get(
      `${BASE_URL}/recommendations/projects/${PROJECT_ID}/students`,
      {
        params: {
          counselorId: COUNSELOR_ID
        },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ 学员数据API响应成功!');
    console.log('状态码:', studentsResponse.status);
    console.log('响应数据:', JSON.stringify(studentsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testCounselorAPI(); 