const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const SESSION_KEY = 'tmdt-auth-session'

const getToken = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.token || null
  } catch {
    return null
  }
}

const parseJson = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function adminFetch(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const json = await parseJson(response)
  if (!response.ok) {
    const err = new Error(json?.message || `API error: ${response.status}`)
    err.status = response.status
    throw err
  }

  return json?.result ?? json
}

function unwrapList(listData) {
  return {
    content: listData?.content || [],
    totalPages: listData?.totalPages || 0,
    totalElements: listData?.totalElements || 0,
    currentPage: listData?.currentPage ?? 0,
    pageSize: listData?.pageSize || 10,
  }
}

// Statistics
export async function getAdminDashboard() {
  return adminFetch('/statistics/dashboard')
}

// Products approval
export async function getPendingProducts(page = 0, size = 10) {
  const data = await adminFetch(`/products/approval?page=${page}&size=${size}`)
  return unwrapList(data)
}

export async function getAdminProduct(productId) {
  return adminFetch(`/products/${productId}`)
}

export async function approveProduct(productId, reason = '') {
  return adminFetch(`/products/${productId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'approve', reason }),
  })
}

export async function rejectProduct(productId, reason) {
  return adminFetch(`/products/${productId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'reject', reason: reason || 'Khong dat tieu chuan' }),
  })
}

// Users
export async function getAdminUsers(page = 0, size = 10) {
  const data = await adminFetch(`/users?page=${page}&size=${size}`)
  return unwrapList(data)
}

export async function getAdminUser(userId) {
  return adminFetch(`/users/${userId}`)
}

export async function updateUserStatus(userId, status) {
  return adminFetch(`/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export async function updateUserRoles(userId, roles) {
  return adminFetch(`/users/${userId}/roles`, {
    method: 'PUT',
    body: JSON.stringify({ roles }),
  })
}

export async function deleteAdminUser(userId) {
  return adminFetch(`/users/${userId}`, { method: 'DELETE' })
}

// Vouchers
export async function getAdminVouchers(page = 0, size = 10) {
  const data = await adminFetch(`/vouchers?page=${page}&size=${size}`)
  return unwrapList(data)
}

export async function createAdminVoucher(payload) {
  return adminFetch('/vouchers', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updateAdminVoucher(voucherId, payload) {
  return adminFetch(`/vouchers/${voucherId}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export async function deleteAdminVoucher(voucherId) {
  return adminFetch(`/vouchers/${voucherId}`, { method: 'DELETE' })
}

// Shops (helper for voucher form)
export async function getAdminShops() {
  const data = await adminFetch('/shops')
  return Array.isArray(data) ? data : []
}

export const ADMIN_ROLES = ['ROLE_BUYER', 'ROLE_SELLER', 'ROLE_ADMIN']
