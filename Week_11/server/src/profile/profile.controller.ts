import { Request, Response, NextFunction } from "express";
import { profileSyncSchema } from "./profile.validation";
import * as profileService from "./profile.service";

export async function handleSyncProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedData = profileSyncSchema.parse(req.body);
    const { updatedAt } = await profileService.syncProfile(
      req.user!.userId,
      validatedData,
    );
    res.json({ message: "Profile synced", updated_at: updatedAt });
  } catch (err) {
    next(err);
  }
}

export async function handleGetProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const profile = await profileService.getProfile(req.user!.userId);
    if (!profile) {
      return res.status(404).json({ error: "No profile found" });
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
}
