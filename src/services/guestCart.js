const GUEST_CART_KEY = 'tmdt-guest-cart'

export function getGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY)
}

export function getGuestCartCount() {
  return getGuestCart().reduce((sum, item) => sum + (item.quantity || 0), 0)
}

export function addToGuestCart(product, quantity = 1) {
  const items = getGuestCart()
  const existing = items.find((i) => i.productId === product.productId)

  if (existing) {
    existing.quantity = Math.min(
      (existing.quantity || 0) + quantity,
      product.stockQuantity ?? 999,
    )
  } else {
    items.push({
      productId: product.productId,
      productName: product.productName,
      price: product.price,
      imageUrl: product.imageUrl,
      shopId: product.shopId,
      shopName: product.shopName,
      stockQuantity: product.stockQuantity,
      quantity,
    })
  }

  saveGuestCart(items)
  return items
}

export function updateGuestCartItem(productId, quantity) {
  let items = getGuestCart()
  if (quantity <= 0) {
    items = items.filter((i) => i.productId !== productId)
  } else {
    items = items.map((i) =>
      i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stockQuantity ?? 999) } : i,
    )
  }
  saveGuestCart(items)
  return items
}

export function removeFromGuestCart(productId) {
  const items = getGuestCart().filter((i) => i.productId !== productId)
  saveGuestCart(items)
  return items
}

export function groupGuestCartByShop(items = getGuestCart()) {
  return items.reduce((groups, item) => {
    const shopId = item.shopId || 'unknown'
    if (!groups[shopId]) {
      groups[shopId] = { shopId: item.shopId, shopName: item.shopName, items: [] }
    }
    groups[shopId].items.push(item)
    return groups
  }, {})
}
