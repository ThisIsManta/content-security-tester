import * as core from '@actions/core'
import * as cheerio from 'cheerio'

import { sha256 } from './sha256.ts'

export function checkScript(
	$: cheerio.CheerioAPI,
	directives: { [directive: string]: string[] }
) {
	for (const script of $('script')) {
		if (directives['script-src'] === undefined) {
			continue
		}

		const outerHTML = cheerio.load(script).html()

		if (script.attribs.src) {
			if (/^\.{0,2}\//.test(script.attribs.src)) {
				if (directives['script-src'].includes('self')) {
					continue
				}

			} else if (URL.canParse(script.attribs.src)) {
				const { host } = new URL(script.attribs.src)
				if (directives['script-src'].includes(host)) {
					continue
				}

				core.setFailed(`Expected '${host}' to be in Content-Security-Policy under script-src directive.`)
				continue
			}

			if (script.attribs.integrity) {
				if (directives['script-src'].includes(script.attribs.integrity)) {
					continue
				}

				core.setFailed(`Expected '${script.attribs.integrity}' to be in Content-Security-Policy under script-src directive.`)
				continue
			}

			core.setFailed('Unexpected content security policy violation at\n' + outerHTML)
			continue
		}

		if (script.attribs.integrity) {
			// See https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script#integrity
			core.setFailed('Unexpected `integrity` attribute without `src` attribute at\n' + outerHTML)
			continue
		}

		if (directives['script-src'].includes('unsafe-inline')) {
			continue
		}

		const contentHash = 'sha256-' + sha256(cheerio.load(script).text())
		if (directives['script-src'].includes(contentHash)) {
			continue
		}

		core.setFailed(`Expected '${contentHash}' to be in Content-Security-Policy under script-src directive.`)
	}
}