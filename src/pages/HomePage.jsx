import { useEffect, useMemo, useState } from 'react'
import { getAllCategories, getVisibleProducts } from '../services/catalogApi'
import { MarketHeader } from '../components/MarketHeader'
import { ProductCard } from '../components/ProductCard'

const PRODUCT_PAGE_SIZE = 12

export function HomePage({
  session,
  cartCount,
  onOpenAuth,
  onOpenCategoryPage,
  onOpenSeller,
  onLogout,
  onOpenCart,
  onOpenOrders,
  onGoHome,
  onOpenProduct,
  onAddToCart,
  onNotify,
}) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [isProductsLoading, setIsProductsLoading] = useState(false)
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)

  useEffect(() => {
    const initCatalog = async () => {
      setIsCategoriesLoading(true)
      setIsProductsLoading(true)

      try {
        const [categoryData, productData] = await Promise.all([
          getAllCategories(),
          getVisibleProducts(0, PRODUCT_PAGE_SIZE),
        ])
        setCategories(categoryData)
        setProducts(productData.content || [])
        setFeaturedProducts(productData.content || [])
      } catch (error) {
        onNotify?.('error', error.message || 'Khong tai duoc du lieu trang chu')
      } finally {
        setIsCategoriesLoading(false)
        setIsProductsLoading(false)
      }
    }

    initCatalog()
  }, [onNotify])

  useEffect(() => {
    console.log('Products length:', products.length)
    console.log('isProductsLoading:', isProductsLoading)
  }, [products, isProductsLoading])

  const categoryTree = useMemo(() => {
    const roots = categories.filter((category) => category.parentId == null)
    const childMap = categories.reduce((acc, category) => {
      if (category.parentId == null) {
        return acc
      }
      if (!acc[category.parentId]) {
        acc[category.parentId] = []
      }
      acc[category.parentId].push(category)
      return acc
    }, {})

    return { roots, childMap }
  }, [categories])

  const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}d`

  const openCategoryPage = (categoryId, categoryName) => {
    onOpenCategoryPage?.(categoryId, categoryName)
    setIsCategoryMenuOpen(false)
  }

  return (
    <main className="min-h-screen bg-[#f2f4f8] font-sans text-slate-900">
      <MarketHeader
        session={session}
        cartCount={cartCount}
        onGoHome={onGoHome}
        onOpenCart={onOpenCart}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onOpenSeller={onOpenSeller}
        onOpenOrders={onOpenOrders}
      />
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <nav className="hidden items-center gap-4 text-sm text-slate-600 md:flex">
            <button type="button" className="text-slate-900">Home</button>
            <div
              className="relative"
              onMouseEnter={() => setIsCategoryMenuOpen(true)}
              onMouseLeave={() => setIsCategoryMenuOpen(false)}
            >
              <button type="button" className="text-slate-600 transition hover:text-slate-900">
                Categories
              </button>
              {isCategoryMenuOpen && (
                <div className="absolute left-0 top-full z-30 w-[560px]">
                  <div className="pointer-events-none h-2" />
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Danh muc san pham</p>
                      <button type="button" onClick={() => openCategoryPage(null, 'Tat ca')} className="text-xs font-semibold text-blue-600">Tat ca</button>
                    </div>
                    <div className="grid max-h-72 gap-4 overflow-y-auto md:grid-cols-2">
                      {categoryTree.roots.map((rootCategory) => (
                        <div key={rootCategory.categoryId} className="rounded-xl bg-slate-50 p-3">
                          <button type="button" onClick={() => openCategoryPage(rootCategory.categoryId, rootCategory.categoryName)} className="text-sm font-bold text-slate-900 hover:text-blue-600">
                            {rootCategory.categoryName}
                          </button>
                          <div className="mt-2 space-y-1">
                            {(categoryTree.childMap[rootCategory.categoryId] || []).map((childCategory) => (
                              <button key={childCategory.categoryId} type="button" onClick={() => openCategoryPage(childCategory.categoryId, childCategory.categoryName)} className="block text-left text-xs text-slate-600 hover:text-blue-600">
                                {childCategory.categoryName}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Xu the cong nghe 2026
          </p>
          <h1 className="mt-4 font-['Be_Vietnam_Pro',_sans-serif] text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
            Nang Tam Phong
            <span className="block text-blue-600">Cach Song Hien Dai</span>
          </h1>
          <p className="mt-4 max-w-md text-slate-600">
            Kham pha bo suu tap thiet bi thong minh va phu kien cao cap tai Marketplace Pro.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenCart}
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-300/70 transition hover:-translate-y-0.5"
            >
              Mua sam ngay
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold"
            >
              Tim hieu them
            </button>
          </div>
          <div className="mt-8 flex gap-8">
            <div>
              <p className="text-3xl font-extrabold">50k+</p>
              <p className="text-xs text-slate-500">San pham</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold">12k+</p>
              <p className="text-xs text-slate-500">Thuong hieu</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold">4.9/5</p>
              <p className="text-xs text-slate-500">Danh gia</p>
            </div>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-6 text-white shadow-xl">
          <div className="h-[280px] rounded-2xl border border-white/20 bg-white/10" />
          <p className="mt-4 text-sm text-white/80">Khung hero product (chua can hinh anh)</p>
          <div className="pointer-events-none absolute -right-10 -top-8 h-36 w-36 rounded-full bg-blue-500/40 blur-3xl" />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Danh muc noi bat</h2>
            <button type="button" onClick={() => openCategoryPage(null, 'Tat ca')} className="text-sm font-semibold text-blue-600">
              Xem tat ca
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
            {isCategoriesLoading ? <p className="col-span-full text-sm text-slate-500">Dang tai danh muc...</p> : null}
            {categories.map((category) => (
              <button
                key={category.categoryId}
                type="button"
                onClick={() => openCategoryPage(category.categoryId, category.categoryName)}
                className="group rounded-2xl p-2 text-center"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl transition group-hover:bg-blue-100">
                  •
                </span>
                <span className="mt-2 block text-xs font-medium text-slate-600">{category.categoryName}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="relative overflow-hidden rounded-2xl bg-blue-600 px-8 py-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Flash sale cuoi tuan</p>
          <h3 className="mt-3 text-3xl font-black">Giam den 50% cho phu kien cong nghe chinh hang</h3>
            <button
              type="button"
              onClick={onOpenCart}
              className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-bold text-blue-700"
            >
              Nhan uu dai ngay
            </button>
          <div className="pointer-events-none absolute -right-7 -top-7 h-44 w-44 rounded-full border-8 border-white/20" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">San pham goi y</h2>
          <button type="button" onClick={() => openCategoryPage(null, 'Tat ca')} className="text-sm font-semibold text-blue-600">
            Tai lai
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.slice(0, 8).map((item) => (
            <ProductCard
              key={item.productId}
              product={item}
              onClick={(p) => onOpenProduct?.(p.productId)}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 text-sm md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-bold">Giao hang mien phi</p>
            <p className="text-slate-600">Don tu 500k toan quoc.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-bold">Bao hanh chinh hang</p>
            <p className="text-slate-600">Doi tra trong 7 ngay.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-bold">Doi tra de dang</p>
            <p className="text-slate-600">Thu tuc gon va nhanh.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-bold">Thanh toan an toan</p>
            <p className="text-slate-600">Nhieu phuong thuc linh hoat.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 text-center">
        <h2 className="font-['Be_Vietnam_Pro',_sans-serif] text-3xl font-black">Dang ky nhan ban tin</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Cap nhat uu dai moi nhat va xu huong san pham hot moi tuan.
        </p>
        <form className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="email"
            placeholder="Dia chi email cua ban"
            className="flex-1 rounded-full border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
          <button type="button" className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white">
            Dang ky
          </button>
        </form>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-600">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <p className="text-base font-extrabold text-blue-600">Marketplace Pro</p>
              <p className="mt-3">Nen tang mua sam online cho phong cach song hien dai.</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">Shopping</p>
              <ul className="mt-3 space-y-2">
                <li>Browse products</li>
                <li>Featured categories</li>
                <li>Special offers</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-900">Company</p>
              <ul className="mt-3 space-y-2">
                <li>About us</li>
                <li>Terms of service</li>
                <li>Privacy policy</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-900">Contact</p>
              <ul className="mt-3 space-y-2">
                <li>support@marketplacepro.com</li>
                <li>+84 555 000 000</li>
                <li>123 E Commerce Way</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
