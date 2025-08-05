<template>
  <div class="assessment-center-layout">
    <div class="left-menu">
      <el-menu 
        :default-active="activeMenu" 
        @select="handleMenuSelect"
        class="assessment-menu"
      >
        <!-- 测试中心组 -->
        <el-menu-item-group title="测试中心">
          <el-menu-item index="question-bank">
            <el-icon><Edit /></el-icon>
            <span>题库管理</span>
          </el-menu-item>
          <el-menu-item index="exam-paper">
            <el-icon><Document /></el-icon>
            <span>试卷管理</span>
          </el-menu-item>
          <el-menu-item index="exam-management">
            <el-icon><Calendar /></el-icon>
            <span>考试管理</span>
          </el-menu-item>
        </el-menu-item-group>
        
        <!-- 调查中心组 -->
        <el-menu-item-group title="调查中心">
          <el-menu-item index="survey-management">
            <el-icon><TrendCharts /></el-icon>
            <span>调查管理</span>
          </el-menu-item>
          <el-menu-item index="questionnaire-template">
            <el-icon><Document /></el-icon>
            <span>问卷模板</span>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </div>
    
    <div class="main-content">
      <component :is="currentComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Edit, 
  Document, 
  Calendar, 
  TrendCharts 
} from '@element-plus/icons-vue'

// 导入测评中心各个功能组件
import QuestionBank from './test/QuestionBank.vue'
import ExamPaper from './test/ExamPaper.vue'
import ExamManagement from './test/ExamManagement.vue'
import SurveyManagement from './survey/SurveyManagement.vue'
import QuestionnaireTemplate from './survey/QuestionnaireTemplate.vue'

const activeMenu = ref('questionnaire-template')

// 组件映射
const componentMap = {
  'question-bank': QuestionBank,
  'exam-paper': ExamPaper,
  'exam-management': ExamManagement,
  'survey-management': SurveyManagement,
  'questionnaire-template': QuestionnaireTemplate,
}

const currentComponent = computed(() => {
  return componentMap[activeMenu.value as keyof typeof componentMap]
})

function handleMenuSelect(index: string) {
  activeMenu.value = index
}
</script>

<style scoped>
.assessment-center-layout {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 600px;
}

.left-menu {
  width: 240px;
  background: white;
  border-radius: 8px;
  padding: 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.assessment-menu {
  border: none;
}

.assessment-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
  margin: 4px 12px;
  border-radius: 6px;
  transition: all 0.3s;
}

.assessment-menu .el-menu-item:hover {
  background-color: #f0f2f5;
}

.assessment-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.assessment-menu .el-menu-item.is-active .el-icon {
  color: white;
}

.assessment-menu .el-menu-item-group__title {
  padding: 12px 12px 8px 12px;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.main-content {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 600px;
  overflow: hidden;
}
</style> 