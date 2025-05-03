import { it, expect } from 'vitest'

import { transformDirectives } from '../main/transformDirectives.ts'

it('returns an empty object, given no policy', () => {
	expect(transformDirectives(undefined)).toEqual({})
	expect(transformDirectives(null)).toEqual({})
	expect(transformDirectives('')).toEqual({})
})

it('returns directive-values object', () => {
	expect(transformDirectives("script-src 'self'")).toEqual({
		'script-src': ['self'],
	})
	expect(transformDirectives("script-src 'self' example.com 'sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI='")).toEqual({
		'script-src': ['self', 'example.com', 'sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI='],
	})
	expect(transformDirectives("script-src 'self' example.com 'sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI='; default-src 'self'")).toEqual({
		'script-src': ['self', 'example.com', 'sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI='],
		'default-src': ['self'],
	})
})