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

function getGuestCartItemKey(productId, variantLabel) {
  return `${productId}::${variantLabel || 'default'}`
}

export function addToGuestCart(product, quantity = 1, selectedVariant = null) {
  const items = getGuestCart()
  const variantLabel = selectedVariant?.label || ''
  const variantPrice = selectedVariant?.price ?? product.price
  const cartItemKey = getGuestCartItemKey(product.productId, variantLabel)
  const existing = items.find((i) => i.cartItemKey === cartItemKey)

  if (existing) {
    existing.quantity = Math.min(
      (existing.quantity || 0) + quantity,
      selectedVariant?.stockQuantity ?? product.stockQuantity ?? 999,
    )
  } else {
    items.push({
      cartItemKey,
      productId: product.productId,
      productName: product.productName,
      variantLabel,
      variantPrice,
      price: variantPrice,
      imageUrl: product.imageUrl,
      shopId: product.shopId,
      shopName: product.shopName,
      stockQuantity: selectedVariant?.stockQuantity ?? product.stockQuantity,
      quantity,
    })
  }

  saveGuestCart(items)
  return items
}

export function updateGuestCartItem(cartItemKey, quantity) {
  let items = getGuestCart()
  if (quantity <= 0) {
    items = items.filter((i) => i.cartItemKey !== cartItemKey)
  } else {
    items = items.map((i) =>
      i.cartItemKey === cartItemKey ? { ...i, quantity: Math.min(quantity, i.stockQuantity ?? 999) } : i,
    )
  }
  saveGuestCart(items)
  return items
}

export function removeFromGuestCart(cartItemKey) {
  const items = getGuestCart().filter((i) => i.cartItemKey !== cartItemKey)
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
