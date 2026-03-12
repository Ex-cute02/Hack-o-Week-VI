import crypto from "crypto";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

const KEYS_DIR = path.join(__dirname, "../../keys");
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, "private.pem");
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, "public.pem");

let privateKey: crypto.KeyObject | null = null;
let publicKey: crypto.KeyObject | null = null;

export function loadOrGenerateKeyPair(): {
  privateKey: crypto.KeyObject;
  publicKey: crypto.KeyObject;
} {
  if (privateKey && publicKey) {
    return { privateKey, publicKey };
  }

  // Try loading from disk
  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    const privPem = fs.readFileSync(PRIVATE_KEY_PATH, "utf-8");
    const pubPem = fs.readFileSync(PUBLIC_KEY_PATH, "utf-8");
    privateKey = crypto.createPrivateKey(privPem);
    publicKey = crypto.createPublicKey(pubPem);
    logger.info("Loaded existing Ed25519 keypair from disk");
    return { privateKey, publicKey };
  }

  // Generate new keypair
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  const keyPair = crypto.generateKeyPairSync("ed25519");
  privateKey = keyPair.privateKey;
  publicKey = keyPair.publicKey;

  fs.writeFileSync(
    PRIVATE_KEY_PATH,
    privateKey.export({ type: "pkcs8", format: "pem" }) as string,
    { mode: 0o600 },
  );
  fs.writeFileSync(
    PUBLIC_KEY_PATH,
    publicKey.export({ type: "spki", format: "pem" }) as string,
  );

  logger.info("Generated new Ed25519 keypair");
  return { privateKey, publicKey };
}

export function getPrivateKey(): crypto.KeyObject {
  if (!privateKey) {
    loadOrGenerateKeyPair();
  }
  return privateKey!;
}

export function getPublicKey(): crypto.KeyObject {
  if (!publicKey) {
    loadOrGenerateKeyPair();
  }
  return publicKey!;
}
