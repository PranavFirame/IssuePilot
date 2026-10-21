import crypto from "node:crypto";

/**
 * Hashes a plaintext password using scrypt with a cryptographically secure 16-byte salt.
 * Formats result as: "scrypt$<salt_hex>$<derived_key_hex>"
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt$${salt}$${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Verifies a plaintext password against a stored scrypt hash in constant time
 * using crypto.timingSafeEqual to prevent side-channel timing attacks.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!storedHash || typeof storedHash !== "string") {
      return resolve(false);
    }

    const parts = storedHash.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
      return resolve(false);
    }

    const [, salt, originalKeyHex] = parts;
    const originalKey = Buffer.from(originalKeyHex, "hex");

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        if (originalKey.length !== derivedKey.length) {
          return resolve(false);
        }
        resolve(crypto.timingSafeEqual(originalKey, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}
