import { SignJWT, jwtVerify, importPKCS8, importSPKI, JWTPayload } from "jose";
import { getPrivateKey, getPublicKey } from "../crypto/keys";
import { config } from "../config";
import { JWTAccessPayload, JWTRefreshPayload } from "../types";

let cachedPrivateKey: Awaited<ReturnType<typeof importPKCS8>> | null = null;
let cachedPublicKey: Awaited<ReturnType<typeof importSPKI>> | null = null;

async function getJosePrivateKey() {
  if (!cachedPrivateKey) {
    const pem = getPrivateKey().export({
      type: "pkcs8",
      format: "pem",
    }) as string;
    cachedPrivateKey = await importPKCS8(pem, "EdDSA");
  }
  return cachedPrivateKey;
}

async function getJosePublicKey() {
  if (!cachedPublicKey) {
    const pem = getPublicKey().export({
      type: "spki",
      format: "pem",
    }) as string;
    cachedPublicKey = await importSPKI(pem, "EdDSA");
  }
  return cachedPublicKey;
}

export async function signAccessToken(payload: {
  sub: string;
  roles: string[];
}): Promise<string> {
  const key = await getJosePrivateKey();
  return new SignJWT({ roles: payload.roles })
    .setProtectedHeader({ alg: "EdDSA" })
    .setSubject(payload.sub)
    .setIssuer(config.JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(config.ACCESS_TOKEN_TTL)
    .sign(key);
}

export async function signRefreshToken(payload: {
  sub: string;
}): Promise<string> {
  const key = await getJosePrivateKey();
  return new SignJWT({})
    .setProtectedHeader({ alg: "EdDSA" })
    .setSubject(payload.sub)
    .setIssuer(config.JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(config.REFRESH_TOKEN_TTL)
    .sign(key);
}

export async function verifyAccessToken(
  token: string,
): Promise<JWTAccessPayload> {
  const key = await getJosePublicKey();
  const { payload } = await jwtVerify(token, key, {
    issuer: config.JWT_ISSUER,
  });

  return {
    sub: payload.sub as string,
    roles: (payload as JWTPayload & { roles: string[] }).roles,
    iat: payload.iat as number,
    exp: payload.exp as number,
    iss: payload.iss as string,
  };
}

export async function verifyRefreshToken(
  token: string,
): Promise<JWTRefreshPayload> {
  const key = await getJosePublicKey();
  const { payload } = await jwtVerify(token, key, {
    issuer: config.JWT_ISSUER,
  });

  return {
    sub: payload.sub as string,
    iat: payload.iat as number,
    exp: payload.exp as number,
    iss: payload.iss as string,
  };
}
