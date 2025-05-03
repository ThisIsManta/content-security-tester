import { vi, it, expect, afterEach } from 'vitest'
import core from '@actions/core'
import * as cheerio from 'cheerio'

import { checkScript } from '../main/checkScript.ts'

vi.mock('@actions/core', () => ({
	default: {
		setFailed: vi.fn()
	}
}))

afterEach(() => {
	vi.clearAllMocks()
})

it('does nothing, given no script-src directive', () => {
	checkScript(cheerio.load(`
		<html>
			<body>
				<script src="./main.js"></script>
				<script>console.log("hello!");</script>
			</body>
		</html>
	`), {})

	expect(core.setFailed).not.toHaveBeenCalled()
})

it('does not fail, given same-origin scripts', () => {
	checkScript(cheerio.load(`
		<html>
			<body>
				<script src="./main.js"></script>
			</body>
		</html>
	`), {
		'script-src': ['self']
	})

	expect(core.setFailed).not.toHaveBeenCalled()
})

it('does not fail, given specified host', () => {
	checkScript(cheerio.load(`
		<html>
			<body>
				<script src="https://www.example.com/script.js"></script>
			</body>
		</html>
	`), {
		'script-src': ['www.example.com']
	})

	expect(core.setFailed).not.toHaveBeenCalled()
})

it('fails, given no specified host', () => {
	checkScript(cheerio.load(`
		<html>
			<body>
				<script src="https://www.example.com/script.js"></script>
			</body>
		</html>
	`), {
		'script-src': ['self']
	})

	expect(core.setFailed).toHaveBeenCalledWith("Expected 'www.example.com' to be in Content-Security-Policy under script-src directive.")
})

it('does not fail, given specified hash', () => {
	checkScript(cheerio.load(`
		<html>
			<body>
				<script src="./main.js" integrity="sha256-H/eahVJiG1zBXPQyXX0V6oaxkfiBdmanvfG9eZWSuEc="></script>
			</body>
		</html>
	`), {
		'script-src': ['sha256-H/eahVJiG1zBXPQyXX0V6oaxkfiBdmanvfG9eZWSuEc=']
	})

	expect(core.setFailed).not.toHaveBeenCalled()
})

it('fails, given no specified hash', () => {
	checkScript(cheerio.load(`
		<html>
			<body>
				<script src="./main.js" integrity="sha256-H/eahVJiG1zBXPQyXX0V6oaxkfiBdmanvfG9eZWSuEc="></script>
			</body>
		</html>
	`), {
		'script-src': ['none']
	})

	expect(core.setFailed).toHaveBeenCalledWith("Expected 'sha256-H/eahVJiG1zBXPQyXX0V6oaxkfiBdmanvfG9eZWSuEc=' to be in Content-Security-Policy under script-src directive.")
})

it('fails, given no same-origin and no hash', () => {
	checkScript(cheerio.load(`
		<html>
			<body>
				<script src="./main.js"></script>
			</body>
		</html>
	`), {
		'script-src': ['none']
	})

	expect(core.setFailed).toHaveBeenCalledWith('Unexpected content security policy violation at\n<script src="./main.js"></script>')
})

it('fails, given integrity attribute without src attribute', () => {
	checkScript(cheerio.load(`
		<html>
			<body>
				<script integrity="sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI=">console.log("hello!");</script>
			</body>
		</html>
	`), {
		'script-src': ['sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI=']
	})

	expect(core.setFailed).toHaveBeenCalledWith('Unexpected `integrity` attribute without `src` attribute at\n<script integrity="sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI=">console.log("hello!");</script>')
})

it('does not fail, given unsafe-inline', () => {
	checkScript(cheerio.load(`
		<html>
			<body>
				<script>console.log("hello!");</script>
			</body>
		</html>
	`), {
		'script-src': ['unsafe-inline']
	})

	expect(core.setFailed).not.toHaveBeenCalled()
})

it('does not fail, given no unsafe-inline but hash', () => {
	checkScript(cheerio.load(`
		<html>
			<body>
				<script>console.log("hello!");</script>
			</body>
		</html>
	`), {
		'script-src': ['sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI=']
	})

	expect(core.setFailed).not.toHaveBeenCalled()
})

it('fails, given no unsafe-inline and no hash', () => {
	checkScript(cheerio.load(`
		<html>
			<body>
				<script>console.log("hello!");</script>
			</body>
		</html>
	`), {
		'script-src': ['self']
	})

	expect(core.setFailed).toHaveBeenCalledWith("Expected 'sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI=' to be in Content-Security-Policy under script-src directive.")
})