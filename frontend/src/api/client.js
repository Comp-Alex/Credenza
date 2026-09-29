const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
let csrfToken = null

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function messageForStatus(status) {
  if (status === 400 || status === 422) return 'Check the information and try again.'
  if (status === 401) return 'Those sign-in details did not match. Check them and try again.'
  if (status === 403) return 'That request could not be verified. Refresh the page and try again.'
  if (status === 409) return 'That email may already be registered. Try signing in instead.'
  if (status === 429) return 'Too many attempts. Wait a moment and try again.'
  if (status >= 500) return 'Credenza is having a moment. Please try again shortly.'
  return 'We could not complete that request. Please try again.'
}

async function parseResponse(response) {
  if (!response.headers.get('content-type')?.includes('application/json')) return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function fetchCsrfToken() {
  let response
  try {
    response = await fetch(`${apiBaseUrl}/security/csrf`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new ApiError('Credenza could not reach its server. Please try again shortly.')
  }

  const payload = await parseResponse(response)
  if (!response.ok || typeof payload?.csrfToken !== 'string' || !payload.csrfToken) {
    throw new ApiError(messageForStatus(response.status), response.status)
  }
  csrfToken = payload.csrfToken
  return csrfToken
}

async function request(path, { method = 'GET', body } = {}) {
  const normalizedMethod = method.toUpperCase()
  const needsCsrf = unsafeMethods.has(normalizedMethod)
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const send = async (token) => {
    const requestHeaders = { ...headers }
    if (token) requestHeaders['X-CSRF-Token'] = token
    try {
      return await fetch(`${apiBaseUrl}${path}`, {
        method: normalizedMethod,
        credentials: 'include',
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch {
      throw new ApiError('Credenza could not reach its server. Please try again shortly.')
    }
  }

  let token = needsCsrf ? csrfToken || await fetchCsrfToken() : null
  let response = await send(token)
  if (needsCsrf && response.status === 403) {
    csrfToken = null
    token = await fetchCsrfToken()
    response = await send(token)
  }

  const payload = await parseResponse(response)
  if (!response.ok) throw new ApiError(messageForStatus(response.status), response.status)
  if (['/login', '/register', '/logout'].includes(path)) csrfToken = null
  return payload
}

export const api = {
  auth: {
    session: () => request('/auth/session'),
    login: (credentials) => request('/login', { method: 'POST', body: credentials }),
    register: (details) => request('/register', { method: 'POST', body: details }),
    logout: () => request('/logout', { method: 'POST' }),
  },
  profile: {
    update: (profile) => request('/profile', { method: 'PUT', body: profile }),
  },
  templates: {
    list: () => request('/templates'),
    assign: (templateId, settings = {}) => request('/user/template', { method: 'POST', body: { templateId, settings } }),
  },
  projects: {
    list: (userId) => request(`/projects/${encodeURIComponent(userId)}`),
    create: (project) => request('/projects', { method: 'POST', body: project }),
    update: (id, project) => request(`/projects/${encodeURIComponent(id)}`, { method: 'PUT', body: project }),
    remove: (id) => request(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  skills: {
    list: (userId) => request(`/skills/${encodeURIComponent(userId)}`),
    create: (skill) => request('/skills', { method: 'POST', body: skill }),
    update: (id, skill) => request(`/skills/${encodeURIComponent(id)}`, { method: 'PUT', body: skill }),
    remove: (id) => request(`/skills/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  contact: {
    send: (message) => request('/contact', { method: 'POST', body: message }),
  },
}