<template>
  <el-card shadow="hover" class="quick-link-card" @click="handleClick">
    <div class="content">
      <el-icon :size="28" :color="iconColor"><component :is="icon" /></el-icon>
      <span class="label">{{ label }}</span>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const props = defineProps({
  icon: {
    type: Object,
    required: true,
  },
  iconColor: {
    type: String,
    default: '#409eff',
  },
  label: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
});

const router = useRouter();

const handleClick = () => {
  router.push(props.to);
};
</script>

<style scoped>
.quick-link-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-link-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--el-box-shadow-light);
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.label {
  font-size: 14px;
  color: #606266;
}
</style> 