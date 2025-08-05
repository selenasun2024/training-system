const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const PROJECT_ID = 'f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79'; // 使用之前测试的项目ID

async function testPhaseAssignmentAPIs() {
  console.log('🔍 测试阶段指派模式API...');
  console.log('📋 测试项目ID:', PROJECT_ID);
  
  try {
    // 1. 测试获取项目师徒阶段列表
    console.log('\n1️⃣ 测试获取项目师徒阶段列表...');
    const phasesResponse = await axios.get(`${BASE_URL}/api/projects/${PROJECT_ID}/mentorship/phases`);
    
    console.log('✅ 获取师徒阶段成功!');
    console.log('📊 阶段数量:', phasesResponse.data.data?.length || 0);
    
    if (phasesResponse.data.data && phasesResponse.data.data.length > 0) {
      const firstPhase = phasesResponse.data.data[0];
      console.log('📋 第一个阶段信息:');
      console.log('   - ID:', firstPhase.id);
      console.log('   - 名称:', firstPhase.name);
      console.log('   - 状态:', firstPhase.status);
      console.log('   - 当前指派数:', firstPhase.assignments?.length || 0);
      
      // 2. 测试创建阶段指派
      console.log('\n2️⃣ 测试创建阶段指派...');
      const assignmentData = {
        assignments: [{
          mentorId: 'counselor-001',
          studentIds: ['user-market-001', 'user-tech-005']
        }]
      };
      
      console.log('📝 指派数据:', JSON.stringify(assignmentData, null, 2));
      
      try {
        const createResponse = await axios.post(
          `${BASE_URL}/api/projects/${PROJECT_ID}/mentorship/phases/${firstPhase.id}/relationships`,
          assignmentData
        );
        
        console.log('✅ 创建阶段指派成功!');
        console.log('📋 响应:', createResponse.data);
        
        // 3. 测试获取阶段指派
        console.log('\n3️⃣ 测试获取阶段指派...');
        const assignmentsResponse = await axios.get(
          `${BASE_URL}/api/projects/${PROJECT_ID}/mentorship/phases/${firstPhase.id}/relationships`
        );
        
        console.log('✅ 获取阶段指派成功!');
        console.log('📊 指派数量:', assignmentsResponse.data.data?.length || 0);
        
        if (assignmentsResponse.data.data && assignmentsResponse.data.data.length > 0) {
          console.log('📋 第一个指派信息:', assignmentsResponse.data.data[0]);
        }
        
      } catch (createError) {
        console.error('❌ 创建阶段指派失败:', createError.response?.data || createError.message);
      }
      
    } else {
      console.log('⚠️ 项目暂无阶段数据');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testPhaseAssignmentAPIs(); 