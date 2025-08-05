import ExamForm from '@/modules/project-management/components/ExamForm.vue';
import AttendanceForm from '@/modules/project-management/execution/components/AttendanceForm.vue';
import HomeworkForm from '@/modules/project-management/execution/components/HomeworkForm.vue';
import FaceToFaceForm from '@/modules/project-management/execution/components/FaceToFaceForm.vue';
import OnlineCourseSelector from '@/modules/project-management/execution/components/OnlineCourseSelector.vue';
import DiscussionForm from '@/modules/project-management/components/DiscussionForm.vue';
import ActivityForm from '@/modules/project-management/components/ActivityForm.vue';
import QuestionnaireForm from '@/modules/project-management/components/QuestionnaireForm.vue';
import CooperationForm from '@/modules/project-management/components/CooperationForm.vue';

export interface TaskEditorMeta {
  component: any;
  /**
   * 根据任务对象生成传递给编辑表单的 props
   */
  buildProps?: (task: any) => Record<string, any>;
}

export const TASK_EDIT_REGISTRY: Record<string, TaskEditorMeta> = {
  exam: {
    component: ExamForm,
    buildProps: (task) => ({ examId: task.config?.examId }),
  },
  attendance: {
    component: AttendanceForm,
    buildProps: (task) => ({ attendanceId: task.config?.attendanceId }),
  },
  homework: { component: HomeworkForm },
  'face-to-face': { component: FaceToFaceForm },
  'online-course': { component: OnlineCourseSelector },
  discussion: { component: DiscussionForm },
  activity: { component: ActivityForm },
  questionnaire: { component: QuestionnaireForm },
  cooperation: { component: CooperationForm },
}; 