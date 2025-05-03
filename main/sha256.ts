import * as crypto from 'node:crypto'

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP#hashes
 * @see https://emn178.github.io/online-tools/sha256.html
 */
export function sha256(content: string) {
	return crypto.createHash('sha256').update(content).digest().toString('base64')
}