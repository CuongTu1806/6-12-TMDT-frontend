import { useEffect, useMemo, useState } from 'react'
import { MarketHeader } from '../components/MarketHeader'
import { getProductImageUrl } from '../utils/image'
import { getCart, updateCartItem, removeCartItem } from '../services/buyerApi'
import { getGuestCart, updateGuestCartItem, removeFromGuestCart, groupGuestCartByShop } from '../services/guestCart'

const formatPrice = (p) => `${Number(p || 0).toLocaleString('vi-VN')}₫`

export function CartPage({
  session,
  cartCount,
  searchKeyword,
  searchSuggestions,
  onGoHome,
  onOpenAuth,
  onLogout,
  onOpenSeller,
  onOpenAdmin,
  onOpenOrders,
  onOpenCart,
  onSearchProducts,
  onRequestSearchSuggestions,
  onOpenCheckout,
  onCartUpdated,
  onNotify,
}) {
  const [cart, setCart] = useState(null)
  const [guestItems, setGuestItems] = useState([])
  const [selectedCartItemIds, setSelectedCartItemIds] = useState([])
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

  useEffect(() => {
    if (!isLoggedIn) {
      setSelectedCartItemIds([])
      return
    }

    const validIds = new Set((cart?.items || []).map((item) => String(item.cartItemId)))
    setSelectedCartItemIds((prev) => prev.filter((id) => validIds.has(id)))
  }, [cart, isLoggedIn])

  const guestGroups = useMemo(() => groupGuestCartByShop(guestItems), [guestItems])

  const getItemSelectionKey = (item) => String(item.cartItemId || item.cartItemKey)

  const isItemSelected = (item) => selectedCartItemIds.includes(getItemSelectionKey(item))

  const toggleItemSelected = (item) => {
    if (!isLoggedIn) return

    const key = String(item.cartItemId)
    setSelectedCartItemIds((prev) => (
      prev.includes(key)
        ? prev.filter((id) => id !== key)
        : [...prev, key]
    ))
  }

  const toggleShopSelected = (group) => {
    if (!isLoggedIn) return

    const keys = group.items.map((item) => String(item.cartItemId))
    const allSelected = keys.length > 0 && keys.every((key) => selectedCartItemIds.includes(key))

    setSelectedCartItemIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !keys.includes(id))
      }

      const next = new Set(prev)
      keys.forEach((key) => next.add(key))
      return Array.from(next)
    })
  }

  const handleUpdateQty = async (item, quantity) => {
    try {
      if (isLoggedIn) {
        await updateCartItem(item.cartItemId, quantity)
      } else {
        updateGuestCartItem(item.cartItemKey, quantity)
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
        removeFromGuestCart(item.cartItemKey)
      }
      await loadCart()
      onNotify?.('success', 'Da xoa khoi gio')
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  const renderItem = (item, keyPrefix) => {
    const itemKey = String(item.cartItemId || item.cartItemKey)

    return (
      <div key={`${keyPrefix}-${itemKey}`} className="flex gap-4 border-b border-slate-100 py-4 last:border-0">
        {isLoggedIn ? (
          <div className="mt-2 flex shrink-0 items-start">
            <input
              type="checkbox"
              aria-label={`Chon san pham ${item.productName}`}
              checked={isItemSelected(item)}
              onChange={() => toggleItemSelected(item)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        ) : null}

        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {item.imageUrl && <img src={getProductImageUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" />}
        </div>

        <div className="flex-1">
          <p className="font-semibold text-slate-900">{item.productName}</p>
          {item.variantLabel ? <p className="text-xs text-slate-500">Phien ban: {item.variantLabel}</p> : null}
          <p className="text-sm text-blue-600">{formatPrice(item.price || item.variantPrice)}</p>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={() => handleUpdateQty(item, item.quantity - 1)} className="rounded border px-2 py-1 text-sm">-</button>
            <span className="text-sm font-semibold">{item.quantity}</span>
            <button type="button" onClick={() => handleUpdateQty(item, item.quantity + 1)} className="rounded border px-2 py-1 text-sm">+</button>
            <button type="button" onClick={() => handleRemove(item)} className="ml-auto text-xs text-rose-600">Xoa</button>
          </div>
        </div>

        <p className="font-bold text-slate-900">{formatPrice((item.price || item.variantPrice || 0) * item.quantity)}</p>
      </div>
    )
  }

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
  const isEmptyCart = Object.keys(groups).length === 0
  const selectedItems = isLoggedIn
    ? (cart?.items || []).filter((item) => selectedCartItemIds.includes(String(item.cartItemId)))
    : guestItems
  const selectedShopCount = isLoggedIn ? new Set(selectedItems.map((item) => item.shopId)).size : 0
  const total = isLoggedIn
    ? selectedItems.reduce((sum, item) => sum + (item.price || item.variantPrice || 0) * item.quantity, 0)
    : guestItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0)

  let mainContent
  if (loading) {
    mainContent = <p className="mt-6 text-slate-500">Dang tai...</p>
  } else if (isEmptyCart) {
    mainContent = (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-slate-600">Gio hang trong</p>
        <button type="button" onClick={onGoHome} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Tiep tuc mua sam
        </button>
      </div>
    )
  } else {
    mainContent = (
      <div className="mt-6 space-y-6">
        {Object.values(groups).map((group) => (
          <div key={group.shopId} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3 font-bold">
                {isLoggedIn ? (
                  <input
                    type="checkbox"
                    aria-label={`Chon tat ca san pham cua ${group.shopName || 'shop'}`}
                    checked={group.items.length > 0 && group.items.every((item) => selectedCartItemIds.includes(String(item.cartItemId)))}
                    onChange={() => toggleShopSelected(group)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                ) : null}
                <span>{group.shopName || 'Shop'}</span>
              </div>
              {isLoggedIn && (
                <button
                  type="button"
                  disabled={selectedItems.filter((item) => item.shopId === group.shopId).length === 0}
                  onClick={() => {
                    const selectedIds = selectedItems
                      .filter((item) => item.shopId === group.shopId)
                      .map((item) => item.cartItemId)

                    if (selectedIds.length === 0) {
                      onNotify?.('error', 'Hay tick san pham muon dat trong shop nay')
                      return
                    }
                    onOpenCheckout?.(group.shopId, selectedIds)
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
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
            <span>Tong da chon</span>
            <span className="text-blue-600">{formatPrice(total)}</span>
          </div>
          {isLoggedIn ? (
            <>
              <p className="mt-2 text-sm text-slate-500">
                Da chon {selectedItems.length} san pham trong {selectedShopCount} shop
              </p>
              <button
                type="button"
                disabled={selectedItems.length === 0}
                onClick={() => {
                  if (selectedItems.length === 0) {
                    onNotify?.('error', 'Hay chon san pham muon thanh toan')
                    return
                  }
                  onOpenCheckout?.(null, selectedItems.map((item) => item.cartItemId))
                }}
                className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Thanh toan tong
              </button>
            </>
          ) : null}
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
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <MarketHeader session={session} cartCount={cartCount} searchKeyword={searchKeyword} searchSuggestions={searchSuggestions} onGoHome={onGoHome} onOpenCart={onOpenCart} onOpenAuth={onOpenAuth} onLogout={onLogout} onOpenSeller={onOpenSeller} onOpenAdmin={onOpenAdmin} onOpenOrders={onOpenOrders} onSearchProducts={onSearchProducts} onRequestSearchSuggestions={onRequestSearchSuggestions} />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Gio hang</h1>
        {mainContent}
      </div>
    </div>
  )
}
