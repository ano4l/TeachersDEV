import { describe, expect, it } from 'vitest'
import { decrypt, encrypt, hashPassword, randomToken, tokenHash, verifyPassword } from './security'

describe('security helpers', () => {
  it('hashes and verifies passwords without storing the password', async () => {
    const encoded = await hashPassword('a-long-test-password')
    expect(encoded).not.toContain('a-long-test-password')
    expect(await verifyPassword('a-long-test-password', encoded)).toBe(true)
    expect(await verifyPassword('wrong-password', encoded)).toBe(false)
  })

  it('encrypts and decrypts protected deal codes', () => {
    const key = '11'.repeat(32)
    const encrypted = encrypt('EDUCATOR25', key)
    expect(encrypted).not.toContain('EDUCATOR25')
    expect(decrypt(encrypted, key)).toBe('EDUCATOR25')
  })

  it('creates opaque, hashable tokens', () => {
    const token = randomToken()
    expect(token.length).toBeGreaterThan(30)
    expect(tokenHash(token)).toMatch(/^[a-f0-9]{64}$/)
  })
})
