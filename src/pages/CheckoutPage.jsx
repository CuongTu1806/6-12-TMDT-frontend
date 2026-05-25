import { useEffect, useMemo, useState } from 'react'
import { CreditCard, MapPin, Ticket, Truck } from 'lucide-react'
import { MarketHeader } from '../components/MarketHeader'
import { checkout, getAddresses, createAddress, getCart, previewVoucher } from '../services/buyerApi'

const formatPrice = (p) => `${Number(p || 0).toLocaleString('vi-VN')}₫`
const SHIPPING_FEE = 30000

function getShopKey(shopId) {
  return String(shopId ?? 'unknown')
}

function groupCheckoutItems(items) {
  return Object.values(items.reduce((groups, item) => {
    const shopKey = getShopKey(item.shopId)
    if (!groups[shopKey]) {
      groups[shopKey] = {
        shopKey,
        shopId: item.shopId,
        shopName: item.shopName || 'Shop',
        items: [],
        subtotal: 0,
      }
    }

    groups[shopKey].items.push(item)
    groups[shopKey].subtotal += Number(item.lineTotal || 0)
    return groups
  }, {}))
}

export function CheckoutPage({
  shopId,
  selectedCartItemIds = [],
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
  onOrderPlaced,
  initialVoucherCode = '',
  onNotify,
}) {
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [checkoutItems, setCheckoutItems] = useState([])
  const [voucherCodes, setVoucherCodes] = useState({})
  const [discountInfoByShop, setDiscountInfoByShop] = useState({})
  const [voucherErrors, setVoucherErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    city: '', district: '', commune: '', detail: '', receiverName: '', receiverPhone: '', isDefault: 1,
  })

  const shippingOptions = [
    { id: 'standard', label: 'Giao hang tieu chuan', eta: 'Du kien nhan hang 3-5 ngay', fee: SHIPPING_FEE },
    { id: 'express', label: 'Giao hang nhanh', eta: 'Sap mo', fee: 55000, disabled: true },
  ]

  useEffect(() => {
    if (!session?.token) {
      onOpenAuth?.('checkout')
      return
    }

    const load = async () => {
      try {
        const [addrList, cart] = await Promise.all([getAddresses(), getCart()])
        setAddresses(addrList || [])

        const defaultAddr = (addrList || []).find((a) => a.isDefault === 1) || (addrList || [])[0]
        if (defaultAddr) {
          setSelectedAddressId(String(defaultAddr.addressId))
        }

        const selectedIds = new Set(selectedCartItemIds.map((itemId) => String(itemId)))
        const items = (cart?.items || []).filter((item) => {
          if (shopId !== null && shopId !== undefined && item.shopId !== shopId) {
            return false
          }

          if (selectedCartItemIds.length === 0) {
            return true
          }

          return selectedIds.has(String(item.cartItemId))
        })

        setCheckoutItems(items)
        setDiscountInfoByShop({})
        setVoucherErrors({})
        setVoucherCodes((prev) => {
          const next = { ...prev }
          const groups = groupCheckoutItems(items)

          groups.forEach((group, index) => {
            if (next[group.shopKey] == null) {
              next[group.shopKey] = index === 0 && initialVoucherCode ? initialVoucherCode.toUpperCase() : ''
            }
          })

          return next
        })
      } catch (e) {
        onNotify?.('error', e.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [session?.token, shopId, selectedCartItemIds.join(','), initialVoucherCode])

  useEffect(() => {
    if (!initialVoucherCode) {
      return
    }

    setVoucherCodes((prev) => {
      const keys = Object.keys(prev)
      if (keys.length === 0) {
        return prev
      }

      const next = { ...prev }
      next[keys[0]] = initialVoucherCode.toUpperCase()
      return next
    })
  }, [initialVoucherCode])

  const checkoutGroups = useMemo(() => groupCheckoutItems(checkoutItems).map((group) => {
    const discountInfo = discountInfoByShop[group.shopKey] || { amount: 0, finalPrice: null }
    const voucherCode = voucherCodes[group.shopKey] || ''
    const voucherError = voucherErrors[group.shopKey] || ''

    return {
      ...group,
      voucherCode,
      voucherError,
      discountInfo,
      shippingFee: SHIPPING_FEE,
      totalPayable: discountInfo.finalPrice === null ? group.subtotal + SHIPPING_FEE : discountInfo.finalPrice,
    }
  }), [checkoutItems, discountInfoByShop, voucherCodes, voucherErrors])

  const grandSubtotal = checkoutGroups.reduce((sum, group) => sum + group.subtotal, 0)
  const grandShippingFee = checkoutGroups.length * SHIPPING_FEE
  const grandDiscount = checkoutGroups.reduce((sum, group) => sum + Number(group.discountInfo.amount || 0), 0)
  const grandTotal = checkoutGroups.reduce((sum, group) => sum + group.totalPayable, 0)
  const totalItems = checkoutGroups.reduce((sum, group) => sum + group.items.length, 0)
  const selectedShipping = shippingOptions.find((option) => option.id === shippingMethod) || shippingOptions[0]
  const selectedAddress = addresses.find((addr) => String(addr.addressId) === selectedAddressId) || null

  const handleCreateAddress = async (e) => {
    e.preventDefault()
    try {
      const created = await createAddress(addressForm)
      setAddresses((prev) => [created, ...prev])
      setSelectedAddressId(String(created.addressId))
      setShowAddressForm(false)
      onNotify?.('success', 'Them dia chi thanh cong')
    } catch (err) {
      onNotify?.('error', err.message)
    }
  }

  const handleApplyVoucher = async (group) => {
    const code = (voucherCodes[group.shopKey] || '').trim().toUpperCase()

    if (!code) {
      setVoucherErrors((prev) => ({ ...prev, [group.shopKey]: 'Vui long nhap ma voucher' }))
      setDiscountInfoByShop((prev) => ({ ...prev, [group.shopKey]: { amount: 0, finalPrice: null } }))
      return
    }

    setVoucherErrors((prev) => ({ ...prev, [group.shopKey]: '' }))
    try {
      const result = await previewVoucher({
        shopId: group.shopId,
        voucherCode: code,
        subtotal: group.subtotal,
      })

      if (!result?.valid) {
        setDiscountInfoByShop((prev) => ({ ...prev, [group.shopKey]: { amount: 0, finalPrice: null } }))
        setVoucherErrors((prev) => ({
          ...prev,
          [group.shopKey]: (result?.message || '').toLowerCase().includes('khong hop le')
            ? 'Ma khong hop le'
            : (result?.message || 'Ma khong hop le'),
        }))
        onNotify?.('error', result?.message || 'Voucher khong hop le')
        return
      }

      setDiscountInfoByShop((prev) => ({
        ...prev,
        [group.shopKey]: {
          amount: result.discountAmount || 0,
          finalPrice: result.totalPayable ?? ((result.finalAmount ?? group.subtotal) + SHIPPING_FEE),
        },
      }))
      setVoucherErrors((prev) => ({ ...prev, [group.shopKey]: '' }))
      onNotify?.('success', result?.message || 'Ap dung voucher thanh cong')
    } catch (e) {
      setDiscountInfoByShop((prev) => ({ ...prev, [group.shopKey]: { amount: 0, finalPrice: null } }))
      setVoucherErrors((prev) => ({
        ...prev,
        [group.shopKey]: (e.message || '').toLowerCase().includes('khong hop le') ? 'Ma khong hop le' : (e.message || 'Ma khong hop le'),
      }))
      onNotify?.('error', e.message)
    }
  }

  const submitCheckoutGroup = async (group) => {
    const order = await checkout({
      shopId: group.shopId,
      addressId: Number(selectedAddressId),
      paymentMethod,
      voucherCode: voucherCodes[group.shopKey] || undefined,
      selectedCartItemIds: group.items.map((item) => item.cartItemId),
    })

    onNotify?.('success', `Dat hang shop ${group.shopName} thanh cong! Ma don: ${order.orderCode}`)
    return order
  }

  const handleCheckoutGroup = async (group) => {
    if (!selectedAddressId) {
      onNotify?.('error', 'Vui long chon dia chi giao hang')
      return
    }

    setSubmitting(true)
    try {
      const order = await submitCheckoutGroup(group)
      onOrderPlaced?.(order)
    } catch (e) {
      onNotify?.('error', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckoutAll = async () => {
    if (!selectedAddressId) {
      onNotify?.('error', 'Vui long chon dia chi giao hang')
      return
    }

    if (checkoutGroups.length === 0) {
      onNotify?.('error', 'Khong co san pham nao duoc chon')
      return
    }

    setSubmitting(true)
    try {
      const orders = []
      for (const group of checkoutGroups) {
        const order = await submitCheckoutGroup(group)
        orders.push(order)
      }

      onNotify?.('success', `Dat hang thanh cong ${orders.length} don hang`)
      onOrderPlaced?.({ orders })
    } catch (e) {
      onNotify?.('error', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!session?.token) {
    return (
      <div className="min-h-screen bg-[#f2f4f8] p-8 text-center">
        <p>Ban can dang nhap de thanh toan</p>
        <button type="button" onClick={() => onOpenAuth?.('checkout')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white">
          Dang nhap
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <MarketHeader
        session={session}
        cartCount={cartCount}
        searchKeyword={searchKeyword}
        searchSuggestions={searchSuggestions}
        onGoHome={onGoHome}
        onOpenCart={onOpenCart}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onOpenSeller={onOpenSeller}
        onOpenAdmin={onOpenAdmin}
        onOpenOrders={onOpenOrders}
        onSearchProducts={onSearchProducts}
        onRequestSearchSuggestions={onRequestSearchSuggestions}
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Thanh toan</h1>
        <p className="mt-1 text-sm text-slate-600">
          {checkoutGroups.length > 1
            ? <span className="font-semibold">{checkoutGroups.length} shop trong 1 lan thanh toan</span>
            : <span className="font-semibold">{checkoutGroups[0]?.shopName || 'Shop'}</span>}
        </p>

        {loading ? (
          <p className="mt-6 text-slate-500">Dang tai...</p>
        ) : checkoutGroups.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            Khong co san pham nao duoc chon de thanh toan.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <MapPin size={16} className="text-blue-600" />Dia chi nhan hang
                  </h2>
                  <button type="button" onClick={() => setShowAddressForm(!showAddressForm)} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    {showAddressForm ? 'Dong' : 'Thay doi'}
                  </button>
                </div>

                {selectedAddress ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-900">{selectedAddress.receiverName} · {selectedAddress.receiverPhone}</p>
                    <p className="mt-1 text-slate-600">{selectedAddress.fullAddress}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Chua co dia chi mac dinh. Vui long chon hoac tao moi.</p>
                )}

                {addresses.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {addresses.map((addr) => (
                      <label key={addr.addressId} className="flex cursor-pointer gap-3 rounded-lg border p-3 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                        <span className="sr-only">Chon dia chi giao hang</span>
                        <input
                          type="radio"
                          name="address"
                          value={addr.addressId}
                          checked={selectedAddressId === String(addr.addressId)}
                          onChange={() => setSelectedAddressId(String(addr.addressId))}
                        />
                        <div className="text-sm">
                          <p className="font-semibold">{addr.receiverName} · {addr.receiverPhone}</p>
                          <p className="text-slate-600">{addr.fullAddress}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {showAddressForm && (
                  <form onSubmit={handleCreateAddress} className="mt-4 grid gap-2 sm:grid-cols-2">
                    {['receiverName', 'receiverPhone', 'city', 'district', 'commune', 'detail'].map((field) => (
                      <input
                        key={field}
                        required
                        placeholder={field}
                        value={addressForm[field]}
                        onChange={(e) => setAddressForm((f) => ({ ...f, [field]: e.target.value }))}
                        className="rounded-lg border px-3 py-2 text-sm sm:col-span-1"
                      />
                    ))}
                    <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white sm:col-span-2">
                      Luu dia chi
                    </button>
                  </form>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Truck size={16} className="text-blue-600" />Phuong thuc van chuyen
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {shippingOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => setShippingMethod(option.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        shippingMethod === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      } ${option.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{option.eta}</p>
                      <p className="mt-1 text-sm font-bold text-blue-600">{formatPrice(option.fee)}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <CreditCard size={16} className="text-blue-600" />Phuong thuc thanh toan
                </h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    { value: 'COD', label: 'Tien mat (COD)' },
                    { value: 'VNPAY', label: 'The tin dung/ghi no' },
                    { value: 'MOMO', label: 'Vi dien tu' },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold ${paymentMethod === m.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-700'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                {checkoutGroups.map((group) => (
                  <div key={group.shopKey} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{group.shopName}</h3>
                        <p className="text-sm text-slate-500">{group.items.length} san pham</p>
                      </div>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleCheckoutGroup(group)}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50"
                      >
                        Thanh toan shop nay
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {group.items.map((item) => (
                        <div key={item.cartItemId} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="h-14 w-14 rounded-lg object-cover" />
                          ) : (
                            <div className="h-14 w-14 rounded-lg bg-slate-100" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{item.productName}</p>
                            <p className="text-xs text-slate-500">So luong: {item.quantity}</p>
                            {item.variantLabel ? <p className="text-xs text-slate-500">Phien ban: {item.variantLabel}</p> : null}
                          </div>
                          <p className="text-sm font-bold text-slate-900">{formatPrice(item.lineTotal)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <Ticket size={16} className="text-blue-600" />Ma giam gia cua shop
                        </h4>
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            placeholder="Nhap ma uu dai..."
                            value={group.voucherCode}
                            onChange={(e) => {
                              const nextValue = e.target.value.toUpperCase()
                              setVoucherCodes((prev) => ({ ...prev, [group.shopKey]: nextValue }))
                              if (voucherErrors[group.shopKey]) {
                                setVoucherErrors((prev) => ({ ...prev, [group.shopKey]: '' }))
                              }
                            }}
                            className="flex-1 rounded-lg border px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyVoucher(group)}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Ap dung
                          </button>
                        </div>
                        {group.voucherError && <p className="mt-2 text-sm font-semibold text-rose-600">{group.voucherError}</p>}
                      </div>

                      <div className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <div className="flex justify-between text-slate-600"><span>Tam tinh</span><span>{formatPrice(group.subtotal)}</span></div>
                        <div className="mt-1 flex justify-between text-slate-600"><span>Phi van chuyen</span><span>{formatPrice(group.shippingFee)}</span></div>
                        <div className="mt-1 flex justify-between text-slate-600"><span>Giam gia voucher</span><span className="font-semibold text-rose-600">-{formatPrice(group.discountInfo.amount || 0)}</span></div>
                        <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                          <span>Tong don</span>
                          <span className="text-blue-600">{formatPrice(group.totalPayable)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Ticket size={16} className="text-blue-600" />Tong thanh toan
                </h2>

                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                  <div className="flex justify-between text-slate-600"><span>So san pham</span><span>{totalItems}</span></div>
                  <div className="flex justify-between text-slate-600"><span>So shop</span><span>{checkoutGroups.length}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Tam tinh</span><span>{formatPrice(grandSubtotal)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Phi van chuyen</span><span>{formatPrice(grandShippingFee)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Giam gia voucher</span><span className="font-semibold text-rose-600">-{formatPrice(grandDiscount)}</span></div>
                  <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">
                    <span>Tong cong</span>
                    <span className="text-blue-600">{formatPrice(grandTotal)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Phuong thuc van chuyen hien tai: {selectedShipping.label}</p>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCheckoutAll}
                  className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Dang xu ly...' : 'Thanh toan tong'}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}