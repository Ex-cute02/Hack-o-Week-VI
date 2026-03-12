import { apiClient } from "./client";

interface LoginResponse {
  access_token: string;
  expires_in: number;
}

interface RegisterResponse {
  message: string;
  user_id: string;
}

export const authApi = {
  async register(email: string, password: string): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>("/auth/register", {
      email,
      password,
    });
    return data;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  },

  async refresh(): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/auth/refresh");
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
};
