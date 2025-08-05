const fetch = require('node-fetch');

const baseUrl = 'http://localhost:3000';
const testProjectId = 'test-project-001';

const testAPIs = [
  {
    name: '获取项目师徒关系',
    method: 'GET',
    url: `/api/projects/${testProjectId}/mentorship/relationships`
  },
  {
    name: '获取带教进度',
    method: 'GET',
    url: `/api/projects/${testProjectId}/mentorship/progress`
  },
  {
    name: '获取带教评价',
    method: 'GET',
    url: `/api/projects/${testProjectId}/mentorship/evaluations`
  },
  {
    name: '获取带教标准',
    method: 'GET',
    url: `/api/projects/${testProjectId}/mentorship/standards`
  }
];

async function testAPI(api) {
  try {
    console.log(`\n🔍 测试: ${api.name}`);
    console.log(`   ${api.method} ${api.url}`);
    
    const response = await fetch(`${baseUrl}${api.url}`, {
      method: api.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ 成功: ${response.status}`);
      console.log(`   数据: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log(`❌ 失败: ${response.status}`);
      console.log(`   错误: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    console.log(`💥 请求异常: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 开始测试项目详情-带教 API集成...\n');
  
  for (const api of testAPIs) {
    await testAPI(api);
    await new Promise(resolve => setTimeout(resolve, 500)); // 间隔500ms
  }
  
  console.log('\n🏁 测试完成!');
}

// 运行测试
runTests().catch(console.error); 