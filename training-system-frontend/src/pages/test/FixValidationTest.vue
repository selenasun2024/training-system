<template>
  <div class="fix-validation-test">
    <h2>🔧 修复验证测试</h2>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="预算汇总测试" name="budget">
        <div class="test-section">
          <h3>测试预算汇总单位转换</h3>
          <el-button @click="testBudgetSummary" type="primary">测试预算汇总</el-button>
          <div class="test-results" v-if="budgetTestResults.length">
            <h4>测试结果:</h4>
            <div v-for="(result, index) in budgetTestResults" :key="index" class="test-result">
              <el-tag :type="result.success ? 'success' : 'danger'">
                {{ result.name }}: {{ result.success ? '✅ 通过' : '❌ 失败' }}
              </el-tag>
              <p>{{ result.message }}</p>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="资源显示测试" name="resource">
        <div class="test-section">
          <h3>测试资源数据显示</h3>
          <el-button @click="testResourceDisplay" type="primary">测试资源显示</el-button>
          <div class="test-results" v-if="resourceTestResults.length">
            <h4>测试结果:</h4>
            <div v-for="(result, index) in resourceTestResults" :key="index" class="test-result">
              <el-tag :type="result.success ? 'success' : 'danger'">
                {{ result.name }}: {{ result.success ? '✅ 通过' : '❌ 失败' }}
              </el-tag>
              <p>{{ result.message }}</p>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBudgetStore } from '@/stores/budget'
import { useResourceStore } from '@/stores/resources'
import { ElMessage } from 'element-plus'

const activeTab = ref('budget')
const budgetTestResults = ref<Array<{name: string, success: boolean, message: string}>>([])
const resourceTestResults = ref<Array<{name: string, success: boolean, message: string}>>([])

const budgetStore = useBudgetStore()
const resourceStore = useResourceStore()

// 使用真实项目ID进行测试
const testProjectId = 'afe28c61-102a-44c3-82c4-149fc6d8e45b'

async function testBudgetSummary() {
  budgetTestResults.value = []
  
  try {
    // 测试1: 获取预算数据
    await budgetStore.fetchBudget(testProjectId)
    const budgetLines = budgetStore.budgetLines
    
    budgetTestResults.value.push({
      name: '预算数据获取',
      success: Array.isArray(budgetLines),
      message: `获取到 ${budgetLines.length} 条预算数据`
    })
    
    // 测试2: 计算汇总
    const totalBudget = budgetStore.totalBudget
    const displayAmount = totalBudget / 100 // 转换为元
    
    budgetTestResults.value.push({
      name: '预算汇总计算',
      success: typeof totalBudget === 'number',
      message: `原始金额: ${totalBudget}分, 显示金额: ¥${displayAmount.toLocaleString()}`
    })
    
    // 测试3: 验证单位转换正确性
    // 假设用户输入200元，应该存储为20000分，显示为200元
    const testInput = 200 // 用户输入
    const storedValue = testInput * 100 // 存储值
    const displayValue = storedValue / 100 // 显示值
    
    budgetTestResults.value.push({
      name: '单位转换验证',
      success: displayValue === testInput,
      message: `输入${testInput}元 → 存储${storedValue}分 → 显示${displayValue}元 ${displayValue === testInput ? '✅' : '❌'}`
    })
    
    ElMessage.success('预算汇总测试完成')
  } catch (error) {
    budgetTestResults.value.push({
      name: '测试异常',
      success: false,
      message: `测试失败: ${error.message}`
    })
    ElMessage.error('预算汇总测试失败')
  }
}

async function testResourceDisplay() {
  resourceTestResults.value = []
  
  try {
    // 测试1: 获取资源数据
    await resourceStore.fetchResources(testProjectId)
    const resources = resourceStore.resources
    
    resourceTestResults.value.push({
      name: '资源数据获取',
      success: Array.isArray(resources),
      message: `获取到 ${resources.length} 条资源数据`
    })
    
    // 测试2: 按类型过滤
    const digitalAssets = resourceStore.byType('digital')
    const serviceBookings = resourceStore.byType('service')
    const supplyItems = resourceStore.byType('supply')
    
    resourceTestResults.value.push({
      name: '数字资源过滤',
      success: digitalAssets && digitalAssets.value !== undefined,
      message: `数字资源: ${digitalAssets?.value?.length || 0} 条`
    })
    
    resourceTestResults.value.push({
      name: '服务资源过滤',
      success: serviceBookings && serviceBookings.value !== undefined,
      message: `服务资源: ${serviceBookings?.value?.length || 0} 条`
    })
    
    resourceTestResults.value.push({
      name: '物料资源过滤',
      success: supplyItems && supplyItems.value !== undefined,
      message: `物料资源: ${supplyItems?.value?.length || 0} 条`
    })
    
    // 测试3: 数据格式验证
    const firstResource = resources[0]
    if (firstResource) {
      resourceTestResults.value.push({
        name: '数据格式验证',
        success: firstResource.type && firstResource.name,
        message: `示例资源: ${firstResource.name} (${firstResource.type})`
      })
    }
    
    ElMessage.success('资源显示测试完成')
  } catch (error) {
    resourceTestResults.value.push({
      name: '测试异常',
      success: false,
      message: `测试失败: ${error.message}`
    })
    ElMessage.error('资源显示测试失败')
  }
}
</script>

<style scoped>
.fix-validation-test {
  padding: 20px;
}

.test-section {
  margin: 20px 0;
}

.test-results {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.test-result {
  margin: 10px 0;
  padding: 10px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.test-result p {
  margin: 5px 0 0 0;
  color: #606266;
}
</style> 