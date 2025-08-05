<template>
  <div class="score-management-page">
    <!-- 无上级 projectId 时显示项目选择器 -->
    <el-select 
      v-if="!projectId" 
      v-model="localProjectId" 
      placeholder="请选择项目" 
      size="small" 
      style="width:220px;margin-bottom:12px"
      v-loading="projectsLoading"
    >
      <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
    </el-select>

    <el-card shadow="never" class="header-card">
      <template #header>
        <span>成绩管理</span>
        <el-space class="header-actions">
          <el-tag>{{ modeLabel }}</el-tag>
          <el-button size="small" @click="openDrawer" :disabled="store.published">编辑配置</el-button>
          <el-button type="primary" size="small" @click="publish" :disabled="store.published">发布成绩</el-button>
          <el-tag v-if="store.published" type="success">已发布</el-tag>
        </el-space>
        <el-popover placement="bottom-start" trigger="click" :width="320">
          <template #reference>
            <el-icon style="cursor:pointer;margin-left:4px;color:#909399"><question-filled/></el-icon>
          </template>
          <p><strong>使用指南</strong></p>
          <ol style="padding-left:16px;margin:4px 0">
            <li>点击「编辑配置」选择 <em>个人 / 团队 / 综合</em> 模式。</li>
            <li>在表格中调整各权重，使总和=100%。</li>
            <li>保存配置后，列表会实时刷新。</li>
            <li>确认无误后，点击「发布成绩」将结果锁定并推送通知。</li>
          </ol>
        </el-popover>
      </template>

      <!-- 加载状态 -->
      <el-empty v-if="!dataReady" description="正在加载数据..." />

      <!-- 个人成绩 -->
      <template v-else-if="policy.mode==='individual'">
        <!-- 成绩列表 -->
        <el-table :data="store.totalScores" border style="width: 100%" v-loading="store.loading">
          <el-table-column prop="rank" label="排名" width="60" />
          <el-table-column prop="name" label="姓名" />
          <el-table-column 
            v-if="policy.individualSettings.categories.exam.enabled"
            prop="exam" 
            label="考试分" 
            width="100" 
          />
          <el-table-column 
            v-if="policy.individualSettings.categories.homework.enabled"
            prop="homework" 
            label="作业分" 
            width="100" 
          />
          <el-table-column 
            v-if="policy.individualSettings.categories.attendance.enabled"
            prop="attendance" 
            label="考勤分" 
            width="100" 
          />
          <template v-if="policy.individualSettings.categories.custom.enabled">
            <el-table-column
              v-for="type in policy.individualSettings.categories.custom.types"
              :key="type.id"
              :prop="type.id"
              :label="type.label"
              width="100"
              v-if="type.enabled"
            />
          </template>
          <el-table-column prop="total" label="总分" width="100" />
        </el-table>
      </template>

      <!-- 团队成绩 -->
      <template v-else-if="policy.mode==='group'">
        <el-space style="margin-bottom:8px">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="matrix">成绩汇总</el-radio-button>
            <el-radio-button label="summary">小组排名</el-radio-button>
          </el-radio-group>
        </el-space>

        <!-- 汇总视图 -->
        <el-table v-if="viewMode==='summary'" :data="store.groupRanking" border style="width: 100%" v-loading="store.loading">
          <!-- 展开行：协同作业明细 -->
          <el-table-column type="expand">
            <template #default="{ row }">
              <el-table :data="(store as any).groupTaskDetails[row.groupId] || []" border size="small" style="width:100%">
                <el-table-column prop="taskName" label="协同作业任务" />
                <el-table-column prop="score" label="得分" width="80" />
              </el-table>
            </template>
          </el-table-column>
          <el-table-column prop="rank" label="排名" width="60" />
          <el-table-column prop="groupName" label="小组" />
          <el-table-column prop="teamScore" label="总分" width="120" />
        </el-table>

        <!-- 矩阵视图 -->
        <el-table v-else :data="matrixData" border style="width: 100%" v-loading="store.loading" :row-class-name="settingsRowClass" :key="allTasksKey">
          <el-table-column prop="groupName" label="小组" fixed width="120" />
          <el-table-column
            v-for="task in allTasks"
            :key="task.id"
            :prop="task.id"
            :label="task.name"
            width="120"
          />
          <el-table-column prop="totalScore" label="小组总分" width="120" fixed="right" />
        </el-table>
      </template>

      <!-- 综合成绩 -->
      <template v-else-if="policy.mode==='combined'">
        <el-table :data="store.totalScores" border style="width: 100%" v-loading="store.loading">
          <el-table-column prop="rank" label="排名" width="60" />
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="total" label="综合总分" width="120" />
        </el-table>
      </template>

    </el-card>

    <!-- 编辑 Drawer -->
    <el-drawer v-model="drawerVisible" title="成绩配置" size="50%">
      <el-space direction="vertical" style="width:100%">
        <!-- 模式选择 -->
        <el-radio-group v-model="policy.mode">
          <el-radio-button label="individual">个人成绩</el-radio-button>
          <el-radio-button label="group">团队成绩</el-radio-button>
          <el-radio-button label="combined">综合成绩</el-radio-button>
        </el-radio-group>

        <!-- 权重编辑表格，同原逻辑复用 -->
        <div v-show="policy.mode==='individual'">
          <!-- 个人成绩配置区域 -->
          <el-checkbox-group v-model="enabledIndividualCats" style="margin-bottom:12px">
            <el-checkbox :label="'exam'">考试</el-checkbox>
            <el-checkbox :label="'homework'">作业</el-checkbox>
            <el-checkbox :label="'attendance'">考勤</el-checkbox>
            <el-checkbox :label="'custom'">自定义</el-checkbox>
          </el-checkbox-group>

          <!-- 考试设置 -->
          <el-card shadow="never" v-show="enabledIndividualCats.includes('exam')" style="margin-bottom:12px">
            <template #header>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>考试</span>
                <el-input-number 
                  v-model="policy.individualSettings.categories.exam.score" 
                  :min="0" 
                  :max="100"
                  placeholder="满分"
                  style="width:120px"
                />
              </div>
            </template>
          </el-card>

          <!-- 作业设置 -->
          <el-card shadow="never" v-show="enabledIndividualCats.includes('homework')" style="margin-bottom:12px">
            <template #header>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>作业</span>
                <el-input-number 
                  v-model="policy.individualSettings.categories.homework.score" 
                  :min="0" 
                  :max="100"
                  placeholder="满分"
                  style="width:120px"
                />
              </div>
            </template>
          </el-card>

          <!-- 考勤设置 -->
          <el-card shadow="never" v-show="enabledIndividualCats.includes('attendance')" style="margin-bottom:12px">
            <template #header>
              <span>考勤扣分规则</span>
            </template>
            <el-form label-width="120px">
              <el-form-item label="迟到/早退扣分">
                <el-input-number v-model="policy.individualSettings.categories.attendance.rules.late" :min="0" />
              </el-form-item>
              <el-form-item label="请假扣分">
                <el-input-number v-model="policy.individualSettings.categories.attendance.rules.vacation" :min="0" />
              </el-form-item>
              <el-form-item label="缺勤扣分">
                <el-input-number v-model="policy.individualSettings.categories.attendance.rules.absent" :min="0" />
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 自定义评分项 -->
          <el-card shadow="never" v-show="enabledIndividualCats.includes('custom')" style="margin-bottom:12px">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>自定义评分项</span>
                <el-button type="primary" link @click="addIndividualCustomType">
                  <el-icon><plus /></el-icon> 添加类型
                </el-button>
              </div>
            </template>
            <el-table :data="policy.individualSettings.categories.custom.types" border size="small">
              <el-table-column label="类型名称" min-width="120">
                <template #default="{ row }">
                  <el-input v-model="row.label" placeholder="请输入类型名称" />
                </template>
              </el-table-column>
              <el-table-column label="满分" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.score" :min="0" :max="100" />
                </template>
              </el-table-column>
              <el-table-column label="启用" width="80">
                <template #default="{ row }">
                  <el-switch v-model="row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button type="danger" link @click="removeIndividualCustomType($index)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
        <div v-show="policy.mode==='group'">
          <!-- inside group section before first card -->
          <el-checkbox-group v-model="enabledCats" style="margin-bottom:12px">
            <el-checkbox :label="'cooperation'">协同作业</el-checkbox>
            <el-checkbox :label="'discussion'">讨论</el-checkbox>
            <el-checkbox :label="'attendance'">考勤</el-checkbox>
            <el-checkbox :label="'custom'">自定义</el-checkbox>
          </el-checkbox-group>

          <!-- 协同作业设置 -->
          <el-card shadow="never" v-show="enabledCats.includes('cooperation')">
            <template #header>
              <span>协同作业</span>
              <el-select v-model="coopToAdd" placeholder="添加协同作业" style="width:240px;margin-left:12px">
                <el-option
                  v-for="task in allCoop.filter(t=>groupSettings.categories.cooperation.excludedIds.includes(t.id))"
                  :key="task.id" :label="task.name" :value="task.id" />
              </el-select>
            </template>
            <el-table :data="includedCoop" size="small" border>
              <el-table-column type="index" width="50" />
              <el-table-column prop="name" label="作业名称" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-link type="danger" @click="removeCoop(row.id)">删除</el-link>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 讨论设置 -->
          <el-card shadow="never" style="margin-top:12px" v-show="enabledCats.includes('discussion')">
            <template #header>
              <span>讨论</span>
              <el-select v-model="discToAdd" placeholder="添加讨论" style="width:240px;margin-left:12px">
                <el-option
                  v-for="task in allDisc.filter(t=>groupSettings.categories.discussion.excludedIds.includes(t.id))"
                  :key="task.id" :label="task.name" :value="task.id" />
              </el-select>
            </template>
            <el-table :data="includedDisc" size="small" border>
              <el-table-column type="index" width="50" />
              <el-table-column prop="name" label="讨论名称" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-link type="danger" @click="removeDisc(row.id)">删除</el-link>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 考勤扣分规则 -->
          <el-card shadow="never" style="margin-top:12px" v-show="enabledCats.includes('attendance')">
            <template #header><span>考勤扣分规则</span></template>
            <el-form label-width="120px">
              <el-form-item label="迟到/早退扣分">
                <el-input-number v-model="groupSettings.categories.attendance.rules.late" :min="0" />
              </el-form-item>
              <el-form-item label="请假扣分">
                <el-input-number v-model="groupSettings.categories.attendance.rules.vacation" :min="0" />
              </el-form-item>
              <el-form-item label="缺勤扣分">
                <el-input-number v-model="groupSettings.categories.attendance.rules.absent" :min="0" />
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 自定义评分类型 -->
          <el-card shadow="never" style="margin-top:12px" v-show="enabledCats.includes('custom')">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>自定义评分类型</span>
                <el-button type="primary" link @click="addCustomType">
                  <el-icon><plus /></el-icon> 添加类型
                </el-button>
              </div>
            </template>
            <el-table :data="groupSettings.categories.custom.types" border size="small">
              <el-table-column label="类型名称" min-width="120">
                <template #default="{ row }">
                  <el-input v-model="row.label" placeholder="请输入类型名称" />
                </template>
              </el-table-column>
              <el-table-column label="满分" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.score" :min="0" :max="100" />
                </template>
              </el-table-column>
              <el-table-column label="启用" width="80">
                <template #default="{ row }">
                  <el-switch v-model="row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button type="danger" link @click="removeCustomType($index)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
        <div v-show="policy.mode==='combined'">
          <el-table :data="combinedProportionRows" border size="small" style="width:260px">
            <el-table-column prop="label" label="部分" />
            <el-table-column label="占比(%)">
              <template #default="{row}">
                <el-input-number v-model="row.weight" :min="0" :max="100" />
              </template>
            </el-table-column>
          </el-table>
          <el-text type="warning" v-if="weightSum(combinedProportionRows)!==100">个人+团队占比需为100%</el-text>
        </div>

        <el-button type="primary" :disabled="!weightsValid" @click="savePolicy">保存配置</el-button>
      </el-space>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useScoreStore } from '../stores/score';
import { QuestionFilled, Plus } from '@element-plus/icons-vue';
import { useTrainingStageStore } from '../stores/trainingStage';
import { ElMessage } from 'element-plus';
import { nanoid } from 'nanoid';
import { useRoute } from 'vue-router';

const store = useScoreStore();
const stageStore = useTrainingStageStore();
const dataReady = ref(false);

// 使用 reactive 包装 policy 对象
const policy = reactive(store.policy);

// 初始化
onMounted(async () => {
  store.loading = true;
  try {
    // 首先加载项目列表
    await loadProjects();
    
    if (store.rawScores.length === 0 && effectiveProjectId.value) {
      await store.fetchScores(effectiveProjectId.value);
    }
    await store.refreshFromCooperation();
    dataReady.value = true;
  } catch (error) {
    console.error('初始化成绩数据失败:', error);
    ElMessage.error('加载成绩数据失败，请刷新页面重试');
  } finally {
    store.loading = false;
  }
});

const groupSettings = policy.groupSettings;

const drawerVisible = ref(false);
const openDrawer = ()=>{ drawerVisible.value=true };

const modeLabel = computed(()=>{
  switch(policy.mode){
    case 'individual':return '个人成绩';
    case 'group':return '团队成绩';
    case 'combined':return '综合成绩';
    default:return '';
  }
});

// row helpers for tables
const individualRows = reactive([
  { key: 'exam', label: '考试', weight: policy.individualWeights.exam },
  { key: 'homework', label: '作业', weight: policy.individualWeights.homework },
  { key: 'attendance', label: '考勤', weight: policy.individualWeights.attendance },
]);

const groupRows = reactive([
  { key: 'co_work', label: '协同作业', weight: policy.groupWeights.co_work },
]);

const combinedProportionRows = reactive([
  { key: 'individual', label: '个人部分', weight: policy.combinedWeights.individual },
  { key: 'group', label: '团队部分', weight: policy.combinedWeights.group },
]);

function weightSum(rows:any[]) {
  return rows.reduce((sum,r)=>sum+Number(r.weight||0),0);
}

const weightsValid = computed(() => {
  if (policy.mode === 'individual') {
    // 检查所有启用的评分项是否都设置了分值
    const cats = policy.individualSettings.categories;
    let hasScore = true;
    
    if (cats.exam.enabled && !cats.exam.score) hasScore = false;
    if (cats.homework.enabled && !cats.homework.score) hasScore = false;
    if (cats.attendance.enabled && !cats.attendance.score) hasScore = false;
    
    if (cats.custom.enabled) {
      cats.custom.types.forEach(type => {
        if (type.enabled && !type.score) hasScore = false;
      });
    }
    
    return hasScore;
  }
  if (policy.mode === 'group') return true;
  return weightSum(combinedProportionRows) === 100;
});

// 保存配置
const savePolicy = async () => {
  try {
    store.loading = true;
    
    // 更新启用状态
    const cats = policy.individualSettings.categories;
    cats.exam.enabled = enabledIndividualCats.value.includes('exam');
    cats.homework.enabled = enabledIndividualCats.value.includes('homework');
    cats.attendance.enabled = enabledIndividualCats.value.includes('attendance');
    cats.custom.enabled = enabledIndividualCats.value.includes('custom');
    
    // 保存配置
    store.setPolicy(policy);
    // 如果是综合模式，更新比例
    if (policy.mode === 'combined') {
      combinedProportionRows.forEach((row:any) => {
        if(row.key==='individual') policy.combinedWeights.individual = Number(row.weight);
        else if(row.key==='group') policy.combinedWeights.group = Number(row.weight);
      });
    }
    await store.refreshFromCooperation();
    ElMessage.success('配置已更新');
    drawerVisible.value = false;
  } catch (error) {
    console.error('保存配置失败:', error);
    ElMessage.error('保存配置失败，请重试');
  } finally {
    store.loading = false;
  }
};

const publish = async () => {
  await store.publish();
};

// NEW_START
// ----- 团队视图（矩阵） -----
import { computed, Ref } from 'vue';
const viewMode = ref<'summary' | 'matrix'>('matrix');

// 所有协同任务列头
const allTasks = computed(() => {
  const map = new Map<string, string>();
  const cats = groupSettings.categories;
  
  // 🔧 修复：协同作业（查找标记为isCooperation的homework任务）
  if(cats.cooperation.enabled){
    stageStore.stages.forEach((stage:any)=>{
      stage.tasks.filter((t:any)=>t.type==='homework' && t.config?.isCooperation)
        .forEach((t:any)=>map.set(t.id, t.name));
    });
  }
  
  // 讨论
  if(cats.discussion.enabled){
    stageStore.stages.forEach((stage:any)=>{
      stage.tasks.filter((t:any)=>t.type==='discussion')
        .forEach((t:any)=>map.set(t.id, t.name));
    });
  }
  
  // 考勤扣分列
  if(cats.attendance.enabled){
    map.set('__attendance__','考勤扣分');
  }

  // 自定义评分类型
  if (cats.custom.enabled) {
    cats.custom.types.forEach((type: any) => {
      if (type.enabled) {
        map.set(`__custom_${type.id}__`, type.label);
      }
    });
  }

  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
});

// 每个协同任务配置的满分
const taskMaxScoreMap = computed(() => {
  const map = new Map<string, number>();
  const cats = groupSettings.categories;
  
  stageStore.stages.forEach((stage: any) => {
    stage.tasks
      .filter((t: any) => (t.type==='cooperation' && cats.cooperation.enabled) || (t.type==='discussion' && cats.discussion.enabled))
      .forEach((t: any) => {
        const max = Number(t.config?.totalScore ?? 0);
        map.set(t.id, max);
      });
  });
  
  if(cats.attendance.enabled){
    map.set('__attendance__', 0);
  }

  // 自定义评分类型的满分
  if (cats.custom.enabled) {
    cats.custom.types.forEach((type: any) => {
      if (type.enabled) {
        map.set(`__custom_${type.id}__`, type.score);
      }
    });
  }

  return map;
});

const overallMaxScore = computed(() => {
  let sum = 0;
  taskMaxScoreMap.value.forEach((v) => (sum += v));
  return sum;
});

// 小组 × 任务矩阵行
const matrixRows = computed(() => {
  return store.groupRanking.map((gr: any) => {
    const row: any = { groupId: gr.groupId, groupName: gr.groupName };
    allTasks.value.forEach((t) => {
      if(t.id==='__attendance__'){
        row[t.id] = 0; // placeholder, real attendance calc TBD
      } else {
        const detail = (store.groupTaskDetails[gr.groupId] || []).find((d: any) => d.taskId === t.id);
        row[t.id] = detail?.score ?? '-';
      }
    });
    // 计算小组总分（已评分任务求和）
    row.totalScore = allTasks.value.reduce((sum, t) => {
      const v = row[t.id];
      return sum + (typeof v === 'number' ? v : 0);
    }, 0);
    return row;
  });
});

// 构造"分值设置"行并拼接
const matrixData = computed(() => {
  const settingRow: any = { groupName: '分值设置' };
  allTasks.value.forEach((t) => {
    settingRow[t.id] = taskMaxScoreMap.value.get(t.id) ?? '';
  });
  settingRow.totalScore = overallMaxScore.value;
  return [settingRow, ...matrixRows.value];
});

function settingsRowClass({ rowIndex }: any) {
  return rowIndex === 0 ? 'settings-row' : '';
}
// NEW_END

// Add computed lists for group settings
// ---- 团队配置编辑 ----
const allCoop = computed(()=>{
  const arr:any[]=[];
  stageStore.stages.forEach((s:any)=>{
    // 🔧 修复：查找标记为isCooperation的homework任务，而不是type为cooperation的任务
    s.tasks.filter((t:any)=>t.type==='homework' && t.config?.isCooperation).forEach((t:any)=>arr.push(t));
  });
  return arr;
});

const allDisc = computed(()=>{
  const arr:any[]=[];
  stageStore.stages.forEach((s:any)=>{
    s.tasks.filter((t:any)=>t.type==='discussion').forEach((t:any)=>arr.push(t));
  });
  return arr;
});

const includedCoop = computed(()=> allCoop.value.filter(t=>!groupSettings.categories.cooperation.excludedIds.includes(t.id)) );
const includedDisc = computed(()=> allDisc.value.filter(t=>!groupSettings.categories.discussion.excludedIds.includes(t.id)) );

function removeCoop(id:string){
  if(!groupSettings.categories.cooperation.excludedIds.includes(id)) groupSettings.categories.cooperation.excludedIds.push(id);
}
function addCoop(id:string){
  groupSettings.categories.cooperation.excludedIds = groupSettings.categories.cooperation.excludedIds.filter(x=>x!==id);
}
function removeDisc(id:string){
  if(!groupSettings.categories.discussion.excludedIds.includes(id)) groupSettings.categories.discussion.excludedIds.push(id);
}
function addDisc(id:string){
  groupSettings.categories.discussion.excludedIds = groupSettings.categories.discussion.excludedIds.filter(x=>x!==id);
}

const coopToAdd = ref('');
const discToAdd = ref('');
watch(coopToAdd, (id) => {
  if(!id) return;
  addCoop(id);
  coopToAdd.value='';
});
watch(discToAdd, (id) => {
  if(!id) return;
  addDisc(id);
  discToAdd.value='';
});

const enabledCats = ref<string[]>(Object.entries(groupSettings.categories).filter(([k,v])=>v.enabled).map(([k])=>k));

watch(enabledCats,(arr)=>{
  ['cooperation','discussion','attendance'].forEach(key=>{
    if(groupSettings.categories[key]) groupSettings.categories[key].enabled = arr.includes(key);
  });
});

// in script after allTasks computed declaration
const allTasksKey = computed(()=> allTasks.value.map(t=>t.id).join('|'));

// 添加自定义评分类型
function addCustomType() {
  if (!groupSettings.categories.custom.types) {
    groupSettings.categories.custom.types = [];
  }
  groupSettings.categories.custom.types.push({
    id: nanoid(),
    label: '',
    enabled: true,
    score: 100
  });
}

// 删除自定义评分类型
function removeCustomType(index: number) {
  groupSettings.categories.custom.types.splice(index, 1);
}

// 个人成绩配置相关
const enabledIndividualCats = ref<string[]>(
  Object.entries(policy.individualSettings.categories)
    .filter(([k,v])=>v.enabled)
    .map(([k])=>k)
);

watch(enabledIndividualCats,(arr)=>{
  ['exam','homework','attendance','custom'].forEach(key=>{
    if(policy.individualSettings.categories[key]) {
      policy.individualSettings.categories[key].enabled = arr.includes(key);
    }
  });
});

// 添加个人自定义评分类型
function addIndividualCustomType() {
  if (!policy.individualSettings.categories.custom.types) {
    policy.individualSettings.categories.custom.types = [];
  }
  policy.individualSettings.categories.custom.types.push({
    id: nanoid(),
    label: '',
    enabled: true,
    score: 100
  });
}

// 删除个人自定义评分类型
function removeIndividualCustomType(index: number) {
  policy.individualSettings.categories.custom.types.splice(index, 1);
}

interface Props { projectId?: string }
const props = defineProps<Props>()

// 项目数据状态
const projects = ref<Array<{ id: string; name: string }>>([])
const projectsLoading = ref(false)

const localProjectId = ref(props.projectId ?? '')
const effectiveProjectId = computed(()=> props.projectId || localProjectId.value)

// 加载项目列表
const loadProjects = async () => {
  if (props.projectId) return // 如果已有项目ID，不需要加载项目列表
  
  projectsLoading.value = true
  try {
    console.log('🔍 ScoreManagement: 加载项目列表...')
    const { getProjects } = await import('@/api/modules/project')
    const response = await getProjects({ limit: 100 })
    projects.value = response.projects.map(p => ({
      id: p.id,
      name: p.name
    }))
    
    console.log(`✅ ScoreManagement: 获取到 ${projects.value.length} 个项目`)
    
    // 如果没有默认项目，选择第一个
    if (!localProjectId.value && projects.value.length > 0) {
      localProjectId.value = projects.value[0].id
      console.log('🔍 ScoreManagement: 默认选择项目:', projects.value[0].name)
    }
  } catch (error) {
    console.error('❌ ScoreManagement: 加载项目列表失败:', error)
    ElMessage.warning('加载项目列表失败，使用默认项目列表')
    // 使用真实存在的项目作为fallback
    projects.value = [
      { id: '4bcf4bb2-2b78-4408-9687-e515cbff5da8', name: '新员工入职培训' },
      { id: '7d38a303-81ad-4246-80f1-c36310920363', name: '111' },
      { id: '2ac800f1-0fab-42af-92c9-0c1f8ca28aa7', name: '222' },
    ]
    if (!localProjectId.value && projects.value.length > 0) {
      localProjectId.value = projects.value[0].id
      console.log('🔍 ScoreManagement: 使用fallback项目:', projects.value[0].name)
    }
  } finally {
    projectsLoading.value = false
  }
}

// ========== 数据加载 ==========
watch(effectiveProjectId, (pid)=>{
  if(pid){
    store.fetchScores(pid);
  }
}, { immediate: true });

// ============ 培训后阶段菜单 ============
const activeAfterMenu = ref('summary');
</script>

<style scoped>
.score-management-page {
  padding: 12px;
}
.header-actions {
  float: right;
}
.header-card :deep(.el-card__header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
/* 样式 */
.settings-row {
  background-color: #f5f7fa;
  font-weight: 600;
}
</style> 