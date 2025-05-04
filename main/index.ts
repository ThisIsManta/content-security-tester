import * as fs from 'fs/promises'

import core from '@actions/core'
import * as cheerio from 'cheerio'

import { transformDirectives } from './transformDirectives.ts'
import { checkScript } from './checkScript.ts'

const html = await (async () => {
	const htmlOrURL = core.getInput('html')

	if (/\.{0,2}\//.test(htmlOrURL)) {
		return fs.readFile(htmlOrURL, 'utf-8')
	}

	if (URL.canParse(htmlOrURL)) {
		const response = await fetch(htmlOrURL, { method: 'GET' })
		if (!response.ok) {
			throw new Error(`Could not reach ${htmlOrURL}.`)
		}
		return await response.text()
	}

	return htmlOrURL
})()

const policy = await (async () => {
	const policyOrURL = core.getInput('policy')

	if (URL.canParse(policyOrURL)) {
		const response = await fetch(policyOrURL, {
			method: 'HEAD',
			headers: {
				'Cache-Control': 'no-cache, no-store',
			},
		})
		if (!response.ok) {
			throw new Error(`Could not reach ${policyOrURL}.`)
		}
		return response.headers.get('Content-Security-Policy')
	}

	return policyOrURL || null
})()

core.info('Content-Security-Policy: ' + (policy || 'none'))

const $ = cheerio.load(html)
const directives = transformDirectives(policy)

checkScript($, directives)

if (directives['style-src']) {
	core.setFailed('Not implemented.')
}

if (directives['default-src']) {
	core.setFailed('Not implemented.')
}
