import { useEffect, useState } from 'react'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { MarketHeader } from '../components/MarketHeader'
import { getProductDetail, getProductReviews } from '../services/catalogApi'

const formatPrice = (p) => `${Number(p || 0).toLocaleString('vi-VN')}₫`

export function ProductDetailPage({
  productId,
  session,
  cartCount,
  onBack,
  onGoHome,
  onOpenAuth,
  onLogout,
  onOpenSeller,
  onOpenCart,
  onOpenOrders,
  onAddToCart,
  onOpenShop,
  onNotify,
}) {
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [detail, reviewList] = await Promise.all([
          getProductDetail(productId),
          getProductReviews(productId),
        ])
        setProduct(detail)
        setReviews(reviewList)
      } catch (e) {
        onNotify?.('error', e.message)
        onBack?.()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productId])

  const handleAddToCart = () => {
    if (!product) return
    onAddToCart?.(product, quantity)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f4f8]">
        <MarketHeader session={session} cartCount={cartCount} onGoHome={onGoHome} onOpenCart={onOpenCart} onOpenAuth={onOpenAuth} onLogout={onLogout} onOpenSeller={onOpenSeller} onOpenOrders={onOpenOrders} />
        <p className="p-8 text-center text-slate-500">Dang tai san pham...</p>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <MarketHeader session={session} cartCount={cartCount} onGoHome={onGoHome} onOpenCart={onOpenCart} onOpenAuth={onOpenAuth} onLogout={onLogout} onOpenSeller={onOpenSeller} onOpenOrders={onOpenOrders} />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600">
          <ArrowLeft size={16} /> Quay lai
        </button>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.productName} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-slate-100 text-slate-400">Chua co hinh anh</div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              {product.categoryName && (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">{product.categoryName}</span>
              )}
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">{product.productName}</h1>
              {product.shopName && (
                <button type="button" onClick={() => onOpenShop?.(product.shopId)} className="mt-1 text-sm font-semibold text-blue-600 hover:underline">
                  Shop: {product.shopName}
                </button>
              )}
            </div>

            <p className="text-3xl font-black text-blue-600">{formatPrice(product.price)}</p>

            {product.averageRating > 0 && (
              <p className="text-sm text-amber-600">★ {product.averageRating?.toFixed?.(1)} · Da ban {product.salesCount || 0}</p>
            )}

            <p className="text-sm text-slate-600">Ton kho: <span className="font-semibold">{product.stockQuantity}</span></p>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{product.description || 'Chua co mo ta.'}</p>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <label className="text-sm font-semibold">So luong:</label>
              <input
                type="number"
                min={1}
                max={product.stockQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stockQuantity, Number(e.target.value) || 1)))}
                className="w-20 rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
            >
              <ShoppingCart size={18} /> Them vao gio hang
            </button>
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold">Danh gia ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Chua co danh gia nao</p>
          ) : (
            <div className="mt-4 space-y-4">
              {reviews.map((r) => (
                <div key={r.reviewId} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{r.buyerName}</p>
                    <span className="text-amber-500">{'★'.repeat(r.star)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{r.content}</p>
                  {r.shopReply && (
                    <p className="mt-2 rounded-lg bg-blue-50 p-2 text-sm text-blue-800">Shop: {r.shopReply}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
