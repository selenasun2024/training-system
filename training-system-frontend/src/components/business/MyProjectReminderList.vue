<template>
  <div class="reminder-list">
    <el-skeleton :loading="loading" animated :rows="4" v-if="loading" />

    <el-card v-else shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="`即将开始 (${upcoming.length})`" name="upcoming">
          <el-empty v-if="!upcoming.length" description="暂无即将开始的项目" />
          <el-table v-else :data="upcoming" size="small" border>
            <el-table-column prop="typeName" label="项目类型" width="160" sortable />
            <el-table-column prop="name" label="项目名称" />
            <el-table-column label="开始日期" width="120">
              <template #default="{ row }">{{ format(row.startDate) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link @click="goDetail(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="`进行中 (${ongoing.length})`" name="ongoing">
          <el-empty v-if="!ongoing.length" description="暂无进行中的项目" />
          <el-table v-else :data="ongoing" size="small" border>
            <el-table-column prop="typeName" label="项目类型" width="160" sortable />
            <el-table-column prop="name" label="项目名称" />
            <el-table-column label="日期" width="180">
              <template #default="{ row }">{{ format(row.startDate) }} ~ {{ format(row.endDate) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link @click="goDetail(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDictStore } from '@/stores/dict'
import { useRouter } from 'vue-router'
import axios from 'axios'
import dayjs from 'dayjs'

interface Project {
  id: string
  name: string
  typeCode: string
  typeName: string
  startDate: string
  endDate: string
}

const dictStore = useDictStore()
const router = useRouter()

const loading = ref(true)
const projects = ref<Project[]>([])
const activeTab = ref<'upcoming' | 'ongoing'>('upcoming')

function format(d: string) {
  return dayjs(d).format('YYYY-MM-DD')
}

function isUpcoming(p: Project, remindDays: number) {
  const today = dayjs()
  const start = dayjs(p.startDate)
  return today.isAfter(start.subtract(remindDays, 'day')) && today.isBefore(start)
}

function isOngoing(p: Project) {
  const today = dayjs()
  return today.isAfter(dayjs(p.startDate).subtract(1, 'day')) && today.isBefore(dayjs(p.endDate).add(1, 'day'))
}

const upcoming = computed(() => group('upcoming'))
const ongoing = computed(() => group('ongoing'))

function group(kind: 'upcoming' | 'ongoing') {
  const typeMap = Object.fromEntries(dictStore.projectTypes.map(t => [t.code, t]))
  return projects.value.filter(p => {
    const t = typeMap[p.typeCode]
    if (!t) return false
    const remind = t.remindDays ?? 7
    return kind === 'upcoming' ? isUpcoming(p, remind) : isOngoing(p)
  }).sort((a,b)=> a.typeName.localeCompare(b.typeName))
}

function goDetail(id: string) {
  router.push({ name: 'ProjectDetail', params: { id } })
}

async function fetchProjects() {
  await new Promise(r => setTimeout(r, 300))
  const today = dayjs()
  const t1 = dictStore.projectTypes[0] || { code: 'NEW_HIRE', name: '新员工入职培训' }
  const t2 = dictStore.projectTypes[1] || { code: 'LEADERSHIP', name: '领导力培训' }

  projects.value = [
    // 即将开始：开始日期 5 天后
    { id: 'up1', name: `${t1.name} A`, typeCode: t1.code, typeName: t1.name, startDate: today.add(5, 'day').format('YYYY-MM-DD'), endDate: today.add(25, 'day').format('YYYY-MM-DD') },
    { id: 'up2', name: `${t2.name} B`, typeCode: t2.code, typeName: t2.name, startDate: today.add(4, 'day').format('YYYY-MM-DD'), endDate: today.add(30, 'day').format('YYYY-MM-DD') },
    // 进行中：开始 3 天前，结束 10 天后
    { id: 'on1', name: `${t1.name} C`, typeCode: t1.code, typeName: t1.name, startDate: today.subtract(3, 'day').format('YYYY-MM-DD'), endDate: today.add(10, 'day').format('YYYY-MM-DD') },
    { id: 'on2', name: `${t2.name} D`, typeCode: t2.code, typeName: t2.name, startDate: today.subtract(2, 'day').format('YYYY-MM-DD'), endDate: today.add(15, 'day').format('YYYY-MM-DD') },
  ]
}

onMounted(async () => {
  await dictStore.loadProjectTypes()
  await fetchProjects()
  loading.value = false
})
</script>

<style scoped>
.mb-3 {
  margin-bottom: 16px;
}
</style> 