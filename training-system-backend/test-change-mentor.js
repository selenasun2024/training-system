const axios = require('axios');

async function testChangeMentor() {
  try {
    console.log('🔍 测试更换导师功能...');
    
    // 1. 获取关系列表
    let response = await axios.get('http://localhost:3000/api/projects/f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79/mentorship/relationships');
    let relationships = response.data.data;
    
    console.log('更换前关系数量:', relationships.length);
    if (relationships.length > 0) {
      console.log('第一个关系:', relationships[0].studentName, '<--', relationships[0].mentorName);
      console.log('关系ID:', relationships[0].id);
      
      // 2. 更换导师
      const relationshipId = relationships[0].id;
      const newMentorId = relationships[0].mentorId === 'counselor-001' ? 'counselor-002' : 'counselor-001';
      
      console.log('即将更换为导师ID:', newMentorId);
      
      const changeResult = await axios.put(
        `http://localhost:3000/api/projects/f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79/mentorship/relationships/${relationshipId}/mentor`,
        {
          newMentorId: newMentorId,
          reason: '',
          updatedAt: new Date().toISOString()
        }
      );
      
      console.log('更换结果:', changeResult.data.data.mentor.name);
      
      // 3. 重新获取验证
      response = await axios.get('http://localhost:3000/api/projects/f0ac9a1a-30e7-42dd-8b22-7e72adbd7a79/mentorship/relationships');
      relationships = response.data.data;
      
      const updatedRel = relationships.find(rel => rel.id === relationshipId);
      console.log('更换后关系:', updatedRel.studentName, '<--', updatedRel.mentorName);
      console.log('成功:', updatedRel.mentorId === newMentorId ? '是' : '否');
    }
    
  } catch (error) {
    console.log('错误:', error.message);
  }
}

testChangeMentor(); 