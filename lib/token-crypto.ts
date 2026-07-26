// Wraps trackingToken (and any other internal lookup token we don't want
// visible/guessable in URLs or on-screen) in AES-256-GCM before it's ever
// sent to a browser. The DB still stores/queries the raw token internally
// — only the public-facing representation (tracking links, "Tracking ID"
// text shown to the applicant) is the encrypted form. Decrypt on the way
// back in to recover the real value for the Prisma lookup.
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  }
  // derive a 32-byte key regardless of the configured secret's length
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(raw: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(raw, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

// Returns null instead of throwing on malformed/tampered input, since
// callers use this on untrusted URL segments and should treat any
// decryption failure as "not found" rather than a 500.
export function decryptToken(encoded: string): string | null {
  try {
    const key = getKey();
    const buf = Buffer.from(encoded, "base64url");
    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
