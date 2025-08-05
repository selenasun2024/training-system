import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import { useTrainingStageStore } from './trainingStage'
import { ref } from 'vue'

export interface TaskLink {
  taskId: string
  type: 'face-to-face' | 'homework'
  title: string
  onsiteDisplay: boolean
  pushed: boolean
}

export interface MeetingDraft {
  id: string
  projectId: string
  stageId: string
  title: string
  startTime: string
  endTime: string
  location: string
  tasks: TaskLink[]
  status: 'draft' | 'pushed'
  externalId?: string
}

export const useMeetingStore = defineStore('meeting', () => {
  const drafts = ref<MeetingDraft[]>([] as MeetingDraft[])

  const trainingStageStore = useTrainingStageStore()

  function createDraft(projectId: string, stageId: string, initialTasks: TaskLink[] = []) {
    const draft: MeetingDraft = {
      id: nanoid(),
      projectId,
      stageId,
      title: '新会议',
      startTime: '',
      endTime: '',
      location: '',
      tasks: initialTasks,
      status: 'draft',
    }
    drafts.value.push(draft)
    return draft
  }

  function updateDraft(id: string, patch: Partial<MeetingDraft>) {
    const d = drafts.value.find((m) => m.id === id)
    if (d) Object.assign(d, patch)
  }

  async function pushMeeting(id: string) {
    const draft = drafts.value.find((m) => m.id === id)
    if (!draft) throw new Error('draft not found')
    // 调用占位 API
    const { pushMeeting } = await import('@/api/modules/meeting')
    const resp = await pushMeeting(draft)
    draft.status = 'pushed'
    draft.externalId = resp.externalId

    // 标记关联任务已推送
    draft.tasks.forEach((t) => {
      if (!t.pushed) {
        t.pushed = true
        trainingStageStore.updateTaskConfig(t.taskId, { config: { pushed: true } as any })
      }
    })
  }

  async function syncUpdate(id: string) {
    const draft = drafts.value.find((m) => m.id === id && m.status === 'pushed')
    if (!draft || !draft.externalId) return
    const { syncMeeting } = await import('@/api/modules/meeting')
    await syncMeeting(draft)
  }

  function deleteDraft(id: string) {
    const idx = drafts.value.findIndex((d) => d.id === id)
    if (idx !== -1) {
      // 若已推送暂不允许删除，可根据业务放开
      if (drafts.value[idx].status === 'pushed') return false
      drafts.value.splice(idx, 1)
      return true
    }
    return false
  }

  function getDraft(id: string) {
    return drafts.value.find((m) => m.id === id)
  }

  return { drafts, createDraft, updateDraft, deleteDraft, pushMeeting, syncUpdate, getDraft }
}) 