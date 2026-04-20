import { useEffect, useMemo, useState } from 'react'
import { searchProducts, getAllCategories } from '../services/catalogApi'
import { Grid3x3, List, ChevronDown } from 'lucide-react'

const PRODUCT_PAGE_SIZE = 20

export function CategoryPage({
  categoryId,
  categoryName,
  onBack,
  session,
  categories: headerCategories,
  onProtectedAction,
  onNavigateCategory,
  onLogout,
  onOpenLogin,
  onGoSeller,
}) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedRatings, setSelectedRatings] = useState([])
  const [openFilter, setOpenFilter] = useState(null)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)

  // Load categories for filter
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getAllCategories()
        setCategories(data)
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }
    loadCategories()
  }, [])

  // Load products with filters
  useEffect(() => {
    loadProducts(0)
  }, [categoryId])

  const loadProducts = async (page = 0) => {
    setIsLoading(true)
    try {
      const searchRequest = {
        keyword: keyword || undefined,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        categoryId: categoryId,
        page: page,
        pageSize: PRODUCT_PAGE_SIZE,
      }

      console.log('Search request:', searchRequest)
      const response = await searchProducts(searchRequest)
      console.log('Search response:', response)

      setProducts(response.content || [])
      setTotalPages(response.totalPages || 0)
      setTotalElements(response.totalElements || 0)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error searching products:', error)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(0)
    loadProducts(0)
  }

  const handleReset = () => {
    setKeyword('')
    setMinPrice('')
    setMaxPrice('')
    setSelectedRatings([])
    setCurrentPage(0)
    loadProducts(0)
  }

  const toggleRating = (rating) => {
    setSelectedRatings(prev =>
      prev.includes(rating)
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    )
  }

  const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}₫`

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.categoryId === id)
    return cat?.categoryName || 'Category'
  }

  const categoryTree = useMemo(() => {
    const sourceCategories = headerCategories?.length ? headerCategories : categories
    const roots = sourceCategories.filter((category) => category.parentId == null)
    const childMap = sourceCategories.reduce((acc, category) => {
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
  }, [headerCategories, categories])

  const hasSellerAccess = useMemo(() => {
    const roles = session?.roles || []
    return roles.some((r) => ['SELLER', 'ADMIN', 'ROLE_SELLER', 'ROLE_ADMIN'].includes(r))
  }, [session])

  const FilterSection = ({ title, children, section }) => (
    <div className="border-b pb-4">
      <button
        onClick={() => setOpenFilter(openFilter === section ? null : section)}
        className="flex w-full items-center justify-between py-2 font-semibold text-slate-900 hover:text-blue-600"
      >
        <span>{title}</span>
        <ChevronDown
          size={18}
          className={`transition ${openFilter === section ? 'rotate-180' : ''}`}
        />
      </button>
      {openFilter === section && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-blue-600"
          >
            <span className="inline-block rounded-md bg-blue-100 px-2 py-1">M</span>
            Marketplace Pro
          </button>
          <nav className="hidden items-center gap-4 text-sm text-slate-600 md:flex">
            <button type="button" onClick={onBack} className="text-slate-900">Home</button>
            <div
              className="relative"
              onMouseEnter={() => setIsCategoryMenuOpen(true)}
              onMouseLeave={() => setIsCategoryMenuOpen(false)}
            >
              <button
                type="button"
                className="text-slate-600 transition hover:text-slate-900"
              >
                Categories
              </button>
              {isCategoryMenuOpen && (
                <div className="absolute left-0 top-full w-[560px]">
                  <div className="pointer-events-none h-2" />
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Danh muc san pham
                      </p>
                    </div>
                    <div className="grid max-h-72 gap-4 overflow-y-auto md:grid-cols-2">
                      {categoryTree.roots.map((rootCategory) => (
                        <div key={rootCategory.categoryId} className="rounded-xl bg-slate-50 p-3">
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateCategory?.(rootCategory.categoryId, rootCategory.categoryName)
                            }
                            className="text-sm font-bold text-slate-900 hover:text-blue-600"
                          >
                            {rootCategory.categoryName}
                          </button>
                          <div className="mt-2 space-y-1">
                            {(categoryTree.childMap[rootCategory.categoryId] || []).map((childCategory) => (
                              <button
                                key={childCategory.categoryId}
                                type="button"
                                onClick={() =>
                                  onNavigateCategory?.(
                                    childCategory.categoryId,
                                    childCategory.categoryName,
                                  )
                                }
                                className="block text-left text-xs text-slate-600 transition hover:text-blue-600"
                              >
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
            <a href="#">Deals</a>
          </nav>
          <div className="hidden flex-1 md:block">
            <input
              type="text"
              placeholder="Search products, brands..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            {session?.username ? (
              <>
                <span className="hidden text-slate-600 sm:inline">Hi, {session.username}</span>
                {hasSellerAccess && (
                  <button
                    type="button"
                    onClick={onGoSeller}
                    className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    Quan ly shop
                  </button>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                >
                  Dang xuat
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
              >
                Dang nhap
              </button>
            )}
            <button
              type="button"
              onClick={onProtectedAction}
              className="rounded-full border border-slate-200 p-2"
              aria-label="Open cart"
            >
              🛒
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
          <button onClick={onBack} className="text-blue-600 hover:underline">
            Trang chu
          </button>
          <span>›</span>
          <span>{categoryName}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Tim kiem: "{categoryName}"</h1>
        <p className="text-sm text-slate-500 mt-1">{totalElements} san pham</p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4 bg-white rounded-lg p-4 border border-slate-200">
              {/* Filter Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <h2 className="font-bold text-slate-900 text-lg">
                  🔍 Bo loc
                </h2>
                <button
                  onClick={handleReset}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Xoa het
                </button>
              </div>

              {/* Search Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Tim kiem
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Nhap ten san pham..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>

              {/* Danh Mục Filter */}
              <FilterSection title="Danh muc" section="category">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories
                    .filter(cat => !cat.parentId)
                    .slice(0, 10)
                    .map(cat => (
                      <label key={cat.categoryId} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="category" className="rounded" />
                        <span className="text-sm text-slate-700">{cat.categoryName}</span>
                      </label>
                    ))}
                </div>
              </FilterSection>

              {/* Price Range */}
              <FilterSection title="Khoang gia" section="price">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Tu</label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Den</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="999999999"
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </FilterSection>

              {/* Rating Filter */}
              <FilterSection title="Danh gia" section="rating">
                <div className="space-y-2">
                  {[5, 4, 3].map(rating => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRatings.includes(rating)}
                        onChange={() => toggleRating(rating)}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">
                        {rating} sao va tren ⭐
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Store Location Filter */}
              <FilterSection title="Vi tri cua hang" section="store">
                <div className="space-y-2">
                  {['Ha Noi', 'TP. Ho Chi Minh', 'Da Nang', 'Can Tho', 'Hai Phong'].map(city => (
                    <label key={city} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-slate-700">{city}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition mt-4"
              >
                Tim kiem
              </button>
            </div>
          </div>

          {/* Main Content - Products */}
          <div className="lg:col-span-4">
            {/* View Controls */}
            <div className="mb-6 flex items-center justify-between bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-600 font-semibold">Sap xep:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="List view"
                  className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <List size={18} />
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="newest">San pham moi</option>
                <option value="price-asc">Gia: Thap den cao</option>
                <option value="price-desc">Gia: Cao den thap</option>
                <option value="popular">Pho bien nhat</option>
              </select>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Dang tai san pham...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-600 text-lg">Khong co san pham phu hop voi dieu kien tim kiem.</p>
              </div>
            ) : (
              <>
                <div className={`gap-4 mb-8 ${viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-4' : 'space-y-3'}`}>
                  {products.map((item) => (
                    <article
                      key={item.productId}
                      className={`rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-lg transition cursor-pointer ${
                        viewMode === 'list' ? 'flex gap-4 p-4' : 'overflow-hidden flex flex-col'
                      }`}
                    >
                      {/* Image Container */}
                      <div className={`overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 relative ${
                        viewMode === 'list' ? 'w-32 h-32 flex-shrink-0 rounded-lg' : 'h-48'
                      }`}>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-full w-full object-cover hover:scale-105 transition"
                          />
                        ) : null}
                        {/* Badge */}
                        <span className="absolute top-2 left-2 inline-block rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                          Giam gia
                        </span>
                      </div>

                      {/* Content */}
                      <div className={`${viewMode === 'list' ? 'flex-1' : 'p-3 flex flex-col flex-1'}`}>
                        {/* Category Badge */}
                        <span className="inline-block rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700 mb-2 w-fit">
                          {getCategoryName(item.categoryId)}
                        </span>

                        {/* Product Name */}
                        <h3 className={`font-semibold text-slate-900 ${viewMode === 'grid' ? 'line-clamp-2 min-h-[40px] text-sm' : 'line-clamp-2 text-sm'}`}>
                          {item.productName}
                        </h3>

                        {/* Rating & Sales */}
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                          <span>⭐ {(item.averageRating || 4.5).toFixed(1)}</span>
                          <span>({item.salesCount || 0})</span>
                        </div>

                        {/* Price */}
                        <p className="mt-auto pt-2 text-lg font-bold text-blue-600">
                          {formatPrice(item.price)}
                        </p>

                        {/* Original Price */}
                        {item.originalPrice && item.originalPrice > item.price && (
                          <p className="text-xs text-slate-500 line-through">
                            {formatPrice(item.originalPrice)}
                          </p>
                        )}

                        {/* Shop Info */}
                        <p className="mt-2 text-xs text-slate-600">{item.shopName || 'Marketplace Pro'}</p>

                        {/* Buy Button */}
                        <button
                          onClick={onProtectedAction}
                          className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                        >
                          Mua ngay
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 bg-white rounded-lg p-4 border border-slate-200">
                    <button
                      onClick={() => loadProducts(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-slate-100 transition"
                    >
                      Truoc
                    </button>

                    <div className="flex gap-1">
                      {currentPage > 2 && (
                        <>
                          <button
                            onClick={() => loadProducts(0)}
                            className="rounded-lg px-3 py-2 text-sm font-semibold border border-slate-300 hover:bg-slate-100"
                          >
                            1
                          </button>
                          <span className="text-slate-500">...</span>
                        </>
                      )}
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                        const pageNum = currentPage <= 2 ? idx : currentPage + idx - 2
                        if (pageNum >= totalPages) return null
                        return (
                          <button
                            key={pageNum}
                            onClick={() => loadProducts(pageNum)}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                              pageNum === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        )
                      })}
                      {currentPage < totalPages - 3 && (
                        <>
                          <span className="text-slate-500">...</span>
                          <button
                            onClick={() => loadProducts(totalPages - 1)}
                            className="rounded-lg px-3 py-2 text-sm font-semibold border border-slate-300 hover:bg-slate-100"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => loadProducts(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-slate-100 transition"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
