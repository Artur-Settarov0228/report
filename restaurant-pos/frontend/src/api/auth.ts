import { apiClient } from './client';
import { User } from '../types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', data);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/api/v1/auth/me');
  return response.data;
};
