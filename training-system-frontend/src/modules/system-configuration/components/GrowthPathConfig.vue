<template>
  <div class="growth-path-config">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <h3>成长路径配置</h3>
          <el-button type="primary" @click="handleAddPath">
            <el-icon><Plus /></el-icon>
            添加路径
          </el-button>
        </div>
      </template>

      <div class="path-list">
        <div v-for="path in growthPaths" :key="path.id" class="path-item">
          <el-card class="path-card">
            <template #header>
              <div class="path-header">
                <span class="path-name">{{ path.name }}</span>
                <div class="path-actions">
                  <el-button type="text" @click="handleEditPath(path)">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button type="text" @click="handleDeletePath(path.id)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
            </template>
            
            <div class="path-content">
              <div class="path-info">
                <p><strong>描述：</strong>{{ path.description }}</p>
                <p><strong>目标岗位：</strong>{{ path.targetPosition }}</p>
                <p><strong>预计周期：</strong>{{ path.duration }}个月</p>
              </div>
              
              <div class="path-nodes">
                <h4>路径节点</h4>
                <div class="nodes-grid">
                  <div v-for="node in path.nodes" :key="node.id" class="node-item">
                    <div class="node-header">
                      <span class="node-name">{{ node.name }}</span>
                      <el-tag :type="getNodeStatusType(node.status)">{{ node.status }}</el-tag>
                    </div>
                    <div class="node-details">
                      <p class="node-description">{{ node.description }}</p>
                      <div class="node-requirements">
                        <strong>能力要求：</strong>
                        <el-tag 
                          v-for="skill in node.requiredSkills" 
                          :key="skill" 
                          size="small"
                          class="skill-tag"
                        >
                          {{ skill }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>

    <!-- 添加/编辑路径对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEditing ? '编辑成长路径' : '添加成长路径'"
      width="800px"
    >
      <el-form :model="currentPath" :rules="pathRules" ref="pathFormRef" label-width="120px">
        <el-form-item label="路径名称" prop="name">
          <el-input v-model="currentPath.name" placeholder="请输入路径名称" />
        </el-form-item>
        
        <el-form-item label="路径描述" prop="description">
          <el-input 
            v-model="currentPath.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入路径描述"
          />
        </el-form-item>
        
        <el-form-item label="目标岗位" prop="targetPosition">
          <el-input v-model="currentPath.targetPosition" placeholder="请输入目标岗位" />
        </el-form-item>
        
        <el-form-item label="预计周期" prop="duration">
          <el-input-number 
            v-model="currentPath.duration" 
            :min="1" 
            :max="60"
            controls-position="right"
          />
          <span style="margin-left: 8px;">个月</span>
        </el-form-item>
        
        <el-form-item label="路径节点">
          <div class="nodes-form">
            <div v-for="(node, index) in currentPath.nodes" :key="node.tempId" class="node-form-item">
              <el-card class="node-form-card">
                <template #header>
                  <div class="node-form-header">
                    <span>节点 {{ index + 1 }}</span>
                    <el-button 
                      type="text" 
                      @click="removeNode(index)"
                      :disabled="currentPath.nodes.length <= 1"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </template>
                
                <el-form-item label="节点名称" :prop="`nodes.${index}.name`">
                  <el-input v-model="node.name" placeholder="请输入节点名称" />
                </el-form-item>
                
                <el-form-item label="节点描述" :prop="`nodes.${index}.description`">
                  <el-input 
                    v-model="node.description" 
                    type="textarea" 
                    :rows="2"
                    placeholder="请输入节点描述"
                  />
                </el-form-item>
                
                <el-form-item label="能力要求">
                  <div class="skills-input">
                    <el-tag
                      v-for="skill in node.requiredSkills"
                      :key="skill"
                      closable
                      @close="removeSkill(index, skill)"
                      class="skill-tag"
                    >
                      {{ skill }}
                    </el-tag>
                    <el-input
                      v-if="node.inputVisible"
                      ref="skillInputRef"
                      v-model="node.inputValue"
                      class="skill-input"
                      size="small"
                      @keyup.enter="confirmSkill(index)"
                      @blur="confirmSkill(index)"
                    />
                    <el-button
                      v-else
                      class="button-new-tag"
                      size="small"
                      @click="showSkillInput(index)"
                    >
                      + 添加能力
                    </el-button>
                  </div>
                </el-form-item>
              </el-card>
            </div>
            
            <el-button type="dashed" @click="addNode" class="add-node-btn">
              <el-icon><Plus /></el-icon>
              添加节点
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSavePath">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

interface GrowthPathNode {
  id: string
  tempId?: string
  name: string
  description: string
  status: string
  requiredSkills: string[]
  inputVisible?: boolean
  inputValue?: string
}

interface GrowthPath {
  id: string
  name: string
  description: string
  targetPosition: string
  duration: number
  nodes: GrowthPathNode[]
}

// 成长路径数据
const growthPaths = ref<GrowthPath[]>([
  {
    id: '1',
    name: '新员工→资深专员',
    description: '新员工向资深专员发展的标准路径',
    targetPosition: '资深专员',
    duration: 12,
    nodes: [
      {
        id: '1-1',
        name: '入职适应期',
        description: '熟悉工作环境，掌握基本技能',
        status: '必经节点',
        requiredSkills: ['基础业务知识', '团队协作', '沟通能力']
      },
      {
        id: '1-2',
        name: '技能提升期',
        description: '深入学习专业技能，承担更多责任',
        status: '必经节点',
        requiredSkills: ['专业技能', '项目管理', '问题解决']
      },
      {
        id: '1-3',
        name: '独立工作期',
        description: '能够独立完成复杂任务，指导新人',
        status: '必经节点',
        requiredSkills: ['独立工作', '指导能力', '业务创新']
      }
    ]
  },
  {
    id: '2',
    name: '专员→主管',
    description: '专员向主管岗位发展的管理路径',
    targetPosition: '主管',
    duration: 18,
    nodes: [
      {
        id: '2-1',
        name: '管理基础',
        description: '学习管理基础知识，培养管理思维',
        status: '必经节点',
        requiredSkills: ['管理基础', '目标设定', '时间管理']
      },
      {
        id: '2-2',
        name: '团队协作',
        description: '提升团队协作和沟通能力',
        status: '必经节点',
        requiredSkills: ['团队建设', '冲突解决', '激励技巧']
      },
      {
        id: '2-3',
        name: '管理实践',
        description: '在实际工作中应用管理技能',
        status: '必经节点',
        requiredSkills: ['绩效管理', '人才培养', '决策能力']
      }
    ]
  }
])

// 表单相关
const dialogVisible = ref(false)
const isEditing = ref(false)
const pathFormRef = ref<FormInstance>()
const skillInputRef = ref()

// 当前编辑的路径
const currentPath = reactive<GrowthPath>({
  id: '',
  name: '',
  description: '',
  targetPosition: '',
  duration: 12,
  nodes: []
})

// 表单验证规则
const pathRules: FormRules = {
  name: [
    { required: true, message: '请输入路径名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入路径描述', trigger: 'blur' }
  ],
  targetPosition: [
    { required: true, message: '请输入目标岗位', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请输入预计周期', trigger: 'blur' }
  ]
}

// 获取节点状态类型
const getNodeStatusType = (status: string) => {
  switch (status) {
    case '必经节点':
      return 'danger'
    case '可选节点':
      return 'warning'
    case '已完成':
      return 'success'
    default:
      return 'info'
  }
}

// 添加路径
const handleAddPath = () => {
  isEditing.value = false
  resetCurrentPath()
  dialogVisible.value = true
}

// 编辑路径
const handleEditPath = (path: GrowthPath) => {
  isEditing.value = true
  Object.assign(currentPath, JSON.parse(JSON.stringify(path)))
  // 为节点添加临时ID
  currentPath.nodes.forEach((node, index) => {
    node.tempId = `temp_${index}`
  })
  dialogVisible.value = true
}

// 删除路径
const handleDeletePath = async (pathId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个成长路径吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    const index = growthPaths.value.findIndex(p => p.id === pathId)
    if (index > -1) {
      growthPaths.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

// 保存路径
const handleSavePath = async () => {
  if (!pathFormRef.value) return
  
  try {
    await pathFormRef.value.validate()
    
    if (isEditing.value) {
      // 编辑模式
      const index = growthPaths.value.findIndex(p => p.id === currentPath.id)
      if (index > -1) {
        growthPaths.value[index] = JSON.parse(JSON.stringify(currentPath))
      }
      ElMessage.success('编辑成功')
    } else {
      // 添加模式
      const newPath = JSON.parse(JSON.stringify(currentPath))
      newPath.id = Date.now().toString()
      newPath.nodes.forEach((node, index) => {
        node.id = `${newPath.id}-${index + 1}`
        delete node.tempId
      })
      growthPaths.value.push(newPath)
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
  } catch {
    ElMessage.error('请检查表单内容')
  }
}

// 重置当前路径
const resetCurrentPath = () => {
  Object.assign(currentPath, {
    id: '',
    name: '',
    description: '',
    targetPosition: '',
    duration: 12,
    nodes: [{
      id: '',
      tempId: 'temp_0',
      name: '',
      description: '',
      status: '必经节点',
      requiredSkills: [],
      inputVisible: false,
      inputValue: ''
    }]
  })
}

// 添加节点
const addNode = () => {
  currentPath.nodes.push({
    id: '',
    tempId: `temp_${currentPath.nodes.length}`,
    name: '',
    description: '',
    status: '必经节点',
    requiredSkills: [],
    inputVisible: false,
    inputValue: ''
  })
}

// 删除节点
const removeNode = (index: number) => {
  currentPath.nodes.splice(index, 1)
}

// 显示技能输入
const showSkillInput = (nodeIndex: number) => {
  currentPath.nodes[nodeIndex].inputVisible = true
  nextTick(() => {
    skillInputRef.value?.focus()
  })
}

// 确认添加技能
const confirmSkill = (nodeIndex: number) => {
  const node = currentPath.nodes[nodeIndex]
  if (node.inputValue && !node.requiredSkills.includes(node.inputValue)) {
    node.requiredSkills.push(node.inputValue)
  }
  node.inputVisible = false
  node.inputValue = ''
}

// 删除技能
const removeSkill = (nodeIndex: number, skill: string) => {
  const node = currentPath.nodes[nodeIndex]
  const index = node.requiredSkills.indexOf(skill)
  if (index > -1) {
    node.requiredSkills.splice(index, 1)
  }
}
</script>

<style scoped>
.growth-path-config {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

.path-list {
  margin-top: 20px;
}

.path-item {
  margin-bottom: 20px;
}

.path-card {
  border: 1px solid #e4e7ed;
}

.path-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.path-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.path-actions {
  display: flex;
  gap: 8px;
}

.path-content {
  margin-top: 16px;
}

.path-info {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.path-info p {
  margin: 8px 0;
  color: #606266;
}

.path-nodes h4 {
  margin-bottom: 16px;
  color: #303133;
}

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.node-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  background-color: #fff;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.node-name {
  font-weight: 600;
  color: #303133;
}

.node-description {
  color: #606266;
  margin-bottom: 12px;
}

.node-requirements {
  margin-top: 8px;
}

.skill-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.nodes-form {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
}

.node-form-item {
  margin-bottom: 16px;
}

.node-form-card {
  border: 1px solid #e4e7ed;
}

.node-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skills-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.skill-input {
  width: 120px;
}

.button-new-tag {
  border: 1px dashed #d9d9d9;
  color: #999;
}

.add-node-btn {
  width: 100%;
  height: 40px;
  border: 1px dashed #d9d9d9;
  background-color: #fafafa;
  color: #666;
}

.dialog-footer {
  text-align: right;
}
</style> 