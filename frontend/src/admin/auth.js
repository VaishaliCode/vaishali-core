// Admin token lives in sessionStorage: it survives a refresh, and is gone when the tab closes.
const KEY = 'core.admin.token'

function safe(fn, fallback = null) {
  try {
    return fn()
  } catch {
    return fallback
  }
}

/** Reads the "exp" claim (seconds) from a JWT without verifying it. The server does the verifying. */
export function tokenExpiry(token) {
  return safe(() => {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload)).exp * 1000
  })
}

export function getToken() {
  const token = safe(() => sessionStorage.getItem(KEY))
  if (!token) return null
  const exp = tokenExpiry(token)
  if (!exp || exp <= Date.now()) {
    clearToken()
    return null
  }
  return token
}

export function setToken(token) {
  safe(() => sessionStorage.setItem(KEY, token))
}

export function clearToken() {
  safe(() => sessionStorage.removeItem(KEY))
}
