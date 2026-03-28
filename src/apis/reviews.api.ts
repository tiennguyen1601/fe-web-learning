import axiosClient from './axios-client'

export interface ReviewDto {
  studentName: string
  rating: number
  comment?: string
  createdAt: string
}

export interface ReviewsPage {
  items: ReviewDto[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

const reviewsApi = {
  getAll: (courseId: string, page = 1, pageSize = 10): Promise<ReviewsPage> =>
    axiosClient.get(`/courses/${courseId}/reviews`, { params: { page, pageSize } }),

  getMy: (courseId: string): Promise<ReviewDto | null> =>
    axiosClient
      .get(`/courses/${courseId}/reviews/my`)
      .then((res: any) => res ?? null)
      .catch(() => null),

  upsert: (courseId: string, rating: number, comment?: string): Promise<void> =>
    axiosClient.post(`/courses/${courseId}/reviews`, { rating, comment }),
}

export default reviewsApi
