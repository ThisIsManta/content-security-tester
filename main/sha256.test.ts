import { it, expect } from 'vitest'

import { sha256 } from '../main/sha256.ts'

it('returns SHA256 hash code in base-64 encoding', () => {
	expect(sha256('console.log("hello!");')).toEqual('ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI=')
})