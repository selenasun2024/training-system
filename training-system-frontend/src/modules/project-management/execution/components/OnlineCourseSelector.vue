<template>
  <el-dialog :model-value="visible" title="添加在线课程" width="800px" @close="$emit('update:visible', false)">
    <!-- 查询条件 -->
    <el-form :inline="true" :model="query" class="mb-2">
      <el-form-item label="课程分类">
        <el-select v-model="query.category" placeholder="请选择" style="width:160px">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="课程名称">
        <el-input v-model="query.keyword" placeholder="输入名称" style="width:180px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="filter">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" plain @click="toggleMode">切换为课件</el-button>
      </el-form-item>
    </el-form>

    <!-- 课程列表 -->
    <el-table :data="filtered" height="400" @selection-change="handleSelect" style="width:100%">
      <el-table-column type="selection" width="50" />
      <el-table-column prop="name" label="课程名称" min-width="200" />
      <el-table-column prop="credit" label="分值" width="60" />
      <el-table-column prop="duration" label="时长" width="80" />
      <el-table-column prop="shareDate" label="分享日期" width="120" />
      <el-table-column prop="author" label="分享人" width="80" />
      <el-table-column prop="lecturer" label="讲师" width="80" />
    </el-table>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="confirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['update:visible', 'add']);

interface Course {
  id: string;
  name: string;
  credit: number;
  duration: string;
  shareDate: string;
  author: string;
  lecturer: string;
  category: string;
}

const courses = ref<Course[]>([
  { id:'c1', name:'员工入模子课程', credit:4.5, duration:'23分钟', shareDate:'2019-12-03', author:'演寂书院', lecturer:'演寂书院', category:'通用' },
  { id:'c2', name:'标疏: 财务培训分享', credit:5.81, duration:'58分钟', shareDate:'2022-10-31', author:'演寂书院', lecturer:'杨波', category:'财务' },
  // ... mock more
]);

const categories = ['全部','通用','财务'];

const query = reactive({ category:'全部', keyword:'' });

const filtered = computed(() => {
  return courses.value.filter(c=>
    (query.category==='全部'||c.category===query.category)&&
    c.name.includes(query.keyword)
  );
});

function filter() {}
function reset(){ query.category='全部'; query.keyword=''; }

const selected = ref<Course[]>([]);
function handleSelect(rows:any){ selected.value = rows; }

function confirm(){
  emit('add', selected.value);
  emit('update:visible', false);
}

function toggleMode(){ /* placeholder */ }
</script> 