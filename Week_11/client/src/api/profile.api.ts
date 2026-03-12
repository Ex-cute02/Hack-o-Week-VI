import { apiClient } from "./client";

export interface ProfilePayload {
  device_mac: string;
  firmware_version: string;
  demographics: {
    birth_year: number;
    weight_kg: number;
    height_cm: number;
  };
}

interface SyncResponse {
  message: string;
  updated_at: string;
}

export const profileApi = {
  async getProfile(): Promise<ProfilePayload | null> {
    try {
      const { data } = await apiClient.get<ProfilePayload>("/profile");
      return data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  async syncProfile(payload: ProfilePayload): Promise<SyncResponse> {
    const { data } = await apiClient.put<SyncResponse>("/profile", payload);
    return data;
  },
};
