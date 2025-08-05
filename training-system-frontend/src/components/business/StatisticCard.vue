<template>
  <div class="statistic-card">
    <el-card shadow="hover">
      <div class="content">
        <div class="icon-wrapper" :style="{ backgroundColor: iconBgColor }">
          <el-icon :size="24" color="#fff"><component :is="icon" /></el-icon>
        </div>
        <div class="info">
          <div class="label">{{ label }}</div>
          <div class="value">
            <count-to :end-val="value" :duration="2000" />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { CountTo } from 'vue3-count-to';

defineProps({
  icon: {
    type: Object,
    required: true,
  },
  iconBgColor: {
    type: String,
    default: '#409eff',
  },
  label: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
});
</script>

<style scoped>
.statistic-card .content {
  display: flex;
  align-items: center;
}

.icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.info {
  display: flex;
  flex-direction: column;
}

.label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 4px;
}

.value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
</style> 