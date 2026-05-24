const API_BASE_URL = 'http://localhost:8080/api/seller'
const SESSION_KEY = 'tmdt-auth-session'

const getToken = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    return session?.token || null
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

async function sellerFetch(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const json = await parseJson(response)

  if (!response.ok) {
    const message = json?.message || `API error: ${response.status}`
    const err = new Error(response.status === 401 ? '401 Unauthorized' : message)
    err.status = response.status
    throw err
  }

  return json?.result ?? json
}

function unwrapPage(pageData) {
  return {
    content: pageData?.content || [],
    totalPages: pageData?.totalPages || 0,
    totalElements: pageData?.totalElements || 0,
    number: pageData?.number ?? 0,
  }
}

export async function getSellerDashboard() {
  return sellerFetch('/dashboard')
}

export async function getSellerShop() {
  return sellerFetch('/shop')
}

export async function updateSellerShop(data) {
  return sellerFetch('/shop', { method: 'PUT', body: JSON.stringify(data) })
}

export async function getSellerProducts(page = 0, pageSize = 20) {
  const pageData = await sellerFetch(`/products?page=${page}&pageSize=${pageSize}`)
  return unwrapPage(pageData)
}

export async function createProduct(productData) {
  return sellerFetch('/products', { method: 'POST', body: JSON.stringify(productData) })
}

export async function updateProduct(productId, productData) {
  return sellerFetch(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(productData) })
}

export async function updateProductVisibility(productId, status) {
  return sellerFetch(`/products/${productId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteProduct(productId) {
  return sellerFetch(`/products/${productId}`, { method: 'DELETE' })
}

export async function getSellerOrders(status, page = 0, pageSize = 20) {
  const statusQuery = status !== undefined && status !== null && status !== '' ? `&status=${status}` : ''
  const pageData = await sellerFetch(`/orders?page=${page}&pageSize=${pageSize}${statusQuery}`)
  return unwrapPage(pageData)
}

export async function getSellerOrderDetail(orderId) {
  return sellerFetch(`/orders/${orderId}`)
}

export async function updateOrderStatus(orderId, payload) {
  return sellerFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function getSellerRevenue(from, to) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString() ? `?${params.toString()}` : ''
  return sellerFetch(`/revenue${query}`)
}

export async function getSellerReviews(page = 0, pageSize = 20) {
  const pageData = await sellerFetch(`/reviews?page=${page}&pageSize=${pageSize}`)
  return unwrapPage(pageData)
}

export async function replyToReview(reviewId, content) {
  return sellerFetch(`/reviews/${reviewId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function getSellerVouchers() {
  return sellerFetch('/vouchers')
}

export async function createVoucher(data) {
  return sellerFetch('/vouchers', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateVoucher(voucherId, data) {
  return sellerFetch(`/vouchers/${voucherId}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteVoucher(voucherId) {
  return sellerFetch(`/vouchers/${voucherId}`, { method: 'DELETE' })
}

export const ORDER_STATUS = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPING: 2,
  DELIVERED: 3,
  CANCELLED: 4,
  COMPLETED: 5,
}

export const ORDER_STATUS_LABELS = {
  0: 'Cho xac nhan',
  1: 'Cho lay hang',
  2: 'Dang giao',
  3: 'Da giao',
  4: 'Da huy',
  5: 'Hoan thanh',
}

export const ORDER_TABS = [
  { key: 'all', label: 'Tat ca', status: null },
  { key: 'pending', label: 'Cho xac nhan', status: 0 },
  { key: 'confirmed', label: 'Cho lay hang', status: 1 },
  { key: 'shipping', label: 'Dang giao', status: 2 },
  { key: 'delivered', label: 'Da giao', status: 3 },
  { key: 'cancelled', label: 'Da huy', status: 4 },
]
