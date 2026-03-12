export interface AuthenticatedUser {
  userId: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface JWTAccessPayload {
  sub: string;
  roles: string[];
  iat: number;
  exp: number;
  iss: string;
}

export interface JWTRefreshPayload {
  sub: string;
  iat: number;
  exp: number;
  iss: string;
}

export interface ProfilePayload {
  device_mac: string;
  firmware_version: string;
  demographics: {
    birth_year: number;
    weight_kg: number;
    height_cm: number;
  };
}
