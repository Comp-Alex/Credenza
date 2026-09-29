import assert from 'node:assert/strict'
import { after, test } from 'node:test'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL ||= 'postgresql://credenza:test@localhost:5432/credenza'
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-that-is-at-least-thirty-two-bytes'
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-that-is-a-different-32-byte-secret'
process.env.CLIENT_ORIGINS ||= 'http://localhost:5173'

const { createCsrfToken, csrfProtection, verifyCsrfToken } = await import('../src/middleware/csrf.js')
const { HttpError } = await import('../src/utils/HttpError.js')
const { app } = await import('../src/app.js')
const server = app.listen(0, '127.0.0.1')
await new Promise((resolve) => server.once('listening', resolve))
const serverUrl = `http://127.0.0.1:${server.address().port}`

after(async () => {
  server.closeAllConnections()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('CSRF tokens verify and reject modified values', () => {
  const token = createCsrfToken()
  const replacement = token.endsWith('0') ? '1' : '0'
  const modified = `${token.slice(0, -1)}${replacement}`

  assert.equal(verifyCsrfToken(token), true)
  assert.equal(verifyCsrfToken(modified), false)
  assert.equal(verifyCsrfToken('not-a-token'), false)
  assert.equal(verifyCsrfToken(undefined), false)
})

test('CSRF middleware rejects disallowed origins', () => {
  let error
  csrfProtection({ method: 'POST', cookies: {}, get: () => 'https://untrusted.example' }, {}, (value) => { error = value })
  assert.ok(error instanceof HttpError)
  assert.equal(error.status, 403)
})

test('CSRF middleware accepts a signed double-submit token from an allowed origin', () => {
  const token = createCsrfToken()
  let passed = false
  csrfProtection({
    method: 'POST',
    cookies: { credenza_csrf: token },
    get: (name) => name === 'origin' ? 'http://localhost:5173' : token,
  }, {}, (error) => { passed = error === undefined })
  assert.equal(passed, true)
})

test('CSRF middleware ignores safe methods', () => {
  let passed = false
  csrfProtection({ method: 'GET', cookies: {}, get: () => undefined }, {}, (error) => { passed = error === undefined })
  assert.equal(passed, true)
})

test('Express issues an HttpOnly CSRF cookie and returns its signed token', async () => {
  const response = await fetch(`${serverUrl}/api/security/csrf`)
  const payload = await response.json()
  const setCookie = response.headers.get('set-cookie') || ''

  assert.equal(response.status, 200)
  assert.equal(verifyCsrfToken(payload.csrfToken), true)
  assert.match(setCookie, /credenza_csrf=/)
  assert.match(setCookie, /HttpOnly/i)
  assert.match(setCookie, /Path=\/api/i)
})

test('Express blocks mutations without CSRF and validates a token before account creation', async () => {
  const missingToken = await fetch(`${serverUrl}/api/register`, {
    method: 'POST',
    headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json' },
    body: '{}',
  })
  assert.equal(missingToken.status, 403)

  const csrfToken = createCsrfToken()
  const validatedRequest = await fetch(`${serverUrl}/api/register`, {
    method: 'POST',
    headers: {
      Origin: 'http://localhost:5173',
      Cookie: `credenza_csrf=${csrfToken}`,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })
  const payload = await validatedRequest.json()
  assert.equal(validatedRequest.status, 400)
  assert.equal(payload.error, 'Check the information and try again.')
  assert.ok(Array.isArray(payload.details))
})