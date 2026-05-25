export function parseProductAttributes(attributes) {
  if (!attributes) {
    return { skuCode: '', variants: [] }
  }

  if (typeof attributes === 'object') {
    return normalizeAttributes(attributes)
  }

  try {
    return normalizeAttributes(JSON.parse(attributes))
  } catch {
    return { skuCode: '', variants: [] }
  }
}

export function normalizeAttributes(rawAttributes) {
  const variants = Array.isArray(rawAttributes?.variants)
    ? rawAttributes.variants
        .map((variant) => {
          if (typeof variant === 'string') {
            const label = variant.trim()
            if (!label) return null
            return { label, price: 0, stockQuantity: 0 }
          }

          const label = String(variant?.label || variant?.name || '').trim()
          if (!label) return null

          return {
            label,
            price: Number(variant?.price || 0),
            stockQuantity: Number(variant?.stockQuantity || 0),
          }
        })
        .filter(Boolean)
    : []

  return {
    skuCode: rawAttributes?.skuCode || '',
    variants,
  }
}

export function getVariantPrice(product) {
  const attributes = parseProductAttributes(product?.attributes)
  if (attributes.variants.length === 0) {
    return Number(product?.price || 0)
  }

  const pricedVariants = attributes.variants
    .map((variant) => Number(variant.price || 0))
    .filter((price) => price > 0)

  if (pricedVariants.length === 0) {
    return Number(product?.price || 0)
  }

  return Math.min(...pricedVariants)
}

export function formatVariantLabel(variant) {
  if (!variant) return ''
  if (typeof variant === 'string') return variant
  return String(variant.label || variant.name || '').trim()
}