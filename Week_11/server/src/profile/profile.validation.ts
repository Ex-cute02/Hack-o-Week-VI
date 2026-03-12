import { z } from "zod";

export const profileSyncSchema = z.object({
  device_mac: z
    .string()
    .regex(
      /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/,
      "Invalid MAC address format (expected XX:XX:XX:XX:XX:XX)",
    ),
  firmware_version: z.string().min(1, "Firmware version is required"),
  demographics: z.object({
    birth_year: z.number().int().min(1900).max(new Date().getFullYear()),
    weight_kg: z.number().positive().max(500),
    height_cm: z.number().positive().max(300),
  }),
});

export type ProfileSyncInput = z.infer<typeof profileSyncSchema>;
