import { apiClient } from './client';
import { DashboardStats } from '../types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<DashboardStats>('/api/v1/dashboard');
  return response.data;
};
