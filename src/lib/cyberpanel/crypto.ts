import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// 32 bytes for AES-256
function getEncryptionKey(): Buffer {
  let keyString = process.env.CYBERPANEL_ENCRYPTION_KEY;
  if (keyString) {
    keyString = keyString.replace(/^['"]|['"]$/g, '');
  }

  if (!keyString) {
    throw new Error('CYBERPANEL_ENCRYPTION_KEY is required but not set in the environment.');
  }

  const keyBuffer = Buffer.from(keyString, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error(`CYBERPANEL_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters). Current length: ${keyBuffer.length} bytes.`);
  }

  return keyBuffer;
}

/**
 * Encrypts a plaintext string (e.g. password) using AES-256-GCM.
 * Returns a string formatted as "iv:authTag:encryptedData" (all hex encoded)
 */
export function encryptPassword(text: string): string {
  const key = getEncryptionKey();
  
  // Generate a random 12-byte IV for GCM
  const iv = crypto.randomBytes(12);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a cipher string formatted as "iv:authTag:encryptedData".
 * Returns the plaintext string.
 */
export function decryptPassword(encryptedText: string): string {
  const key = getEncryptionKey();
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted password format. Expected "iv:authTag:ciphertext".');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
