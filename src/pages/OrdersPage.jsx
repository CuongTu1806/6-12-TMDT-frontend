import { useEffect, useState } from 'react'
import { MarketHeader } from '../components/MarketHeader'
import { getBuyerOrders, cancelBuyerOrder, createReview, BUYER_ORDER_TABS } from '../services/buyerApi'

const formatPrice = (p) => `${Number(p || 0).toLocaleString('vi-VN')}₫`

export function OrdersPage({
  session,
  cartCount,
  searchKeyword,
  searchSuggestions,
  onGoHome,
  onOpenAuth,
  onLogout,
  onOpenSeller,
  onOpenAdmin,
  onOpenCart,
  onOpenOrders,
  onSearchProducts,
  onRequestSearchSuggestions,
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewForms, setReviewForms] = useState({})
  const [submittingReviews, setSubmittingReviews] = useState({})
  const [expandedOrders, setExpandedOrders] = useState([])

  const canReviewOrder = (status) => status === 3 || status === 5
  const getReviewKey = (orderId, productId, idx) => `${orderId}-${productId ?? 'unknown'}-${idx}`
  const hasPersistedReview = (item) => Boolean(item?.reviewId)

  useEffect(() => {
    if (!session?.token) {
      onOpenAuth?.('orders')
      return
    }
    loadOrders(activeTab)
  }, [session?.token, activeTab])

  const loadOrders = async (tabKey) => {
    const tab = BUYER_ORDER_TABS.find((t) => t.key === tabKey) || BUYER_ORDER_TABS[0]
    setLoading(true)
    try {
      const result = await getBuyerOrders(tab.status, 0, 50)
      setOrders(result.content || [])
    } catch (e) {
      onNotify?.('error', e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (orderId) => {
    if (!window.confirm('Huy don hang nay?')) return
    try {
      await cancelBuyerOrder(orderId)
      onNotify?.('success', 'Da huy don hang')
      loadOrders(activeTab)
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  const handleReview = async (order, item, idx) => {
    const productId = item?.productId
    const key = getReviewKey(order.orderId, productId, idx)

    if (!productId) {
      onNotify?.('error', 'Khong tim thay san pham de danh gia')
      return
    }

    if (!canReviewOrder(order.status)) {
      onNotify?.('error', 'Chi duoc danh gia don da giao hoac hoan thanh')
      return
    }

    const form = reviewForms[key]
    if (!form?.star) {
      onNotify?.('error', 'Vui long chon so sao')
      return
    }

    setSubmittingReviews((s) => ({ ...s, [key]: true }))
    try {
      await createReview({
        orderId: order.orderId,
        productId,
        star: Number(form.star),
        content: form.content || '',
      })
      onNotify?.('success', 'Danh gia thanh cong')
      await loadOrders(activeTab)
    } catch (e) {
      onNotify?.('error', e.message)
    } finally {
      setSubmittingReviews((s) => ({ ...s, [key]: false }))
    }
  }

  if (!session?.token) {
    return (
      <div className="min-h-screen bg-[#f2f4f8] p-8 text-center">
        <p>Dang nhap de xem don mua</p>
        <button type="button" onClick={() => onOpenAuth?.('orders')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white">Dang nhap</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <MarketHeader session={session} cartCount={cartCount} searchKeyword={searchKeyword} searchSuggestions={searchSuggestions} onGoHome={onGoHome} onOpenCart={onOpenCart} onOpenAuth={onOpenAuth} onLogout={onLogout} onOpenSeller={onOpenSeller} onOpenAdmin={onOpenAdmin} onOpenOrders={onOpenOrders} onSearchProducts={onSearchProducts} onRequestSearchSuggestions={onRequestSearchSuggestions} />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Don mua cua toi</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {BUYER_ORDER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'border border-slate-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-6 text-slate-500">Dang tai...</p>
        ) : orders.length === 0 ? (
          <p className="mt-8 text-center text-slate-500">Khong co don hang</p>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div key={order.orderId} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-bold">{order.orderCode}</p>
                    <p className="text-sm text-slate-600">{order.shopName}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{order.statusLabel}</span>
                    <p className="mt-1 font-bold text-emerald-600">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>
                <div className="mt-3 border-t pt-3 text-sm">
                  <button type="button" onClick={() => setExpandedOrders((prev) => prev.includes(order.orderId) ? prev.filter((id) => id !== order.orderId) : [...prev, order.orderId])} className="text-sm font-semibold text-blue-600">
                    {expandedOrders.includes(order.orderId) ? 'Thu gon chi tiet' : 'Xem chi tiet don hang'}
                  </button>

                  {expandedOrders.includes(order.orderId) ? (
                    <div className="mt-3 space-y-3">
                      {(order.items || []).map((item) => (
                        <div key={item.productId} className="flex items-center gap-3">
                          {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-16 w-16 rounded object-cover" /> : <div className="h-16 w-16 rounded bg-slate-100" />}
                          <div className="flex-1">
                            <p className="font-semibold">{item.productName}</p>
                            {item.variantLabel ? <p className="text-xs text-slate-500">Phien ban: {item.variantLabel}</p> : null}
                            <p className="text-sm text-slate-700">So luong: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(item.lineTotal)}</p>
                            <p className="text-xs text-slate-500">({formatPrice(item.priceAtPurchase)}/cai)</p>
                          </div>
                        </div>
                      ))}

                      <div className="mt-2 text-sm">
                        <div>Tong: <span className="font-bold">{formatPrice(order.subtotal || order.items?.reduce((s,i)=>s+(i.priceAtPurchase||0)*i.quantity,0))}</span></div>
                        {order.discountAmount > 0 && (
                          <div>Giam: <span className="font-bold text-rose-600">{formatPrice(order.discountAmount)}</span></div>
                        )}
                        <div className="mt-1">Phai tra: <span className="font-bold text-emerald-600">{formatPrice(order.totalAmount)}</span></div>
                        {order.voucherCode && (
                          <div className="mt-1 text-xs text-slate-600">Voucher: {order.voucherCode}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-1">
                      {(order.items || []).map((item, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{item.productName} x{item.quantity}</span>
                          <span>{formatPrice(item.priceAtPurchase)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.status === 0 && (
                    <button type="button" onClick={() => handleCancel(order.orderId)} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600">
                      Huy don
                    </button>
                  )}
                  {canReviewOrder(order.status) && (order.items || []).map((item, idx) => {
                    const reviewKey = getReviewKey(order.orderId, item.productId, idx)
                    const form = reviewForms[reviewKey] || {}
                    const isSubmitting = Boolean(submittingReviews[reviewKey])
                    const isReviewed = hasPersistedReview(item)
                    const reviewText = item?.reviewContent || ''
                    const reviewStar = item?.reviewStar || 0
                    const reviewDate = item?.reviewCreatedAt
                      ? new Date(item.reviewCreatedAt).toLocaleDateString('vi-VN')
                      : ''

                    return (
                    <div key={reviewKey} className="mt-2 w-full rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-semibold">Danh gia: {item.productName}</p>
                      {isReviewed ? (
                        <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                          <p className="font-semibold text-emerald-700">Ban da danh gia {reviewDate ? `(${reviewDate})` : ''}</p>
                          <p className="mt-1 text-amber-600">{'★'.repeat(reviewStar)}{'☆'.repeat(Math.max(0, 5 - reviewStar))}</p>
                          <p className="mt-1 text-slate-700">{reviewText || 'Khong co nhan xet'}</p>
                        </div>
                      ) : (
                        <>
                          <div className="mt-2 flex gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setReviewForms((f) => ({ ...f, [reviewKey]: { ...f[reviewKey], star: s } }))}
                                className={`text-lg ${form?.star >= s ? 'text-amber-500' : 'text-slate-300'} ${isSubmitting ? 'cursor-not-allowed opacity-60' : ''}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Nhan xet..."
                            value={form?.content || ''}
                            disabled={isSubmitting}
                            className="mt-2 w-full rounded border px-2 py-1 text-sm"
                            onChange={(e) => setReviewForms((f) => ({ ...f, [reviewKey]: { ...f[reviewKey], content: e.target.value } }))}
                          />
                          <button
                            type="button"
                            disabled={isSubmitting || !form?.star}
                            onClick={() => handleReview(order, item, idx)}
                            className={`mt-2 text-xs font-semibold ${isSubmitting || !form?.star ? 'text-slate-400' : 'text-blue-600'}`}
                          >
                            {isSubmitting ? 'Dang gui...' : 'Gui danh gia'}
                          </button>
                        </>
                      )}
                    </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
