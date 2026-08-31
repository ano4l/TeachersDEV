import { randomUUID } from 'node:crypto'
import { hashPassword } from '../security.js'
import type { DbPool } from './pool.js'

export const TEST_ADMIN_EMAIL = 'admin@teachersvip.local'
export const TEST_ADMIN_PASSWORD = 'TeachersVIP-Admin-2026!'

// Temporary launch-testing bootstrap. Remove before making the app public.
export async function ensureTestAdmin(db: DbPool) {
  const adminId = '00000000-0000-4000-8000-000000000001'
  await db.query(`INSERT INTO users(id,personal_email,password_hash,first_name,last_name,city,educator_verified_at)
    VALUES($1,$2,$3,'Platform','Admin','Houston, Texas',now())
    ON CONFLICT (personal_email) DO UPDATE SET password_hash=EXCLUDED.password_hash,educator_verified_at=COALESCE(users.educator_verified_at,now()),updated_at=now()`, [adminId, TEST_ADMIN_EMAIL, await hashPassword(TEST_ADMIN_PASSWORD)])
  await db.query(`INSERT INTO member_cards(id,user_id,member_id) VALUES($1,$2,'TVIP-TESTADMIN') ON CONFLICT (user_id) DO NOTHING`, ['00000000-0000-4000-8000-000000000002', adminId])
}
