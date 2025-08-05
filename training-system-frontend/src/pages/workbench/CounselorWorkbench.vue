<template>
  <CounselorWorkbenchPanel :project-id="projectId" />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import CounselorWorkbenchPanel from './components/CounselorWorkbenchPanel.vue'

const route = useRoute()
const projectId = route.params.projectId as string | undefined
</script> 