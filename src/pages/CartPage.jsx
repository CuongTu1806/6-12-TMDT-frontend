import { useEffect, useMemo, useState } from 'react'
import { MarketHeader } from '../components/MarketHeader'
import { getCart, updateCartItem, removeCartItem } from '../services/buyerApi'
import { getGuestCart, updateGuestCartItem, removeFromGuestCart, groupGuestCartByShop } from '../services/guestCart'

const formatPrice = (p) => `${Number(p || 0).toLocaleString('vi-VN')}₫`

export function CartPage({
  session,
  cartCount,
  onGoHome,
  onOpenAuth,
  onLogout,
  onOpenSeller,
  onOpenOrders,
  onOpenCart,
  onOpenCheckout,
  onCartUpdated,
  onNotify,
}) {
  const [cart, setCart] = useState(null)
  const [guestItems, setGuestItems] = useState([])
  const [loading, setLoading] = useState(true)

  const isLoggedIn = Boolean(session?.token)

  const loadCart = async () => {
    setLoading(true)
    try {
      if (isLoggedIn) {
        const data = await getCart()
        setCart(data)
        setGuestItems([])
      } else {
        const items = getGuestCart()
        setGuestItems(items)
        setCart(null)
      }
      onCartUpdated?.()
    } catch (e) {
      onNotify?.('error', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [session?.token])

  const guestGroups = useMemo(() => groupGuestCartByShop(guestItems), [guestItems])

  const handleUpdateQty = async (item, quantity) => {
    try {
      if (isLoggedIn) {
        await updateCartItem(item.cartItemId, quantity)
      } else {
        updateGuestCartItem(item.productId, quantity)
      }
      await loadCart()
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  const handleRemove = async (item) => {
    try {
      if (isLoggedIn) {
        await removeCartItem(item.cartItemId)
      } else {
        removeFromGuestCart(item.productId)
      }
      await loadCart()
      onNotify?.('success', 'Da xoa khoi gio')
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  const renderItem = (item, keyPrefix) => (
    <div key={`${keyPrefix}-${item.cartItemId || item.productId}`} className="flex gap-4 border-b border-slate-100 py-4 last:border-0">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{item.productName}</p>
        <p className="text-sm text-blue-600">{formatPrice(item.price)}</p>
        <div className="mt-2 flex items-center gap-2">
          <button type="button" onClick={() => handleUpdateQty(item, item.quantity - 1)} className="rounded border px-2 py-1 text-sm">-</button>
          <span className="text-sm font-semibold">{item.quantity}</span>
          <button type="button" onClick={() => handleUpdateQty(item, item.quantity + 1)} className="rounded border px-2 py-1 text-sm">+</button>
          <button type="button" onClick={() => handleRemove(item)} className="ml-auto text-xs text-rose-600">Xoa</button>
        </div>
      </div>
      <p className="font-bold text-slate-900">{formatPrice((item.price || 0) * item.quantity)}</p>
    </div>
  )

  const loggedInGroups = useMemo(() => {
    if (!cart?.items) return {}
    return cart.items.reduce((groups, item) => {
      const sid = item.shopId || 'unknown'
      if (!groups[sid]) groups[sid] = { shopId: item.shopId, shopName: item.shopName, items: [] }
      groups[sid].items.push(item)
      return groups
    }, {})
  }, [cart])

  const groups = isLoggedIn ? loggedInGroups : guestGroups
  const total = isLoggedIn
    ? cart?.totalAmount || 0
    : guestItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0)

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <MarketHeader session={session} cartCount={cartCount} onGoHome={onGoHome} onOpenCart={onOpenCart} onOpenAuth={onOpenAuth} onLogout={onLogout} onOpenSeller={onOpenSeller} onOpenOrders={onOpenOrders} />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Gio hang</h1>

        {loading ? (
          <p className="mt-6 text-slate-500">Dang tai...</p>
        ) : Object.keys(groups).length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-600">Gio hang trong</p>
            <button type="button" onClick={onGoHome} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Tiep tuc mua sam
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {Object.values(groups).map((group) => (
              <div key={group.shopId} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between border-b pb-3">
                  <p className="font-bold">{group.shopName || 'Shop'}</p>
                  {isLoggedIn && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!session?.token) {
                          onOpenAuth?.('checkout')
                          return
                        }
                        onOpenCheckout?.(group.shopId)
                      }}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white"
                    >
                      Dat hang shop nay
                    </button>
                  )}
                </div>
                {group.items.map((item) => renderItem(item, group.shopId))}
              </div>
            ))}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Tong tam tinh</span>
                <span className="text-blue-600">{formatPrice(total)}</span>
              </div>
              {!isLoggedIn && (
                <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold">Dang xem voi tu cach khach</p>
                  <p className="mt-1">Vui long dang nhap de dat hang va theo doi don mua.</p>
                  <button type="button" onClick={() => onOpenAuth?.('cart')} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                    Dang nhap de dat hang
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
