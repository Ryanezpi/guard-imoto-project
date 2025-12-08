import { api } from './api';

export const loginAPI = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};
