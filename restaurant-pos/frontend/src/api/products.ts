import { apiClient } from './client';
import { Product } from '../types';

export const getProducts = async (categoryId?: number, search?: string): Promise<Product[]> => {
  const params: any = {};
  if (categoryId) params.category_id = categoryId;
  if (search) params.search = search;
  const response = await apiClient.get<Product[]>('/api/v1/products', { params });
  return response.data;
};

export const createProduct = async (data: any): Promise<Product> => {
  const response = await apiClient.post<Product>('/api/v1/products', data);
  return response.data;
};

export const updateProduct = async ({ id, data }: { id: number; data: any }): Promise<Product> => {
  const response = await apiClient.patch<Product>(`/api/v1/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/products/${id}`);
};
