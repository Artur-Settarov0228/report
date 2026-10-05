import { apiClient } from './client';
import { Table } from '../types';

export const getTables = async (): Promise<Table[]> => {
  const response = await apiClient.get<Table[]>('/api/v1/tables/status');
  return response.data;
};

export const createTable = async (data: { table_number: string; seats: number }): Promise<Table> => {
  const response = await apiClient.post<Table>('/api/v1/tables', data);
  return response.data;
};
