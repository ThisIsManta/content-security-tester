/**
 * @example
 * {
 *   'script-src': ['self', 'example.com'],
 *   'default-src': ['self']
 * }
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy#directives
 */
export function transformDirectives(policy: string | undefined | null): { [directive: string]: string[] } {
	if (!policy) {
		return {}
	}

	return Object.fromEntries(
		policy.split(/ *;/).map((entry) => {
			const [directive, ...values] = entry
				.trim()
				.split(/ +/)
				.map((value) => value.replace(/^'/, '').replace(/'$/, ''))
			return [directive, values]
		})
	)
}