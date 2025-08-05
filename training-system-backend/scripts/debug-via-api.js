const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:3000/api';
const COUNSELOR_ID = 'user-hr-001';

async function debugViaAPI() {
  try {
    console.log('=== 通过API调试项目数据 ===\n');
    
    // 首先获取所有项目信息（通过观察API）
    console.log('1. 获取所有项目的观察目标...');
    try {
      const observationResponse = await axios.get(`${API_BASE}/observations/counselor/${COUNSELOR_ID}`);
      
             console.log('观察目标API响应状态:', observationResponse.status);
       const observationData = observationResponse.data;
       
       // API直接返回数组，不是包装在success/data中
       let targets = [];
       if (Array.isArray(observationData)) {
         targets = observationData;
       } else if (observationData.success && observationData.data) {
         targets = observationData.data;
       } else {
         console.log('未知的观察API响应格式:', observationData);
       }
       
       if (targets.length > 0) {
        console.log(`找到 ${targets.length} 个观察目标`);
        
        // 按项目分组
        const projectMap = new Map();
        targets.forEach(target => {
          if (!projectMap.has(target.projectId)) {
            projectMap.set(target.projectId, {
              id: target.projectId,
              name: target.projectName,
              students: []
            });
          }
          projectMap.get(target.projectId).students.push({
            id: target.traineeId,
            name: target.traineeName,
            status: target.status
          });
        });
        
        console.log('\n项目列表:');
        Array.from(projectMap.values()).forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.name} (${project.id})`);
          console.log(`     学员数: ${project.students.length}`);
          console.log(`     已提交观察记录的学员: ${project.students.filter(s => s.status === 'submitted').length}`);
        });
        
                 // 查找新员工入职培训项目，同时也检查其他有观察记录的项目
         let targetProject = Array.from(projectMap.values())
           .find(p => p.name.includes('新员工入职培训'));
           
         if (!targetProject) {
           // 如果没找到新员工入职培训项目，使用第一个有已提交观察记录的项目
           targetProject = Array.from(projectMap.values())
             .find(p => p.students.some(s => s.status === 'submitted'));
         }
           
         if (targetProject) {
           console.log(`\n✅ 找到目标项目: ${targetProject.name}`);
                     console.log(`项目ID: ${targetProject.id}`);
           
           const submittedStudents = targetProject.students.filter(s => s.status === 'submitted');
           console.log(`有观察记录的学员数: ${submittedStudents.length}`);
           
           if (submittedStudents.length > 0) {
             console.log('有观察记录的学员:');
             submittedStudents.forEach((student, index) => {
               console.log(`  ${index + 1}. ${student.name} (${student.id})`);
             });
             
             // 2. 测试推荐API
             console.log('\n2. 测试推荐API...');
             try {
               const recommendationResponse = await axios.get(
                 `${API_BASE}/recommendations/projects/${targetProject.id}/students`,
                {
                  params: { counselorId: COUNSELOR_ID }
                }
              );
              
              console.log('推荐API响应状态:', recommendationResponse.status);
              const recommendationData = recommendationResponse.data;
              
              console.log('推荐API响应:', JSON.stringify(recommendationData, null, 2));
              
              if (recommendationData.success) {
                console.log(`推荐API返回的学员数: ${recommendationData.data.length}`);
                
                if (recommendationData.data.length === 0) {
                  console.log('\n❌ 推荐API返回空数据，但观察API显示有学员！');
                  console.log('这确认了数据不一致问题的存在。');
                } else {
                  console.log('\n✅ 推荐API返回了学员数据:');
                  recommendationData.data.forEach((student, index) => {
                    console.log(`  ${index + 1}. ${student.name} (${student.id})`);
                  });
                }
              } else {
                console.log('❌ 推荐API返回失败:', recommendationData.message);
              }
              
            } catch (apiError) {
              console.error('调用推荐API失败:', apiError.message);
              if (apiError.response) {
                console.error('响应状态:', apiError.response.status);
                console.error('响应数据:', apiError.response.data);
              }
            }
          } else {
            console.log('该项目没有已提交的观察记录');
          }
                 } else {
           console.log('\n❌ 未找到有观察记录的项目');
           console.log('可用的项目:');
           Array.from(projectMap.values()).forEach(p => {
             console.log(`  - ${p.name} (有观察记录的学员: ${p.students.filter(s => s.status === 'submitted').length})`);
           });
         }
             } else {
         console.log('没有观察目标数据');
       }
    } catch (error) {
      console.error('调用观察API失败:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('调试过程中发生错误:', error.message);
  }
}

debugViaAPI(); 