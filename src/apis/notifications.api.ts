import axiosClient from './axios-client'

export type NotificationType =
  | 'EnrollmentPending'
  | 'EnrollmentApproved'
  | 'EnrollmentRejected'
  | 'AssignmentGraded'

export interface NotificationDto {
  id: string
  type: NotificationType
  message: string
  referenceId?: string
  isRead: boolean
  createdAt: string
}

const notificationsApi = {
  getAll: (): Promise<NotificationDto[]> =>
    axiosClient.get('/notifications'),

  markAllRead: (): Promise<void> =>
    axiosClient.patch('/notifications/read-all'),
}

export default notificationsApi
