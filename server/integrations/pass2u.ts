import type { Config } from '../config.js'

type PassIdentity = { teacherName: string; memberId: string }
type Pass2UResponse = { passId?: string; message?: string; error?: string }

export function createPass2UClient(config: Config, fetcher: typeof fetch = fetch) {
  const ready = Boolean(config.PASS2U_API_KEY && config.PASS2U_MODEL_ID)

  return {
    ready,
    async createMembershipPass(identity: PassIdentity) {
      if (!config.PASS2U_API_KEY || !config.PASS2U_MODEL_ID) throw Object.assign(new Error('Pass2U automation is not configured.'), { statusCode: 503 })
      const fields = [
        { key: config.PASS2U_MEMBER_NAME_FIELD.trim(), value: identity.teacherName },
        { key: config.PASS2U_MEMBER_ID_FIELD.trim(), value: identity.memberId },
        { key: config.PASS2U_STATUS_FIELD.trim(), value: 'Verified Educator' },
      ]
      if (fields.some(field => !field.key) || new Set(fields.map(field => field.key)).size !== fields.length) {
        throw Object.assign(new Error('Pass2U field keys must be three unique Dynamic field keys from the selected model.'), { statusCode: 503 })
      }
      const response = await fetcher(`https://api.pass2u.net/v2/models/${encodeURIComponent(config.PASS2U_MODEL_ID)}/passes?utm_source=teachersvip-web`, {
        method: 'POST',
        headers: { 'x-api-key': config.PASS2U_API_KEY, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'TeachersVIP Verified Educator Card',
          organizationName: 'TeachersVIP',
          logoText: 'TeachersVIP',
          foregroundColor: 'rgb(255, 255, 255)',
          backgroundColor: 'rgb(6, 16, 30)',
          labelColor: 'rgb(212, 175, 55)',
          sharingProhibited: true,
          fields,
        }),
        signal: AbortSignal.timeout(15_000),
      })
      const payload = await response.json().catch(() => ({})) as Pass2UResponse
      if (!response.ok || !payload.passId) {
        const message = response.status === 400
          ? 'Pass2U rejected the card setup. Confirm the model ID and all three Dynamic field keys in Railway.'
          : response.status === 403
            ? 'Pass2U denied the API key. Check the Pass2U API key and Enterprise API access.'
            : response.status === 404
              ? 'Pass2U could not find the configured model ID.'
              : response.status === 409
                ? 'Pass2U reported a conflict for this model. Check the selected model configuration.'
                : response.status === 429
                  ? 'Pass2U is busy. Please try again shortly.'
                  : response.status === 503 || response.status === 504
                    ? 'Pass2U is temporarily unavailable. Please try again shortly.'
                    : 'Pass2U could not create the wallet card.'
        throw Object.assign(new Error(message), { statusCode: response.status === 429 ? 503 : 502, providerStatus: response.status, providerMessage: payload.message })
      }
      return { passId: payload.passId, downloadUrl: `https://www.pass2u.net/d/${encodeURIComponent(payload.passId)}` }
    },
  }
}
