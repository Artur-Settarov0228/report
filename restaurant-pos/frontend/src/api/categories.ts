import { apiClient } from './client';
import { Category } from '../types';

export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/api/v1/categories');
  return response.data;
};

export const createCategory = async (data: { name: string; description?: string }): Promise<Category> => {
  const response = await apiClient.post<Category>('/api/v1/categories', data);
  return response.data;
};

export const updateCategory = async ({ id, data }: { id: number; data: { name?: string; description?: string } }): Promise<Category> => {
  const response = await apiClient.patch<Category>(`/api/v1/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/categories/${id}`);
};
