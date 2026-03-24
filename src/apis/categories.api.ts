import axiosClient from './axios-client'
import type { CategoryDto } from '@/ts/types/api'

const categoriesApi = {
  getAll: (): Promise<CategoryDto[]> =>
    axiosClient.get('/categories'),

  create: (data: { name: string; slug: string }): Promise<{ id: string }> =>
    axiosClient.post('/categories', data),

  update: (id: string, data: { name: string; slug: string }): Promise<void> =>
    axiosClient.put(`/categories/${id}`, data),

  delete: (id: string): Promise<void> =>
    axiosClient.delete(`/categories/${id}`),
}

export default categoriesApi
