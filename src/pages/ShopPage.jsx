import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, MessageSquare, Star, Store, Package, Users } from 'lucide-react'
import { MarketHeader } from '../components/MarketHeader'
import { ProductCard } from '../components/ProductCard'
import { getProductsByShop, getShopProfile } from '../services/catalogApi'

function formatCount(value) {
  return Number(value || 0).toLocaleString('vi-VN')
}

function buildShopAvatar(shopId, shopName) {
  const seed = encodeURIComponent(`${shopId || 'shop'}-${shopName || 'shop'}`)
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}`
}

function buildShopBanner(shopId, shopName) {
  const seed = encodeURIComponent(`${shopId || 'shop'}-${shopName || 'shop'}-banner`)
  return `https://picsum.photos/seed/${seed}/1600/520`
}

export function ShopPage({
  shopId,
  session,
  cartCount,
  searchKeyword,
  searchSuggestions,
  onGoHome,
  onBack,
  onOpenAuth,
  onLogout,
  onOpenSeller,
  onOpenAdmin,
  onOpenCart,
  onOpenOrders,
  onOpenProduct,
  onAddToCart,
  onSearchProducts,
  onRequestSearchSuggestions,
  onNotify,
}) {
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    const loadShop = async () => {
      setLoading(true)
      try {
        const profile = await getShopProfile(shopId)
        setShop(profile)

        const pageSize = Math.max(Number(profile?.productCount || 0), 24)
        const productResponse = await getProductsByShop(shopId, 0, pageSize || 24)
        setProducts(productResponse?.content || [])
      } catch (error) {
        onNotify?.('error', error.message || 'Khong tai duoc thong tin shop')
        onBack?.()
      } finally {
        setLoading(false)
      }
    }

    if (shopId) {
      loadShop()
    }
  }, [shopId, onBack, onNotify])

  const categoryGroups = useMemo(() => {
    const grouped = products.reduce((acc, product) => {
      const key = String(product.categoryId ?? product.categoryName ?? 'other')
      if (!acc[key]) {
        acc[key] = {
          categoryId: product.categoryId ?? key,
          categoryName: product.categoryName || 'Khong phan loai',
          items: [],
        }
      }
      acc[key].items.push(product)
      return acc
    }, {})

    return Object.values(grouped).sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'vi'))
  }, [products])

  const visibleGroups = activeCategory === 'all'
    ? categoryGroups
    : categoryGroups.filter((group) => String(group.categoryId) === String(activeCategory))

  const reviewCount = Number(shop?.reviewCount || 0)
  const averageRating = Number(shop?.averageRating || 0)
  const avatarUrl = buildShopAvatar(shop?.shopId || shopId, shop?.shopName)
  const bannerUrl = buildShopBanner(shop?.shopId || shopId, shop?.shopName)

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

      <div className="mx-auto max-w-7xl px-4 py-6">
        <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600">
          <ArrowLeft size={16} /> Quay lai
        </button>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">Dang tai shop...</div>
        ) : shop ? (
          <>
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-52 bg-slate-200 sm:h-64">
                <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-end gap-4">
                      <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg sm:h-28 sm:w-28">
                        <img src={avatarUrl} alt={shop.shopName} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white/90">
                          Cua hang chinh thuc
                        </p>
                        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{shop.shopName}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-white/80">{shop.description || 'Chua co mo ta cho shop nay.'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <StatCard icon={Star} label="Sao TB" value={averageRating ? averageRating.toFixed(1) : '0.0'} />
                      <StatCard icon={MessageSquare} label="Luot danh gia" value={formatCount(reviewCount)} />
                      <StatCard icon={Package} label="San pham" value={formatCount(shop.productCount)} />
                      <StatCard icon={Users} label="Followers" value="-" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Store size={18} className="text-blue-600" /> Danh muc cua shop
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600'}`}
                >
                  Tat ca
                </button>
                {categoryGroups.map((group) => (
                  <button
                    key={String(group.categoryId)}
                    type="button"
                    onClick={() => setActiveCategory(String(group.categoryId))}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === String(group.categoryId) ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600'}`}
                  >
                    {group.categoryName} ({group.items.length})
                  </button>
                ))}
              </div>
            </section>

            <div className="mt-6 space-y-8">
              {visibleGroups.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                  Shop nay chua co san pham.
                </div>
              ) : visibleGroups.map((group) => (
                <section key={String(group.categoryId)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{group.categoryName}</h2>
                      <p className="mt-1 text-sm text-slate-500">{group.items.length} san pham trong danh muc nay</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {group.items.map((product) => (
                      <ProductCard
                        key={product.productId}
                        product={product}
                        onClick={() => onOpenProduct?.(product.productId)}
                        onAddToCart={onAddToCart}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
        <Icon size={14} /> {label}
      </div>
      <div className="mt-2 text-lg font-extrabold text-white">{value}</div>
    </div>
  )
}