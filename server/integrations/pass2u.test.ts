import { describe, expect, it, vi } from 'vitest'
import { getConfig } from '../config'
import { createPass2UClient } from './pass2u'

const config = getConfig({
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://test:test@localhost/test', APP_URL: 'http://localhost:8443',
  SESSION_SECRET: 'pass2u-test-session-secret-over-32-characters', DATA_ENCRYPTION_KEY: '22'.repeat(32),
  PASS2U_API_KEY: 'pass2u-test-api-key-1234567890', PASS2U_MODEL_ID: '1919',
})

describe('Pass2U client', () => {
  it('creates a personalized pass with server-side API-key authentication', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ passId: 'VT-TEST123' }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const client = createPass2UClient(config, fetcher)
    const result = await client.createMembershipPass({ teacherName: 'Amina Khumalo', memberId: 'TVIP-123456' })
    expect(result).toEqual({ passId: 'VT-TEST123', downloadUrl: 'https://www.pass2u.net/d/VT-TEST123' })
    expect(fetcher).toHaveBeenCalledOnce()
    const [url, options] = fetcher.mock.calls[0]!
    expect(url).toContain('/v2/models/1919/passes')
    expect((options?.headers as Record<string, string>)['x-api-key']).toBe(config.PASS2U_API_KEY)
    expect(JSON.parse(String(options?.body))).toMatchObject({ fields: [{ key: 'name', value: 'Amina Khumalo' }, { key: 'memberid', value: 'TVIP-123456' }, { key: 'status', value: 'Verified Educator' }] })
  })

  it('does not expose provider error bodies', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ message: 'private provider detail' }), { status: 400 }))
    await expect(createPass2UClient(config, fetcher).createMembershipPass({ teacherName: 'Test Teacher', memberId: 'TVIP-1' })).rejects.toThrow('Confirm the model ID and all three Dynamic field keys')
  })

  it('turns common provider failures into actionable setup messages', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ message: 'field key is invalid' }), { status: 400 }))
    await expect(createPass2UClient(config, fetcher).createMembershipPass({ teacherName: 'Test Teacher', memberId: 'TVIP-1' })).rejects.toThrow('Confirm the model ID and all three Dynamic field keys')
  })

  it('rejects duplicate Dynamic field keys before calling Pass2U', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const duplicateConfig = { ...config, PASS2U_STATUS_FIELD: 'name' }
    await expect(createPass2UClient(duplicateConfig, fetcher).createMembershipPass({ teacherName: 'Test Teacher', memberId: 'TVIP-1' })).rejects.toThrow('three unique Dynamic field keys')
    expect(fetcher).not.toHaveBeenCalled()
  })
})
