const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

async function parseJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function getErrorMessage(json, fallbackMessage) {
  if (typeof json === 'string' && json) {
    return json
  }

  if (json && typeof json === 'object' && json.message) {
    return json.message
  }

  return fallbackMessage
}

export async function register(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const json = await parseJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(json, 'Dang ky that bai'))
  }

  return json
}

export async function login(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const json = await parseJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(json, 'Dang nhap that bai'))
  }

  return json
}

export async function refreshToken(refreshTokenValue) {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  })

  const json = await parseJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(json, 'Lam moi token that bai'))
  }

  return json
}

export async function logout(refreshTokenValue) {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  })

  const json = await parseJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(json, 'Dang xuat that bai'))
  }

  return json
}

export async function pingRole(path, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const json = await parseJson(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(json, 'Kiem tra role that bai'))
  }

  return json
}
