<template>
  <div class="system-config-page">
    <el-card shadow="never">
      <template #header>
        <h2>系统配置</h2>
      </template>

      <!-- 顶部域 Tabs -->
      <el-tabs v-model="activeTab" class="config-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="学员与小组" name="role-group" />
        <el-tab-pane label="项目" name="agenda-resource" />
        <el-tab-pane label="数据看板配置" name="dashboard-config" />
      </el-tabs>

      <div class="body">
        <!-- 左侧菜单 -->
        <el-menu :default-active="activeMenu" class="sidebar" @select="handleMenuSelect" :key="activeTab">
          <el-menu-item v-for="item in menuList" :key="item.key" :index="item.key">
            {{ item.label }}
          </el-menu-item>
        </el-menu>

        <!-- 右侧内容 -->
        <div class="content">
          <component :is="currentComponent" v-bind="currentComponentProps" :key="activeMenu" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDictStore } from '@/stores/dict'

import GroupRuleConfig from '../components/GroupRuleConfig.vue'
import AgendaResourceTemplateConfig from '../components/AgendaResourceTemplateConfig.vue'
import MessageTemplateConfig from '../components/MessageTemplateConfig.vue'
import ObjectRuleConfig from '../components/ObjectRuleConfig.vue'
import ProjectTypeConfig from '../components/ProjectTypeConfig.vue'
import { useSystemConfigStore } from '@/stores/systemConfig'
import ResourceBudgetConfig from '../components/ResourceBudgetConfig.vue'
// import TypeManagement from '../components/TypeManagement.vue'
import AgendaResourceConfig from '../components/AgendaResourceConfig.vue'
import ApprovalSetting from '../components/ApprovalSetting.vue'
import GrowthPathConfig from '../components/GrowthPathConfig.vue'
import KpiMetricsConfig from '../components/KpiMetricsConfig.vue'
import DashboardDisplayConfig from '../components/DashboardDisplayConfig.vue'
import type { ResourceBudget } from '@/types'

const activeTab = ref<'role-group' | 'agenda-resource' | 'dashboard-config'>('role-group')
const activeMenu = ref('objectRule')

interface MenuItem { key: string; label: string; component: any; props?: any }

const systemConfigStore = useSystemConfigStore()

// 使用系统配置Store中的项目类型
const projectTypes = computed(() => systemConfigStore.projectTypes)

const agendaTypes = ref([
  { id: 'a1', name: '面授' },
  { id: 'a2', name: '作业' },
  { id: 'a3', name: '讨论' },
  { id: 'a4', name: '线上课程' },
  { id: 'a5', name: '考试' },
])

const resourceBudgets = ref<ResourceBudget[]>([
  { id: '1', resource: '教室', items: [ { name: '租金', amount: 3000 } ] },
  { id: '2', resource: '教材', items: [ { name: '印刷费', amount: 50 } ] },
])

const dictStore = useDictStore()

function updateAgendaTypes(types) {
  agendaTypes.value = types
}

function updateResourceBudgets(b){ resourceBudgets.value = b }

const agendaResourceMap = ref<Record<string, any[]>>({})
function updateAgendaResourceMap(m){ agendaResourceMap.value = m }

const allMenus: Record<string, MenuItem[]> = {
  'role-group': [
    { key: 'objectRule', label: '对象', component: ObjectRuleConfig, props: { projectTypes } },
    { key: 'groupRule', label: '分组', component: GroupRuleConfig },
  ],
  'agenda-resource': [
    { key: 'projectType', label: '类型', component: ProjectTypeConfig },
    { key: 'agendaTemplate', label: '议程资源配置', component: AgendaResourceConfig, props: { agendaTypes, resourceBudgets, resourceMap: agendaResourceMap, onUpdate: updateAgendaResourceMap } },
    { key: 'resourceBudget', label: '资源预算配置', component: ResourceBudgetConfig, props: { budgets: resourceBudgets, onUpdate: updateResourceBudgets } },
    { key: 'approvalSetting', label: '审批设置', component: ApprovalSetting },
  ],
  'dashboard-config': [
    { key: 'growthPath', label: '成长路径配置', component: GrowthPathConfig },
    { key: 'kpiMetrics', label: 'KPI指标配置', component: KpiMetricsConfig },
    { key: 'dashboardDisplay', label: '看板展示配置', component: DashboardDisplayConfig },
  ],
}

const menuList = computed(() => allMenus[activeTab.value])

watch(activeTab, () => {
  // tab 切换时重置菜单为首项
  activeMenu.value = menuList.value[0]?.key || ''
})

const currentComponent = computed(() => {
  const item = menuList.value.find((m) => m.key === activeMenu.value)
  return item?.component || null
})

const currentComponentProps = computed(() => {
  const item = menuList.value.find((m) => m.key === activeMenu.value)
  return item?.props || {}
})

function handleTabChange() {
  /* no-op, watch 已处理 */
}

function handleMenuSelect(key: string) {
  activeMenu.value = key
}

// 页面初始化时加载项目类型数据
onMounted(async () => {
  await systemConfigStore.loadProjectTypes()
})
</script>

<style scoped>
.system-config-page {
  padding: 20px;
}
.config-tabs {
  margin-bottom: 12px;
}
.body {
  display: flex;
  min-height: 60vh;
}
.sidebar {
  width: 200px;
  border-right: 1px solid #ebeef5;
}
.content {
  flex: 1;
  padding: 16px 24px;
}
</style> 