<template>
  <div class="test-page">
    <el-card header="资源和预算功能测试">
      <div class="test-section">
        <h3>项目信息</h3>
        <p>项目ID: {{ projectId }}</p>
        <el-button @click="testProjectInfo" type="primary">测试项目信息</el-button>
      </div>

      <div class="test-section">
        <h3>资源管理测试</h3>
        <el-button @click="testResourceAPI" type="primary">测试资源API</el-button>
        <el-button @click="createTestResource" type="success">创建测试资源</el-button>
        <div v-if="resourceTestResult">
          <h4>资源API响应:</h4>
          <pre>{{ JSON.stringify(resourceTestResult, null, 2) }}</pre>
        </div>
        <div v-if="resourceStore.resources.length > 0">
          <h4>Store中的资源数据:</h4>
          <pre>{{ JSON.stringify(resourceStore.resources, null, 2) }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>预算管理测试</h3>
        <el-button @click="testBudgetAPI" type="primary">测试预算API</el-button>
        <el-button @click="testBudgetSummary" type="warning">测试预算汇总</el-button>
        <el-button @click="createTestBudget" type="success">创建测试预算</el-button>
        <div v-if="budgetTestResult">
          <h4>预算API响应:</h4>
          <pre>{{ JSON.stringify(budgetTestResult, null, 2) }}</pre>
        </div>
        <div v-if="budgetSummaryResult">
          <h4>预算汇总:</h4>
          <pre>{{ JSON.stringify(budgetSummaryResult, null, 2) }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>调试信息</h3>
        <div v-if="debugInfo.length > 0">
          <div v-for="(info, index) in debugInfo" :key="index" class="debug-item">
            <span class="debug-time">{{ info.time }}</span>
            <span class="debug-message">{{ info.message }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useResourceStore } from '@/stores/resources'
import * as resourceApi from '@/api/modules/resource'
import * as budgetApi from '@/api/modules/budget'

const projectId = 'd4da6e26-edb8-4e50-b96d-31650756d9de'
const resourceStore = useResourceStore()

const resourceTestResult = ref(null)
const budgetTestResult = ref(null)
const budgetSummaryResult = ref(null)
const debugInfo = ref([])

function addDebugInfo(message: string) {
  debugInfo.value.push({
    time: new Date().toLocaleTimeString(),
    message
  })
}

async function testProjectInfo() {
  try {
    addDebugInfo('开始测试项目信息...')
    const response = await fetch(`/api/projects/${projectId}`)
    const result = await response.json()
    addDebugInfo(`项目信息获取成功: ${JSON.stringify(result)}`)
  } catch (error) {
    addDebugInfo(`项目信息获取失败: ${error.message}`)
  }
}

async function testResourceAPI() {
  try {
    addDebugInfo('开始测试资源API...')
    
    // 测试获取资源
    const resources = await resourceApi.getResources(projectId)
    resourceTestResult.value = resources
    addDebugInfo(`资源API响应: ${JSON.stringify(resources)}`)
    
    // 测试Store获取
    await resourceStore.fetchResources(projectId)
    addDebugInfo(`Store中的资源数据: ${JSON.stringify(resourceStore.resources)}`)
    
    ElMessage.success('资源API测试完成')
  } catch (error) {
    addDebugInfo(`资源API测试失败: ${error.message}`)
    ElMessage.error(`资源API测试失败: ${error.message}`)
  }
}

async function createTestResource() {
  try {
    addDebugInfo('开始创建测试资源...')
    
    const testResource = {
      type: 'DIGITAL',
      name: '测试资源-' + Date.now(),
      spec: '测试规格',
      responsible: '测试负责人',
      budgetAmount: 1000
    }
    
    const result = await resourceApi.createResource(projectId, testResource)
    addDebugInfo(`测试资源创建成功: ${JSON.stringify(result)}`)
    
    // 重新获取数据
    await testResourceAPI()
    
    ElMessage.success('测试资源创建成功')
  } catch (error) {
    addDebugInfo(`测试资源创建失败: ${error.message}`)
    ElMessage.error(`测试资源创建失败: ${error.message}`)
  }
}

async function testBudgetAPI() {
  try {
    addDebugInfo('开始测试预算API...')
    
    const budgets = await budgetApi.getBudgetLines(projectId)
    budgetTestResult.value = budgets
    addDebugInfo(`预算API响应: ${JSON.stringify(budgets)}`)
    
    ElMessage.success('预算API测试完成')
  } catch (error) {
    addDebugInfo(`预算API测试失败: ${error.message}`)
    ElMessage.error(`预算API测试失败: ${error.message}`)
  }
}

async function testBudgetSummary() {
  try {
    addDebugInfo('开始测试预算汇总...')
    
    const summary = await budgetApi.getBudgetSummary(projectId)
    budgetSummaryResult.value = summary
    addDebugInfo(`预算汇总响应: ${JSON.stringify(summary)}`)
    
    ElMessage.success('预算汇总测试完成')
  } catch (error) {
    addDebugInfo(`预算汇总测试失败: ${error.message}`)
    ElMessage.error(`预算汇总测试失败: ${error.message}`)
  }
}

async function createTestBudget() {
  try {
    addDebugInfo('开始创建测试预算...')
    
    const testBudget = [{
      category: '测试类别',
      item: '测试预算项-' + Date.now(),
      budgetAmount: 2000,
      notes: '测试预算说明'
    }]
    
    const result = await budgetApi.createBudgetLines(projectId, testBudget)
    addDebugInfo(`测试预算创建成功: ${JSON.stringify(result)}`)
    
    // 重新获取数据
    await testBudgetAPI()
    await testBudgetSummary()
    
    ElMessage.success('测试预算创建成功')
  } catch (error) {
    addDebugInfo(`测试预算创建失败: ${error.message}`)
    ElMessage.error(`测试预算创建失败: ${error.message}`)
  }
}

onMounted(() => {
  addDebugInfo('测试页面已加载')
})
</script>

<style scoped>
.test-page {
  padding: 20px;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.test-section h3 {
  margin-top: 0;
  color: #333;
}

.test-section button {
  margin-right: 10px;
  margin-bottom: 10px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  font-size: 12px;
}

.debug-item {
  display: block;
  margin-bottom: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.debug-time {
  color: #666;
  font-size: 12px;
  margin-right: 10px;
}

.debug-message {
  color: #333;
}
</style> 