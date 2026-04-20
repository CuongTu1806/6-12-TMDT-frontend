const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

async function parseJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function unwrapApiResponse(json, fallbackMessage) {
  if (!json) {
    throw new Error(fallbackMessage)
  }

  if (json.code !== 1000) {
    throw new Error(json.message || fallbackMessage)
  }

  return json
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
    throw new Error(json?.message || 'Dang ky that bai')
  }

  return unwrapApiResponse(json, 'Dang ky that bai')
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
    throw new Error(json?.message || 'Dang nhap that bai')
  }

  return unwrapApiResponse(json, 'Dang nhap that bai')
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
    throw new Error(json?.message || 'Lam moi token that bai')
  }

  return unwrapApiResponse(json, 'Lam moi token that bai')
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
    throw new Error(json?.message || 'Dang xuat that bai')
  }

  return unwrapApiResponse(json, 'Dang xuat that bai')
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
    throw new Error(json?.message || 'Kiem tra role that bai')
  }

  return unwrapApiResponse(json, 'Kiem tra role that bai')
}
