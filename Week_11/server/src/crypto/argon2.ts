import argon2Lib from "argon2";

const ARGON2_OPTIONS: argon2Lib.Options & { raw?: false } = {
  type: argon2Lib.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2Lib.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon2Lib.verify(hash, password);
}

// Pre-computed dummy hash for constant-time defense against user enumeration
export const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgt3ub+b+daw";
