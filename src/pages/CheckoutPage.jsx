import { useEffect, useState } from 'react'
import { MarketHeader } from '../components/MarketHeader'
import { checkout, getAddresses, createAddress } from '../services/buyerApi'
import { getCart } from '../services/buyerApi'

const formatPrice = (p) => `${Number(p || 0).toLocaleString('vi-VN')}₫`

export function CheckoutPage({
  shopId,
  session,
  cartCount,
  onGoHome,
  onOpenAuth,
  onLogout,
  onOpenSeller,
  onOpenOrders,
  onOpenCart,
  onOrderPlaced,
  onNotify,
}) {
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [voucherCode, setVoucherCode] = useState('')
  const [shopTotal, setShopTotal] = useState(0)
  const [shopName, setShopName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    city: '', district: '', commune: '', detail: '', receiverName: '', receiverPhone: '', isDefault: 1,
  })

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
        if (defaultAddr) setSelectedAddressId(String(defaultAddr.addressId))

        const shopItems = (cart?.items || []).filter((i) => i.shopId === shopId)
        setShopTotal(shopItems.reduce((s, i) => s + (i.lineTotal || 0), 0))
        setShopName(shopItems[0]?.shopName || 'Shop')
      } catch (e) {
        onNotify?.('error', e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session?.token, shopId])

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

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      onNotify?.('error', 'Vui long chon dia chi giao hang')
      return
    }
    setSubmitting(true)
    try {
      const order = await checkout({
        shopId,
        addressId: Number(selectedAddressId),
        paymentMethod,
        voucherCode: voucherCode || undefined,
      })
      onNotify?.('success', `Dat hang thanh cong! Ma don: ${order.orderCode}`)
      onOrderPlaced?.(order)
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
      <MarketHeader session={session} cartCount={cartCount} onGoHome={onGoHome} onOpenCart={onOpenCart} onOpenAuth={onOpenAuth} onLogout={onLogout} onOpenSeller={onOpenSeller} onOpenOrders={onOpenOrders} />

      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">Thanh toan</h1>
        <p className="mt-1 text-sm text-slate-600">Don hang tu: <span className="font-semibold">{shopName}</span></p>

        {loading ? (
          <p className="mt-6 text-slate-500">Dang tai...</p>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="font-bold">Dia chi giao hang</h2>
              {addresses.length === 0 && !showAddressForm && (
                <p className="mt-2 text-sm text-slate-500">Chua co dia chi. Hay them dia chi moi.</p>
              )}
              <div className="mt-3 space-y-2">
                {addresses.map((addr) => (
                  <label key={addr.addressId} className="flex cursor-pointer gap-3 rounded-lg border p-3 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input type="radio" name="address" value={addr.addressId} checked={selectedAddressId === String(addr.addressId)} onChange={() => setSelectedAddressId(String(addr.addressId))} />
                    <div className="text-sm">
                      <p className="font-semibold">{addr.receiverName} · {addr.receiverPhone}</p>
                      <p className="text-slate-600">{addr.fullAddress}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button type="button" onClick={() => setShowAddressForm(!showAddressForm)} className="mt-3 text-sm font-semibold text-blue-600">
                + Them dia chi moi
              </button>
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
                  <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white sm:col-span-2">Luu dia chi</button>
                </form>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="font-bold">Phuong thuc thanh toan</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {['COD', 'VNPAY', 'MOMO'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold ${paymentMethod === m ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <input
                type="text"
                placeholder="Ma voucher (neu co)"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Tong thanh toan</span>
                <span className="text-emerald-600">{formatPrice(shopTotal)}</span>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={handleCheckout}
                className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Dang xu ly...' : 'Xac nhan dat hang'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
