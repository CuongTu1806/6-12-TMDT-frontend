import { getProductImageUrl } from '../utils/image'

export function ProductCard({ product, onClick, onAddToCart }) {
  const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}₫`
  const displayPrice = (() => {
    try {
      const attributes = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes
      const prices = Array.isArray(attributes?.variants)
        ? attributes.variants.map((variant) => Number(variant?.price || 0)).filter((price) => price > 0)
        : []
      return prices.length > 0 ? Math.min(...prices) : product.price
    } catch {
      return product.price
    }
  })()

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <button type="button" onClick={() => onClick?.(product)} className="block w-full text-left">
        <div className="h-44 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          {product.imageUrl ? (
            <img src={getProductImageUrl(product.imageUrl)} alt={product.productName} className="h-full w-full object-contain transition group-hover:scale-105" />
          ) : null}
        </div>
        <span className="mt-3 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
          {product.categoryName || 'San pham'}
        </span>
        <h3 className="mt-2 line-clamp-2 min-h-[40px] text-sm font-semibold text-slate-900">{product.productName}</h3>
        {product.shopName && <p className="mt-1 text-xs text-slate-500">{product.shopName}</p>}
        <p className="mt-2 text-lg font-extrabold text-blue-600">{formatPrice(displayPrice)}</p>
        {product.averageRating > 0 && (
          <p className="mt-1 text-xs text-amber-600">★ {product.averageRating?.toFixed?.(1) || product.averageRating}</p>
        )}
        {typeof product.imageSimilarity === 'number' && (
          <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
            Trung anh {(product.imageSimilarity * 100).toFixed(1)}%
          </p>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onAddToCart?.(product)
        }}
        className="mt-3 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
      >
        Them vao gio
      </button>
    </article>
  )
}
