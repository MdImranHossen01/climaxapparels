import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const SALT_LENGTH = 16;
const VERSION_PREFIX = 'v1:';

const MASTER_KEY = process.env.ENCRYPTION_KEY;

/**
 * Validates and retrieves the master encryption key.
 * Strictly enforces existence in production but only when called,
 * allowing Next.js build-time static generation to proceed.
 */
function getEffectiveKey(): string {
  if (!MASTER_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY is required in production environments to secure sensitive data.');
    }
    return 'Climax Apparelsshop-dev-only-insecure-key-32';
  }
  return MASTER_KEY;
}

/**
 * Validates if a string follows the v1 encrypted format:
 * v1:salt(32):iv(24):authTag(32):ciphertext(hex)
 */
function isEncryptedV1(text: string): boolean {
  if (!text.startsWith(VERSION_PREFIX)) return false;
  const parts = text.split(':');
  if (parts.length !== 5) return false;

  // Validate lengths of fixed-size components: salt, iv, authTag
  const [, salt, iv, authTag, ciphertext] = parts;
  return (
    salt.length === SALT_LENGTH * 2 &&
    iv.length === IV_LENGTH * 2 &&
    authTag.length === 32 && // 16 bytes * 2
    /^[0-9a-f]+$/i.test(salt) &&
    /^[0-9a-f]+$/i.test(iv) &&
    /^[0-9a-f]+$/i.test(authTag) &&
    /^[0-9a-f]+$/i.test(ciphertext)
  );
}

/**
 * Encrypts a plain text string into a versioned, authenticated ciphertext format:
 * v1:salt:iv:authTag:encrypted
 */
export function encrypt(text: string): string {
  if (!text) return text;

  // Robust idempotency check to prevent attacker-controlled bypass
  if (isEncryptedV1(text)) {
    return text;
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key using scrypt with the random salt
  const key = crypto.scryptSync(getEffectiveKey(), salt, 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${VERSION_PREFIX}${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a versioned ciphertext. Returns null on authentication failure or malformed input.
 */
export function decrypt(text: string | null | undefined): string | null {
  if (!text) return null;

  // Handle legacy unencrypted data or incorrect formats
  if (!isEncryptedV1(text)) {
    // If it doesn't have our verified v1 structure, treat as plain text or legacy data
    return text.includes(':') ? null : text;
  }

  const parts = text.split(':');
  // Expected parts: [v1, salt, iv, authTag, ciphertext]
  if (parts.length !== 5) {
    return null;
  }

  try {
    const salt = Buffer.from(parts[1], 'hex');
    const iv = Buffer.from(parts[2], 'hex');
    const authTag = Buffer.from(parts[3], 'hex');
    const encryptedText = Buffer.from(parts[4], 'hex');

    // Safety check for Buffer lengths before expensive scrypt/decipher
    if (salt.length !== SALT_LENGTH || iv.length !== IV_LENGTH || authTag.length !== 16) {
      return null;
    }

    const key = crypto.scryptSync(getEffectiveKey(), salt, 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error: any) {
    // Generic error message to prevent side-channel leaks
    console.error('Decryption error:', error.name || 'Authentication Failed');
    return null;
  }
}

