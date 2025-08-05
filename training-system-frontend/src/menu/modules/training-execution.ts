import type { MenuItem } from '../types'
import { VideoPlay, Document, Notebook, Calendar, EditPen, Clock, User, Medal, View, Refresh } from '@element-plus/icons-vue'

export const trainingExecutionMenu: MenuItem = {
  key: 'training-execution',
  title: '培训中',
  path: '/training-management/training-execution',
  icon: VideoPlay,
  children: [
    {
      key: 'face-to-face-management',
      title: '面授管理',
      path: '/training-management/training-execution/face-to-face',
      icon: Document
    },
    {
      key: 'homework-management',
      title: '作业管理',
      path: '/training-management/training-execution/homework',
      icon: Notebook
    },
    {
      key: 'online-course-management',
      title: '线上课程',
      path: '/training-management/training-execution/online-course',
      icon: Calendar
    },
    {
      key: 'conference-management',
      title: '会务管理',
      path: '/training-management/training-execution/conference',
      icon: EditPen
    },
    {
      key: 'exam-management',
      title: '考试管理',
      path: '/training-management/training-execution/exam',
      icon: Clock
    },
    {
      key: 'attendance-management',
      title: '考勤管理',
      path: '/training-management/training-execution/attendance',
      icon: User
    },
    {
      key: 'mentorship-management',
      title: '带教管理',
      path: '/training-management/training-execution/mentorship',
      icon: Medal
    },
    {
      key: 'score-management',
      title: '成绩管理',
      path: '/training-management/training-execution/score',
      icon: View
    },
    {
      key: 'observation-record',
      title: '观察记录',
      path: '/training-management/training-execution/observation',
      icon: Refresh
    },
    {
      key: 'review-management',
      title: '复盘管理',
      path: '/training-management/training-execution/review',
      icon: Notebook
    }
  ]
} 