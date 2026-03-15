import crypto from 'crypto'

// Get encryption key from environment or use fallback for development
function getEncryptionKey() {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn('WARNING: ENCRYPTION_KEY not set. Using fallback dev key. DO NOT use in production!')
    return Buffer.alloc(32, 0) // 32 zero bytes as fallback
  }
  return Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
}

// Encrypt a plaintext string using AES-256-GCM
// Returns encrypted string in format: iv:authTag:encrypted (all hex)
export function encrypt(text) {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

// Decrypt an encrypted string
// Input: iv:authTag:encrypted format
// Returns original plaintext string
export function decrypt(encryptedText) {
  try {
    const key = getEncryptionKey()
    const parts = encryptedText.split(':')
    
    if (parts.length !== 3) {
      console.error('Invalid encrypted text format')
      return ''
    }
    
    const [ivHex, authTagHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error.message)
    return ''
  }
}

// Check if a string looks like it's already encrypted (contains colons)
export function isEncrypted(text) {
  if (!text || typeof text !== 'string') {
    return false
  }
  const parts = text.split(':')
  return parts.length === 3 && parts.every(part => /^[0-9a-fA-F]+$/.test(part))
}

// Mask a key for display: show only last 4 chars
// e.g. "sk-abc123xyz" → "****xyz"
export function maskKey(key) {
  if (!key || typeof key !== 'string') {
    return '****'
  }
  if (key.length <= 4) {
    return '****'
  }
  return '****' + key.slice(-4)
}