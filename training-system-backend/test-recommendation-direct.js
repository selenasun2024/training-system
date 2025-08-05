const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const PROJECT_ID = '7d38a303-81ad-4246-80f1-c36310920363';

async function testRecommendationAPI() {
  console.log('🔍 直接测试推荐API...\n');

  try {
    // 测试管理员获取推荐列表
    console.log('1. 测试管理员获取推荐列表...');
    const response = await axios.get(
      `${BASE_URL}/recommendations/admin/projects/${PROJECT_ID}`,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ API响应成功!');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    // 测试统计API
    console.log('\n2. 测试推荐统计API...');
    const statsResponse = await axios.get(
      `${BASE_URL}/recommendations/admin/projects/${PROJECT_ID}/stats`,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ 统计API响应成功!');
    console.log('统计数据:', JSON.stringify(statsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ API测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误数据:', error.response.data);
      console.error('错误信息:', error.response.statusText);
    } else if (error.request) {
      console.error('网络错误:', error.message);
    } else {
      console.error('未知错误:', error.message);
    }
  }
}

testRecommendationAPI(); 