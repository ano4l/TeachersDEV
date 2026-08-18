import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url')
export const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex')

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, 64) as Buffer
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltHex, keyHex] = encoded.split(':')
  if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false
  const expected = Buffer.from(keyHex, 'hex')
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length) as Buffer
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function encrypt(value: string, hexKey: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(hexKey, 'hex'), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.')
}

export function decrypt(value: string, hexKey: string) {
  const [iv, tag, body] = value.split('.')
  if (!iv || !tag || !body) throw new Error('Encrypted value is malformed.')
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(hexKey, 'hex'), Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(body, 'base64url')), decipher.final()]).toString('utf8')
}
