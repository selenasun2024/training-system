<template>
  <el-menu
    class="type-sidebar"
    :default-active="active"
    @select="handleSelect"
    :collapse="false"
  >
    <el-menu-item
      v-for="t in types"
      :key="t.key"
      :index="t.key"
    >{{ t.label }}</el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
const props = defineProps<{ types: { key: string; label: string }[]; modelValue: string }>()
const emits = defineEmits(['update:modelValue'])

const active = props.modelValue
function handleSelect(key: string) {
  emits('update:modelValue', key)
}
</script>

<style scoped>
.type-sidebar {
  border-right: 1px solid #ebeef5;
  width: 180px;
  background: #fafafa;
  padding: 8px 0;
  min-height: calc(100vh - 120px); /* 适当高度，减去顶部tabs等 */
  box-sizing: border-box;
}
</style> 