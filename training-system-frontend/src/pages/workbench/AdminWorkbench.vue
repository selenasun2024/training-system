<template>
  <AdminWorkbenchPanel :project-id="projectId" />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import AdminWorkbenchPanel from './components/AdminWorkbenchPanel.vue'

const route = useRoute()
const projectId = route.params.projectId as string | undefined
</script> 