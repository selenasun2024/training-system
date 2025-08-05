import type { MeetingDraft } from '@/modules/project-management/stores/meeting'

// TODO: 替换为真实后端接口调用
export async function pushMeeting(draft: MeetingDraft): Promise<{ externalId: string }> {
  console.log('Mock pushMeeting:', draft)
  // 模拟网络延迟
  await new Promise((r) => setTimeout(r, 500))
  return { externalId: 'mock-external-id-' + draft.id }
}

export async function syncMeeting(draft: MeetingDraft): Promise<void> {
  console.log('Mock syncMeeting:', draft)
  await new Promise((r) => setTimeout(r, 300))
} 