GitHub Actions for testing HTML against a `script-src` directive in the content security policy (CSP)

### Usage example

```yml
uses: thisismanta/content-security-tester@master
with:
  html: |
    <html>
      <body>
        <script>console.log("hello!");</script>
      </body>
    </html>
  policy: "script-src 'sha256-ex2O7MWOzfczthhKm6azheryNVoERSFrPrdvxRtP8DI='"
```

Alternatively, a URL can be specified to retrieve the HTML content and/or Content-Security-Policy response header.

```yml
uses: thisismanta/content-security-tester@master
with:
  html: https://content-security-policy.com
  policy: https://content-security-policy.com
```
