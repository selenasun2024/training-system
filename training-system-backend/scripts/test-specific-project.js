const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:3000/api';
const COUNSELOR_ID = 'user-hr-001';
const PROJECT_ID = '4bcf4bb2-2b78-4408-9687-e515cbff5da8'; // 用户报告无数据的项目

async function testSpecificProject() {
  try {
    console.log('=== 测试特定项目数据 ===\n');
    console.log(`项目ID: ${PROJECT_ID}`);
    console.log(`辅导员ID: ${COUNSELOR_ID}\n`);
    
    // 1. 测试观察API
    console.log('1. 测试观察API...');
    try {
      const observationResponse = await axios.get(`${API_BASE}/observations/counselor/${COUNSELOR_ID}`);
      
      console.log('观察API响应状态:', observationResponse.status);
      const allTargets = observationResponse.data;
      
      if (Array.isArray(allTargets)) {
        console.log(`所有观察目标数量: ${allTargets.length}`);
        
        // 查找该项目的观察记录
        const projectTargets = allTargets.filter(t => t.projectId === PROJECT_ID);
        console.log(`项目 ${PROJECT_ID} 的观察目标数量: ${projectTargets.length}`);
        
        if (projectTargets.length > 0) {
          console.log('该项目的观察记录:');
          projectTargets.forEach((target, index) => {
            console.log(`  ${index + 1}. ${target.traineeName} (${target.traineeId}) - 状态: ${target.status}`);
            console.log(`     项目: ${target.projectName}`);
          });
        } else {
          console.log('❌ 该项目没有观察记录');
          
          // 显示该辅导员所有项目的观察记录
          const projectMap = new Map();
          allTargets.forEach(target => {
            if (!projectMap.has(target.projectId)) {
              projectMap.set(target.projectId, {
                id: target.projectId,
                name: target.projectName,
                students: []
              });
            }
            projectMap.get(target.projectId).students.push({
              name: target.traineeName,
              status: target.status
            });
          });
          
          console.log('\n该辅导员的所有项目观察记录:');
          Array.from(projectMap.values()).forEach((project, index) => {
            console.log(`  ${index + 1}. ${project.name} (${project.id})`);
            console.log(`     观察目标数: ${project.students.length}`);
            const submitted = project.students.filter(s => s.status === 'submitted');
            console.log(`     已提交观察: ${submitted.length}`);
          });
        }
      }
    } catch (error) {
      console.error('观察API调用失败:', error.message);
    }
    
    // 2. 测试推荐API
    console.log('\n2. 测试推荐API...');
    try {
      const recommendationResponse = await axios.get(
        `${API_BASE}/recommendations/projects/${PROJECT_ID}/students`,
        {
          params: { counselorId: COUNSELOR_ID }
        }
      );
      
      console.log('推荐API响应状态:', recommendationResponse.status);
      const recommendationData = recommendationResponse.data;
      
      console.log('推荐API完整响应:', JSON.stringify(recommendationData, null, 2));
      
      if (recommendationData.success) {
        console.log(`推荐API消息: ${recommendationData.message}`);
        console.log(`返回学员数: ${recommendationData.data.length}`);
      }
    } catch (error) {
      console.error('推荐API调用失败:', error.message);
    }
    
    // 3. 测试推荐记录API
    console.log('\n3. 测试推荐记录API...');
    try {
      const recommendationRecordsResponse = await axios.get(
        `${API_BASE}/recommendations/projects/${PROJECT_ID}/my-recommendations`,
        {
          params: { counselorId: COUNSELOR_ID }
        }
      );
      
      console.log('推荐记录API响应状态:', recommendationRecordsResponse.status);
      const recordsData = recommendationRecordsResponse.data;
      
      console.log('推荐记录API完整响应:', JSON.stringify(recordsData, null, 2));
      
      if (recordsData.success) {
        console.log(`推荐记录API消息: ${recordsData.message}`);
        console.log(`返回记录数: ${recordsData.data.length}`);
      }
    } catch (error) {
      console.error('推荐记录API调用失败:', error.message);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

testSpecificProject(); 