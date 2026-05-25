import { useEffect, useState } from 'react'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { ProductCard } from '../components/ProductCard'
import { MarketHeader } from '../components/MarketHeader'
import { getProductDetail, getProductReviews, getProductsByShop } from '../services/catalogApi'
import { previewVoucher } from '../services/buyerApi'
import { parseProductAttributes } from '../utils/productVariants'

const formatPrice = (p) => `${Number(p || 0).toLocaleString('vi-VN')}₫`

export function ProductDetailPage({
  productId,
  session,
  cartCount,
  searchKeyword,
  searchSuggestions,
  onBack,
  onGoHome,
  onOpenAuth,
  onLogout,
  onOpenSeller,
  onOpenAdmin,
  onOpenCart,
  onOpenOrders,
  onSearchProducts,
  onRequestSearchSuggestions,
  onAddToCart,
  onOpenShop,
  onOpenProduct,
  onOpenCheckout,
  onNotify,
}) {
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [shopProducts, setShopProducts] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [selectedVariantLabel, setSelectedVariantLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [voucherCode, setVoucherCode] = useState('')
  const [discountInfo, setDiscountInfo] = useState({ amount: 0, finalPrice: null })
  const [voucherError, setVoucherError] = useState('')

  const productAttributes = parseProductAttributes(product?.attributes)
  const selectedVariant = productAttributes.variants.find((variant) => variant.label === selectedVariantLabel) || null
  const displayPrice = selectedVariant?.price > 0 ? selectedVariant.price : Number(product?.price || 0)
  const displayStock = selectedVariant?.stockQuantity > 0 ? selectedVariant.stockQuantity : Number(product?.stockQuantity || 0)

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

        if (detail?.shopId) {
          const shopResult = await getProductsByShop(detail.shopId, 0, 8)
          const relatedProducts = (shopResult?.content || []).filter((p) => p.productId !== detail.productId)
          setShopProducts(relatedProducts)
        } else {
          setShopProducts([])
        }

        const attributes = parseProductAttributes(detail?.attributes)
        setSelectedVariantLabel(attributes.variants[0]?.label || '')
        setQuantity(1)
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
    onAddToCart?.(product, quantity, selectedVariant)
  }

  const handleApplyVoucher = async () => {
    if (!voucherCode) {
      setVoucherError('Vui long nhap ma voucher')
      setDiscountInfo({ amount: 0, finalPrice: null })
      return
    }
    setVoucherError('')
    const total = (selectedVariant?.price || product.price) * quantity
    try {
      const result = await previewVoucher({
        shopId: product.shopId,
        voucherCode,
        subtotal: total,
      })

      if (!result?.valid) {
        setDiscountInfo({ amount: 0, finalPrice: null })
        setVoucherError((result?.message || '').toLowerCase().includes('khong hop le') ? 'Ma khong hop le' : (result?.message || 'Ma khong hop le'))
        onNotify?.('error', result?.message || 'Voucher khong hop le')
        return
      }

      setDiscountInfo({
        amount: result.discountAmount || 0,
        finalPrice: result.finalAmount ?? total,
      })
      setVoucherError('')
      onNotify?.('success', result?.message || 'Ap dung voucher thanh cong')
    } catch (e) {
      setDiscountInfo({ amount: 0, finalPrice: null })
      setVoucherError((e.message || '').toLowerCase().includes('khong hop le') ? 'Ma khong hop le' : (e.message || 'Ma khong hop le'))
      onNotify?.('error', e.message)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    try {
      const res = await onAddToCart?.(product, quantity, selectedVariant)
      // If user is not logged in, trigger auth flow to checkout
      if (!session?.token) {
        onOpenAuth?.('checkout')
        return
      }

      // If backend returned cart info with cartItemId, navigate to checkout with that id
      const cartItemId = res?.items?.length ? res.items[res.items.length - 1]?.cartItemId : res?.cartItemId || null
      if (cartItemId) {
        onOpenCheckout?.(product.shopId, [cartItemId], voucherCode || '')
      } else {
        // fallback: open checkout for shop (no specific item ids)
        onOpenCheckout?.(product.shopId, [], voucherCode || '')
      }
    } catch (e) {
      onNotify?.('error', e.message || 'Khong the mua ngay')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f4f8]">
        <MarketHeader session={session} cartCount={cartCount} searchKeyword={searchKeyword} searchSuggestions={searchSuggestions} onGoHome={onGoHome} onOpenCart={onOpenCart} onOpenAuth={onOpenAuth} onLogout={onLogout} onOpenSeller={onOpenSeller} onOpenAdmin={onOpenAdmin} onOpenOrders={onOpenOrders} onSearchProducts={onSearchProducts} onRequestSearchSuggestions={onRequestSearchSuggestions} />
        <p className="p-8 text-center text-slate-500">Dang tai san pham...</p>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <MarketHeader session={session} cartCount={cartCount} searchKeyword={searchKeyword} searchSuggestions={searchSuggestions} onGoHome={onGoHome} onOpenCart={onOpenCart} onOpenAuth={onOpenAuth} onLogout={onLogout} onOpenSeller={onOpenSeller} onOpenAdmin={onOpenAdmin} onOpenOrders={onOpenOrders} onSearchProducts={onSearchProducts} onRequestSearchSuggestions={onRequestSearchSuggestions} />

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

            <p className="text-3xl font-black text-blue-600">{formatPrice(displayPrice)}</p>

            {productAttributes.variants.length > 0 && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-700">Chon phien ban</p>
                <div className="flex flex-wrap gap-2">
                  {productAttributes.variants.map((variant) => {
                    const active = variant.label === selectedVariantLabel
                    return (
                      <button
                        type="button"
                        key={variant.label}
                        onClick={() => {
                          setSelectedVariantLabel(variant.label)
                          setQuantity(1)
                        }}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {variant.label} · {formatPrice(variant.price || product.price)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {product.averageRating > 0 && (
              <p className="text-sm text-amber-600">★ {product.averageRating?.toFixed?.(1)} · Da ban {product.salesCount || 0}</p>
            )}

            <p className="text-sm text-slate-600">
              Ton kho: <span className="font-semibold">{displayStock}</span>
            </p>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{product.description || 'Chua co mo ta.'}</p>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <label htmlFor="product-quantity" className="text-sm font-semibold">So luong:</label>
              <input
                id="product-quantity"
                type="number"
                min={1}
                max={displayStock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(displayStock, Number(e.target.value) || 1)))}
                className="w-20 rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={displayStock <= 0}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <ShoppingCart size={18} /> Them vao gio hang
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={displayStock <= 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  Mua ngay
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ma voucher (VD: SALE10 or FIXED20000)"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value.trim())
                      if (voucherError) setVoucherError('')
                    }}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={handleApplyVoucher} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Ap dung</button>
                </div>
                {voucherError && <p className="mt-2 text-sm font-semibold text-rose-600">{voucherError}</p>}
                {discountInfo.amount > 0 && (
                  <div className="mt-3 text-sm">
                    <div>Giam: <span className="font-bold text-rose-600">{formatPrice(discountInfo.amount)}</span></div>
                    <div>Tong sau giam: <span className="font-bold text-emerald-600">{formatPrice(discountInfo.finalPrice)}</span></div>
                  </div>
                )}
              </div>
            </div>
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

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">San pham khac cua shop</h2>
            {product.shopName && (
              <button type="button" onClick={() => onOpenShop?.(product.shopId)} className="text-sm font-semibold text-blue-600 hover:underline">
                Xem shop
              </button>
            )}
          </div>

          {shopProducts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Shop nay chua co them san pham khac</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {shopProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.productId}
                  product={relatedProduct}
                  onClick={() => onOpenProduct?.(relatedProduct.productId)}
                  onAddToCart={() => onAddToCart?.(relatedProduct, 1, null)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
