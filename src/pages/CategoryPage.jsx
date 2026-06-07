import { useEffect, useMemo, useRef, useState } from 'react'
import { searchProducts, getAllCategories } from '../services/catalogApi'
import { Grid3x3, List, ChevronDown } from 'lucide-react'
import { MarketHeader } from '../components/MarketHeader'
import { ProductCard } from '../components/ProductCard'

const PRODUCT_PAGE_SIZE = 20

function FilterSection({ title, children, section, openFilter, onToggle }) {
  return (
    <div className="border-b pb-4">
      <button
        type="button"
        onClick={() => onToggle(section)}
        className="flex w-full items-center justify-between py-2 font-semibold text-slate-900 hover:text-blue-600"
      >
        <span>{title}</span>
        <ChevronDown
          size={18}
          className={`transition ${openFilter === section ? 'rotate-180' : ''}`}
        />
      </button>
      {openFilter === section ? <div className="mt-3 space-y-2">{children}</div> : null}
    </div>
  )
}

function normalizeKeywordForSearch(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim()
}

export function CategoryPage({
  categoryId,
  categoryName,
  headerSearchKeyword,
  imageSearchResult,
  searchKeyword,
  searchSuggestions,
  onBack,
  session,
  cartCount,
  categories: headerCategories,
  onNavigateCategory,
  onLogout,
  onOpenAuth,
  onGoHome,
  onOpenCart,
  onOpenOrders,
  onOpenSeller,
  onOpenAdmin,
  onSearchProducts,
  onRequestSearchSuggestions,
  onOpenProduct,
  onAddToCart,
}) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [appliedMinPrice, setAppliedMinPrice] = useState('')
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedRatings, setSelectedRatings] = useState([])
  const [selectedShops, setSelectedShops] = useState([])
  const [openFilter, setOpenFilter] = useState(null)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const latestSearchRequestRef = useRef(0)
  const isImageSearchMode = Boolean(imageSearchResult)

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

  useEffect(() => {
    setSelectedCategoryId(categoryId || '')
  }, [categoryId])

  useEffect(() => {
    if (isImageSearchMode) {
      return
    }
    loadProducts({ page: 0 })
  }, [categoryId, isImageSearchMode])

  useEffect(() => {
    if (isImageSearchMode) {
      return
    }
    loadProducts({ forcedKeyword: headerSearchKeyword, page: 0 })
  }, [headerSearchKeyword, isImageSearchMode])

  useEffect(() => {
    if (!isImageSearchMode) {
      return
    }

    setProducts(imageSearchResult.products || [])
    setTotalPages(imageSearchResult.totalPages || 0)
    setTotalElements(imageSearchResult.totalElements || 0)
    setCurrentPage(0)
    setIsLoading(false)
  }, [imageSearchResult, isImageSearchMode])

  const loadProducts = async ({ forcedKeyword, forcedMinPrice, forcedMaxPrice, page = 0 } = {}) => {
    if (isImageSearchMode) {
      return
    }

    const requestId = latestSearchRequestRef.current + 1
    latestSearchRequestRef.current = requestId
    setIsLoading(true)
    try {
      const requestKeyword = normalizeKeywordForSearch(
        typeof forcedKeyword === 'string' ? forcedKeyword : headerSearchKeyword
      )

      const searchRequest = {
        keyword: requestKeyword || undefined,
        minPrice: typeof forcedMinPrice === 'string'
          ? (forcedMinPrice ? Number.parseInt(forcedMinPrice, 10) : undefined)
          : (appliedMinPrice ? Number.parseInt(appliedMinPrice, 10) : undefined),
        maxPrice: typeof forcedMaxPrice === 'string'
          ? (forcedMaxPrice ? Number.parseInt(forcedMaxPrice, 10) : undefined)
          : (appliedMaxPrice ? Number.parseInt(appliedMaxPrice, 10) : undefined),
        categoryId: selectedCategoryId || undefined,
        page: page,
        pageSize: PRODUCT_PAGE_SIZE,
      }

      console.log('Search request:', searchRequest)
      const response = await searchProducts(searchRequest)
      console.log('Search response:', response)

      if (latestSearchRequestRef.current !== requestId) {
        return
      }

      setProducts(response.content || [])
      setTotalPages(response.totalPages || 0)
      setTotalElements(response.totalElements || 0)
      setCurrentPage(page)
    } catch (error) {
      if (latestSearchRequestRef.current !== requestId) {
        return
      }
      console.error('Error searching products:', error)
      setProducts([])
    } finally {
      if (latestSearchRequestRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }

  const handleApplyPriceFilter = () => {
    setAppliedMinPrice(minPrice)
    setAppliedMaxPrice(maxPrice)
    setCurrentPage(0)
    loadProducts({ page: 0, forcedMinPrice: minPrice, forcedMaxPrice: maxPrice })
  }

  const handleReset = () => {
    setSelectedCategoryId(categoryId || '')
    setMinPrice('')
    setMaxPrice('')
    setAppliedMinPrice('')
    setAppliedMaxPrice('')
    setSelectedRatings([])
    setSelectedShops([])
    setSortBy('newest')
    setCurrentPage(0)
    loadProducts({ forcedKeyword: headerSearchKeyword, page: 0 })
  }

  const toggleRating = (rating) => {
    setSelectedRatings(prev =>
      prev.includes(rating)
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    )
  }

  const toggleShop = (shopName) => {
    setSelectedShops((prev) => (
      prev.includes(shopName)
        ? prev.filter((name) => name !== shopName)
        : [...prev, shopName]
    ))
  }

  const sourceCategories = headerCategories?.length ? headerCategories : categories
  const filterCategories = sourceCategories.filter((category) => category.parentId == null)

  const shopOptions = useMemo(() => (
    Array.from(new Set(products.map((item) => item.shopName).filter(Boolean)))
  ), [products])

  const displayProducts = useMemo(() => {
    let items = [...products]

    if (selectedRatings.length > 0) {
      items = items.filter((item) => selectedRatings.some((rating) => Number(item.averageRating || 0) >= rating))
    }

    if (selectedShops.length > 0) {
      items = items.filter((item) => selectedShops.includes(item.shopName))
    }

    if (sortBy === 'price-asc') {
      items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    } else if (sortBy === 'price-desc') {
      items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    } else if (sortBy === 'popular') {
      items.sort((a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0))
    } else if (isImageSearchMode) {
      items.sort((a, b) => Number(b.imageSimilarity || 0) - Number(a.imageSimilarity || 0))
    } else {
      items.sort((a, b) => Number(b.productId || 0) - Number(a.productId || 0))
    }

    return items
  }, [products, selectedRatings, selectedShops, sortBy, isImageSearchMode])

  const handleToggleFilterSection = (section) => {
    setOpenFilter((prev) => (prev === section ? null : section))
  }

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <MarketHeader
        session={session}
        cartCount={cartCount}
        searchKeyword={searchKeyword}
        searchSuggestions={searchSuggestions}
        onGoHome={onGoHome || onBack}
        onOpenCart={onOpenCart}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onOpenSeller={onOpenSeller}
        onOpenAdmin={onOpenAdmin}
        onOpenOrders={onOpenOrders}
        onSearchProducts={onSearchProducts}
        onRequestSearchSuggestions={onRequestSearchSuggestions}
      />

      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
          <button onClick={onBack} className="text-blue-600 hover:underline">
            Trang chu
          </button>
          <span>›</span>
          <span>{categoryName}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{isImageSearchMode ? 'Ket qua tim bang hinh anh' : `Tim kiem: "${categoryName}"`}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isImageSearchMode
            ? `${displayProducts.length} san pham co do trung lap tu 80% tro len`
            : `${displayProducts.length}/${totalElements} san pham`}
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Mobile filter toggle button */}
        {!isImageSearchMode && (
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen((prev) => !prev)}
            className="mb-4 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600 lg:hidden"
          >
            <span>🔍</span>
            {isMobileFilterOpen ? 'Ẩn bộ lọc' : 'Bộ lọc'}
          </button>
        )}
        <div className={`grid gap-6 ${isImageSearchMode ? '' : 'lg:grid-cols-5'}`}>
          {/* Sidebar - Filters */}
          {!isImageSearchMode && <div className={`lg:col-span-1 ${isMobileFilterOpen ? 'block' : 'hidden'} lg:block`}>
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

              {/* Danh Mục Filter */}
              <FilterSection
                title="Danh muc"
                section="category"
                openFilter={openFilter}
                onToggle={handleToggleFilterSection}
              >
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={!selectedCategoryId}
                      onChange={() => {
                        setSelectedCategoryId('')
                        onNavigateCategory?.(null, 'Tat ca')
                        setCurrentPage(0)
                        loadProducts({ page: 0 })
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">Tat ca</span>
                  </label>
                  {filterCategories.slice(0, 15).map((cat) => (
                      <label key={cat.categoryId} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={Number(selectedCategoryId) === Number(cat.categoryId)}
                          onChange={() => {
                            setSelectedCategoryId(cat.categoryId)
                            onNavigateCategory?.(cat.categoryId, cat.categoryName)
                            setCurrentPage(0)
                            loadProducts({ page: 0 })
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-slate-700">{cat.categoryName}</span>
                      </label>
                    ))}
                </div>
              </FilterSection>

              {/* Price Range */}
              <FilterSection
                title="Khoang gia"
                section="price"
                openFilter={openFilter}
                onToggle={handleToggleFilterSection}
              >
                <div className="space-y-3">
                  <div>
                    <label htmlFor="filter-min-price" className="block text-xs text-slate-600 mb-1">Tu</label>
                    <input
                      id="filter-min-price"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="filter-max-price" className="block text-xs text-slate-600 mb-1">Den</label>
                    <input
                      id="filter-max-price"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="999999999"
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPriceFilter}
                    className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                  >
                    Ap dung
                  </button>
                </div>
              </FilterSection>

              {/* Rating Filter */}
              <FilterSection
                title="Danh gia"
                section="rating"
                openFilter={openFilter}
                onToggle={handleToggleFilterSection}
              >
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

              {/* Shop Filter */}
              <FilterSection
                title="Cua hang"
                section="store"
                openFilter={openFilter}
                onToggle={handleToggleFilterSection}
              >
                <div className="space-y-2">
                  {shopOptions.length === 0 ? (
                    <p className="text-xs text-slate-500">Chua co du lieu cua hang</p>
                  ) : shopOptions.map((shop) => (
                    <label key={shop} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedShops.includes(shop)}
                        onChange={() => toggleShop(shop)}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">{shop}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

            </div>
          </div>}

          {/* Main Content - Products */}
          <div className={isImageSearchMode ? '' : 'lg:col-span-4'}>
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
                <option value="newest">{isImageSearchMode ? 'Trung anh cao nhat' : 'San pham moi'}</option>
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
            ) : displayProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-600 text-lg">Khong co san pham phu hop voi dieu kien tim kiem.</p>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 mb-8' : 'space-y-3 mb-8'}>
                  {displayProducts.map((item) => (
                    <ProductCard
                      key={item.productId}
                      product={item}
                      onClick={(p) => onOpenProduct?.(p.productId)}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 bg-white rounded-lg p-4 border border-slate-200">
                    <button
                      onClick={() => loadProducts({ page: Math.max(0, currentPage - 1) })}
                      disabled={currentPage === 0}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-slate-100 transition"
                    >
                      Truoc
                    </button>

                    <div className="flex gap-1">
                      {currentPage > 2 && (
                        <>
                          <button
                            onClick={() => loadProducts({ page: 0 })}
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
                            onClick={() => loadProducts({ page: pageNum })}
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
                            onClick={() => loadProducts({ page: totalPages - 1 })}
                            className="rounded-lg px-3 py-2 text-sm font-semibold border border-slate-300 hover:bg-slate-100"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => loadProducts({ page: Math.min(totalPages - 1, currentPage + 1) })}
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
