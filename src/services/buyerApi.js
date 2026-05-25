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

async function buyerFetch(path, options = {}) {
  const token = getToken()
  if (!token) {
    const err = new Error('401 Unauthorized')
    err.status = 401
    throw err
  }

  const response = await fetch(`${API_BASE_URL}/api/buyer${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

function unwrapPage(pageData) {
  return {
    content: pageData?.content || [],
    totalPages: pageData?.totalPages || 0,
    totalElements: pageData?.totalElements || 0,
    number: pageData?.number ?? 0,
  }
}

export async function getCart() {
  return buyerFetch('/cart')
}

export async function addToCart(productId, quantity = 1, selectedVariant = null) {
  return buyerFetch('/cart/items', {
    method: 'POST',
    body: JSON.stringify({
      productId,
      quantity,
      variantLabel: selectedVariant?.label || null,
      variantPrice: selectedVariant?.price ?? null,
    }),
  })
}

export async function updateCartItem(cartItemId, quantity) {
  return buyerFetch(`/cart/items/${cartItemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  })
}

export async function removeCartItem(cartItemId) {
  return buyerFetch(`/cart/items/${cartItemId}`, { method: 'DELETE' })
}

export async function mergeGuestCart(items) {
  return buyerFetch('/cart/merge', {
    method: 'POST',
    body: JSON.stringify({
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        variantLabel: i.variantLabel || null,
        variantPrice: i.variantPrice ?? null,
      })),
    }),
  })
}

export async function getAddresses() {
  return buyerFetch('/addresses')
}

export async function createAddress(data) {
  return buyerFetch('/addresses', { method: 'POST', body: JSON.stringify(data) })
}

export async function checkout(payload) {
  return buyerFetch('/checkout', { method: 'POST', body: JSON.stringify(payload) })
}

export async function previewVoucher(payload) {
  return buyerFetch('/vouchers/preview', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getBuyerOrders(status, page = 0, pageSize = 20) {
  const statusQuery = status !== undefined && status !== null && status !== '' ? `&status=${status}` : ''
  const pageData = await buyerFetch(`/orders?page=${page}&pageSize=${pageSize}${statusQuery}`)
  return unwrapPage(pageData)
}

export async function getBuyerOrderDetail(orderId) {
  return buyerFetch(`/orders/${orderId}`)
}

export async function cancelBuyerOrder(orderId) {
  return buyerFetch(`/orders/${orderId}/cancel`, { method: 'PATCH' })
}

export async function createReview(data) {
  return buyerFetch('/reviews', { method: 'POST', body: JSON.stringify(data) })
}

export const BUYER_ORDER_TABS = [
  { key: 'all', label: 'Tat ca', status: null },
  { key: 'pending', label: 'Cho xac nhan', status: 0 },
  { key: 'confirmed', label: 'Cho lay hang', status: 1 },
  { key: 'shipping', label: 'Dang giao', status: 2 },
  { key: 'delivered', label: 'Da giao', status: 3 },
  { key: 'completed', label: 'Hoan thanh', status: 5 },
  { key: 'cancelled', label: 'Da huy', status: 4 },
]
