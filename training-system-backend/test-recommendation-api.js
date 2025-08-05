const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 测试用的JWT Token (通常需要通过登录获取)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM3MDE5NjAwLCJleHAiOjE3Mzc2MjQ0MDB9.test';

// 设置默认请求头
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testRecommendationAPI() {
  console.log('🚀 开始测试推荐系统API...\n');
  
  const projectId = 'test-project-id';
  const studentId = 'test-student-id';
  
  try {
    // 1. 测试获取学员表现数据
    console.log('1. 测试获取学员表现数据...');
    try {
      const response = await api.get(`/api/recommendations/projects/${projectId}/students`);
      console.log('✅ 获取学员表现数据成功:', response.data);
    } catch (error) {
      console.log('❌ 获取学员表现数据失败:', error.response?.data || error.message);
    }
    
    // 2. 测试更新学员表现
    console.log('\n2. 测试更新学员表现...');
    try {
      const performanceData = {
        rank: 1,
        attendance_rate: 95.5,
        task_completion_rate: 98.0,
        role: '小组长',
        observation_tags: ['领导力强', '善于沟通', '执行力强']
      };
      
      const response = await api.put(`/api/recommendations/projects/${projectId}/students/${studentId}/performance`, performanceData);
      console.log('✅ 更新学员表现成功:', response.data);
    } catch (error) {
      console.log('❌ 更新学员表现失败:', error.response?.data || error.message);
    }
    
    // 3. 测试创建推荐
    console.log('\n3. 测试创建推荐...');
    try {
      const recommendationData = {
        student_id: studentId,
        type: 'YULIN',
        leadership_score: 5,
        innovation_score: 4,
        execution_score: 5,
        teamwork_score: 4,
        reason: '该学员在培训期间表现优秀，具备出色的领导能力和执行力，建议推荐为羽林卫。'
      };
      
      const response = await api.post(`/api/recommendations/projects/${projectId}`, recommendationData);
      console.log('✅ 创建推荐成功:', response.data);
    } catch (error) {
      console.log('❌ 创建推荐失败:', error.response?.data || error.message);
    }
    
    // 4. 测试获取管理员推荐列表
    console.log('\n4. 测试获取管理员推荐列表...');
    try {
      const response = await api.get(`/api/recommendations/admin/projects/${projectId}`);
      console.log('✅ 获取推荐列表成功:', response.data);
    } catch (error) {
      console.log('❌ 获取推荐列表失败:', error.response?.data || error.message);
    }
    
    // 5. 测试获取推荐统计
    console.log('\n5. 测试获取推荐统计...');
    try {
      const response = await api.get(`/api/recommendations/admin/projects/${projectId}/stats`);
      console.log('✅ 获取推荐统计成功:', response.data);
    } catch (error) {
      console.log('❌ 获取推荐统计失败:', error.response?.data || error.message);
    }
    
    // 6. 测试审核推荐
    console.log('\n6. 测试审核推荐...');
    try {
      const reviewData = {
        status: 'APPROVED',
        review_comment: '推荐理由充分，同意推荐。'
      };
      
      const recommendationId = 'test-recommendation-id';
      const response = await api.put(`/api/recommendations/admin/${recommendationId}/review`, reviewData);
      console.log('✅ 审核推荐成功:', response.data);
    } catch (error) {
      console.log('❌ 审核推荐失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
  
  console.log('\n🏁 推荐系统API测试完成！');
}

// 运行测试
testRecommendationAPI(); 