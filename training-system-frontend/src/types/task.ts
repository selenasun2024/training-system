export interface StudentSubmission {
  userId: string;
  userName: string;
  content: string; // 提交内容，可根据实际扩展
  score?: number; // 已评分则有分数
  feedback?: string; // 批阅反馈
  reviewedAt?: string; // 批阅时间
}

export interface TaskForReview {
  id: string;
  title: string;
  /** 所属项目 */
  projectId: string;
  projectName: string;
  reviewerRole: 'counselor' | 'teacher' | 'admin';
  deadline: string;
  submissions: StudentSubmission[];
} 