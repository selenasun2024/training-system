<template>
  <div class="approval-setting">
    <el-card shadow="never">
      <template #header><span>审批设置</span></template>
      <el-form label-width="160px">
        <el-form-item label="请假是否需要审批">
          <el-switch v-model="leave.need" />
        </el-form-item>
        <el-form-item v-if="leave.need" label="批准人角色/岗位">
          <el-select v-model="leave.approver" placeholder="选择角色/岗位" style="width: 240px" filterable>
            <el-option v-for="r in approverOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const approverOptions = ['辅导员', '讲师', '部门经理', 'HRBP', '系统管理员']
const leave = ref({ need: true, approver: '辅导员' })
</script>

<style scoped>
.approval-setting { padding: 8px 0; }
</style> 