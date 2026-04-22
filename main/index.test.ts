import { vi, it, expect, afterEach } from 'vitest'
import * as core from '@actions/core'

import { checkScript } from './checkScript.ts'

vi.mock('@actions/core', () => ({
	getInput: vi.fn(),
	info: vi.fn(),
	warning: vi.fn(),
	setFailed: vi.fn(),
}))

vi.mock('./checkScript.ts', () => ({
	checkScript: vi.fn()
}))

vi.stubGlobal('fetch', vi.fn())

afterEach(() => {
	vi.resetAllMocks()
	vi.resetModules()
})

const html = `
<html>
	<body>
		<script>console.log("hello!");</script>
	</body>
</html>
`
const policy = `script-src 'self' google.com sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI=;`

it('fetches HTML from a local file', async () => {
	vi.mocked(core.getInput).mockImplementation(
		(key: string) => ({
			html: './test/dummy.html',
			policy: '',
		}[key] ?? '')
	)

	await import('./index.ts')

	expect(core.getInput).toHaveBeenCalledTimes(2)
	expect(core.info).toHaveBeenLastCalledWith(`Content-Security-Policy: none`)
	expect(vi.mocked(checkScript).mock.lastCall?.[0].html()).toMatchInlineSnapshot(`
		"<html><head></head><body>
				<script>console.log("hello!");</script>
			
		</body></html>"
	`)
	expect(vi.mocked(checkScript).mock.lastCall?.[1]).toEqual({})
	expect(fetch).not.toHaveBeenCalled()
	expect(core.setFailed).not.toHaveBeenCalled()
})

it('fetches HTML and policy from the given URLs', async () => {
	const response = new Response(html, {
		headers: {
			'Content-Security-Policy': policy
		}
	})
	vi.mocked(fetch).mockImplementation(async () => response)

	vi.mocked(core.getInput).mockImplementation(
		(key: string) => ({
			html: 'https://example.com/',
			policy: 'https://example.com/',
		}[key] ?? '')
	)

	await import('./index.ts')

	expect(core.getInput).toHaveBeenCalledTimes(2)
	expect(core.info).toHaveBeenLastCalledWith(`Content-Security-Policy: script-src 'self' google.com sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI=;`)
	expect(vi.mocked(checkScript).mock.lastCall?.[0].html()).toMatchInlineSnapshot(`
		"<html><head></head><body>
				<script>console.log("hello!");</script>
			

		</body></html>"
	`)
	expect(vi.mocked(checkScript).mock.lastCall?.[1]).toEqual({
		'script-src': [
			'self',
			'google.com',
			'sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI=',
		],
	})
	expect(core.setFailed).not.toHaveBeenCalled()
})

it('uses as-is HTML and policy', async () => {
	vi.mocked(core.getInput).mockImplementation(
		(key: string) => ({
			html,
			policy,
		}[key] ?? '')
	)

	await import('./index.ts')

	expect(core.getInput).toHaveBeenCalledTimes(2)
	expect(core.info).toHaveBeenLastCalledWith(`Content-Security-Policy: ${policy}`)
	expect(vi.mocked(checkScript).mock.lastCall?.[0].html()).toMatchInlineSnapshot(`
		"<html><head></head><body>
				<script>console.log("hello!");</script>
			

		</body></html>"
	`)
	expect(vi.mocked(checkScript).mock.lastCall?.[1]).toEqual({
		'script-src': [
			'self',
			'google.com',
			'sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI=',
		],
	})
	expect(core.setFailed).not.toHaveBeenCalled()
})

it('throws, given an unreachable HTML URL', async () => {
	const response = new Response(null, {
		status: 404,
	})
	vi.mocked(fetch).mockImplementation(async () => response)

	vi.mocked(core.getInput).mockImplementation(
		(key: string) => ({
			html: 'https://example.com/',
			policy: '',
		}[key] ?? '')
	)

	await expect(import('./index.ts')).rejects.toThrow('Could not reach https://example.com/.')
})

it('throws, given an unreachable policy URL', async () => {
	const response = new Response(null, {
		status: 404,
		headers: {
			'Content-Security-Policy': policy
		}
	})
	vi.mocked(fetch).mockImplementation(async () => response)

	vi.mocked(core.getInput).mockImplementation(
		(key: string) => ({
			html,
			policy: 'https://example.com/',
		}[key] ?? '')
	)

	await expect(import('./index.ts')).rejects.toThrow('Could not reach https://example.com/.')
})

it('warns, given unsupported policies', async () => {
	vi.mocked(core.getInput).mockImplementation(
		(key: string) => ({
			html,
			policy: policy + ` style-src 'self'; default-src 'self';`,
		}[key] ?? '')
	)

	await import('./index.ts')

	expect(core.warning).toHaveBeenCalledTimes(2)
	expect(core.warning).toHaveBeenCalledWith('Not implemented.')
})
