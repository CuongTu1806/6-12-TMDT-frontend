import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { CategoryPage } from './pages/CategoryPage'
import { SellerPage } from './pages/SellerPage'
import { AdminPage } from './pages/AdminPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ShopPage } from './pages/ShopPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrdersPage } from './pages/OrdersPage'
import { getGuestCart, getGuestCartCount, clearGuestCart, addToGuestCart } from './services/guestCart'
import { addToCart as addToBuyerCart, mergeGuestCart, getCart } from './services/buyerApi'
import { searchProducts } from './services/catalogApi'
import { pingRole } from './services/authApi'

const STORAGE_KEY = 'tmdt-auth-session'
const NAVIGATION_STORAGE_KEY = 'tmdt-navigation-state'
const ROLE_PROBES = [
  { role: 'ROLE_ADMIN', path: '/api/admin/ping' },
  { role: 'ROLE_SELLER', path: '/api/seller/ping' },
  { role: 'ROLE_BUYER', path: '/api/buyer/ping' },
]

function normalizeKeywordForSearch(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim()
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(session) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function loadNavigationState() {
  try {
    const raw = localStorage.getItem(NAVIGATION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    return {
      currentPage: parsed?.currentPage || 'home',
      authReturnPage: parsed?.authReturnPage || 'home',
      selectedCategoryForPage: parsed?.selectedCategoryForPage || null,
      selectedProductId: parsed?.selectedProductId || null,
      selectedShopId: parsed?.selectedShopId || null,
      checkoutShopId: parsed?.checkoutShopId || null,
      checkoutSelectedCartItemIds: Array.isArray(parsed?.checkoutSelectedCartItemIds)
        ? parsed.checkoutSelectedCartItemIds
        : [],
      shopReturnPage: parsed?.shopReturnPage || 'home',
      headerSearchKeyword: '',
    }
  } catch {
    return null
  }
}

function saveNavigationState(state) {
  try {
    localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore persistence errors to avoid breaking page rendering.
  }
}

function getPageFromPath(pathname) {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/category')) return 'category'
  if (pathname.startsWith('/product/')) return 'product'
  if (pathname.startsWith('/shop/')) return 'shop'
  if (pathname === '/cart') return 'cart'
  if (pathname === '/checkout') return 'checkout'
  if (pathname === '/orders') return 'orders'
  if (pathname === '/auth') return 'auth'
  if (pathname === '/seller') return 'seller'
  if (pathname === '/admin') return 'admin'
  return 'home'
}

function buildCategoryPath(categoryId, categoryName, searchKeyword = '') {
  const params = new URLSearchParams()
  if (categoryId !== null && categoryId !== undefined) {
    params.set('categoryId', String(categoryId))
  }
  if (categoryName) {
    params.set('name', categoryName)
  }
  if (searchKeyword) {
    params.set('search', searchKeyword)
  }
  const query = params.toString()
  return query ? `/category?${query}` : '/category'
}

function buildCheckoutPath(shopId, selectedCartItemIds = [], voucherCode = '') {
  const params = new URLSearchParams()
  if (shopId !== null && shopId !== undefined) {
    params.set('shopId', String(shopId))
  }
  if (selectedCartItemIds.length > 0) {
    params.set('items', selectedCartItemIds.join(','))
  }
  if (voucherCode) {
    params.set('voucher', voucherCode)
  }
  const query = params.toString()
  return query ? `/checkout?${query}` : '/checkout'
}

function parseNullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildAuthPath(returnTo = '/') {
  const params = new URLSearchParams()
  if (returnTo) {
    params.set('return', returnTo)
  }
  const query = params.toString()
  return query ? `/auth?${query}` : '/auth'
}

function normalizeReturnPath(value) {
  if (!value || value === 'home') {
    return '/'
  }

  return value
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialNavigationState = loadNavigationState()
  const [toast, setToast] = useState({ type: 'idle', text: '' })
  const [session, setSession] = useState(() => loadSession())
  const [currentPage, setCurrentPage] = useState(initialNavigationState?.currentPage || 'home')
  const [authReturnPage, setAuthReturnPage] = useState(initialNavigationState?.authReturnPage || 'home')
  const [selectedCategoryForPage, setSelectedCategoryForPage] = useState(initialNavigationState?.selectedCategoryForPage || null)
  const [selectedProductId, setSelectedProductId] = useState(initialNavigationState?.selectedProductId || null)
  const [selectedShopId, setSelectedShopId] = useState(initialNavigationState?.selectedShopId || null)
  const [checkoutShopId, setCheckoutShopId] = useState(initialNavigationState?.checkoutShopId || null)
  const [shopReturnPage, setShopReturnPage] = useState(initialNavigationState?.shopReturnPage || 'home')
  const [checkoutSelectedCartItemIds, setCheckoutSelectedCartItemIds] = useState(
    initialNavigationState?.checkoutSelectedCartItemIds || []
  )
  const [checkoutVoucherCode, setCheckoutVoucherCode] = useState('')
  const [headerSearchKeyword, setHeaderSearchKeyword] = useState(initialNavigationState?.headerSearchKeyword || '')
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const suggestionRequestRef = useRef(0)

  const updateToast = (type, text) => {
    setToast({ type, text })
    globalThis.setTimeout(() => {
      setToast((prev) => (prev.text === text ? { type: 'idle', text: '' } : prev))
    }, 3000)
  }

  const refreshCartCount = useCallback(async () => {
    if (session?.token) {
      try {
        const cart = await getCart()
        setCartCount(cart?.totalItems || 0)
      } catch {
        setCartCount(0)
      }
    } else {
      setCartCount(getGuestCartCount())
    }
  }, [session?.token])

  useEffect(() => {
    refreshCartCount()
  }, [refreshCartCount])

  useEffect(() => {
    const nextPage = getPageFromPath(location.pathname)
    setCurrentPage(nextPage)

    const params = new URLSearchParams(location.search)

    if (nextPage === 'product') {
      const productId = Number(location.pathname.split('/')[2])
      setSelectedProductId(Number.isFinite(productId) ? productId : null)
    }

    if (nextPage === 'shop') {
      const shopId = Number(location.pathname.split('/')[2])
      setSelectedShopId(Number.isFinite(shopId) ? shopId : null)
      setShopReturnPage(params.get('back') || shopReturnPage || 'home')
    }

    if (nextPage === 'category') {
      const categoryId = params.get('categoryId')
      const categoryName = params.get('name') || (params.get('search') ? `Tim: ${params.get('search')}` : 'Tat ca')
      setSelectedCategoryForPage(
        categoryId ? { id: Number(categoryId), name: categoryName } : { id: null, name: categoryName }
      )
      setHeaderSearchKeyword(params.get('search') || '')
    }

    if (nextPage === 'checkout') {
      setCheckoutShopId(parseNullableNumber(params.get('shopId')))
      setCheckoutSelectedCartItemIds(
        params.get('items')
          ? params.get('items').split(',').map((item) => item.trim()).filter(Boolean)
          : []
      )
      setCheckoutVoucherCode(params.get('voucher') || '')
    }

    if (nextPage === 'auth') {
      setAuthReturnPage(params.get('return') || 'home')
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!session?.token || Array.isArray(session.roles) && session.roles.length > 0) {
      return undefined
    }

    let cancelled = false

    const loadRolesFromServer = async () => {
      const results = await Promise.allSettled(
        ROLE_PROBES.map(({ path }) => pingRole(path, session.token))
      )

      if (cancelled) {
        return
      }

      const resolvedRoles = ROLE_PROBES
        .filter((_, index) => results[index].status === 'fulfilled')
        .map((entry) => entry.role)

      if (resolvedRoles.length === 0) {
        return
      }

      setSession((prev) => {
        if (!prev) {
          return prev
        }

        const nextSession = { ...prev, roles: resolvedRoles }
        saveSession(nextSession)
        return nextSession
      })
    }

    loadRolesFromServer()

    return () => {
      cancelled = true
    }
  }, [session?.token, session?.roles])

  useEffect(() => {
    saveNavigationState({
      currentPage,
      authReturnPage,
      selectedCategoryForPage,
      selectedProductId,
      selectedShopId,
      checkoutShopId,
      checkoutSelectedCartItemIds,
      shopReturnPage,
    })
  }, [
    currentPage,
    authReturnPage,
    selectedCategoryForPage,
    selectedProductId,
    selectedShopId,
    checkoutShopId,
    checkoutSelectedCartItemIds,
    shopReturnPage,
  ])

  const handleSearchProducts = (keyword = '') => {
    const normalizedKeyword = keyword.trim()
    setSearchSuggestions([])
    setHeaderSearchKeyword(normalizedKeyword)
    setSelectedCategoryForPage({ id: null, name: normalizedKeyword ? `Tim: ${normalizedKeyword}` : 'Tat ca' })
    setCurrentPage('category')
  }

  const handleRequestSearchSuggestions = useCallback(async (keyword = '') => {
    const normalizedKeyword = normalizeKeywordForSearch(keyword)
    if (normalizedKeyword.length < 2) {
      setSearchSuggestions([])
      return
    }

    const requestId = suggestionRequestRef.current + 1
    suggestionRequestRef.current = requestId

    try {
      const response = await searchProducts({
        keyword: normalizedKeyword,
        page: 0,
        pageSize: 8,
      })

      if (suggestionRequestRef.current !== requestId) {
        return
      }

      const suggestions = Array.from(
        new Set((response?.content || []).map((item) => item.productName).filter(Boolean))
      ).slice(0, 8)
      setSearchSuggestions(suggestions)
    } catch {
      if (suggestionRequestRef.current === requestId) {
        setSearchSuggestions([])
      }
    }
  }, [])

  const openAuth = (returnPage = currentPage) => {
    const nextReturnPage = typeof returnPage === 'string' ? normalizeReturnPath(returnPage) : '/'
    setAuthReturnPage(nextReturnPage)
    setCurrentPage('auth')
    navigate(buildAuthPath(nextReturnPage))
  }

  const handleAuthenticated = async (loginData) => {
    saveSession(loginData)
    setSession(loginData)

    const guestItems = getGuestCart()
    if (guestItems.length > 0) {
      try {
        await mergeGuestCart(guestItems)
        clearGuestCart()
        updateToast('success', 'Da dong bo gio hang tu thiet bi')
      } catch {
        updateToast('error', 'Khong dong bo duoc gio hang cu')
      }
    } else {
      updateToast('success', 'Dang nhap thanh cong')
    }

    navigate(normalizeReturnPath(authReturnPage))
    refreshCartCount()
  }

  const handleLogoutLocal = () => {
    saveSession(null)
    setSession(null)
    setCurrentPage('home')
    navigate('/')
    refreshCartCount()
    updateToast('success', 'Dang xuat thanh cong')
  }

  const handleAddToCart = async (product, quantity = 1, selectedVariant = null) => {
    try {
      let res
      if (session?.token) {
        res = await addToBuyerCart(product.productId, quantity, selectedVariant)
      } else {
        res = addToGuestCart(product, quantity, selectedVariant)
      }
      await refreshCartCount()
      updateToast('success', 'Da them vao gio hang')
      return res
    } catch (e) {
      if (e.status === 401) {
        openAuth(currentPage)
        return
      }
      updateToast('error', e.message || 'Khong them duoc vao gio')
    }
  }

  const commonNav = {
    session,
    cartCount,
    searchKeyword: headerSearchKeyword,
    searchSuggestions,
    onGoHome: () => {
      setCurrentPage('home')
      navigate('/')
    },
    onOpenAuth: openAuth,
    onLogout: handleLogoutLocal,
    onOpenSeller: () => {
      setCurrentPage('seller')
      navigate('/seller')
    },
    onOpenAdmin: () => {
      setCurrentPage('admin')
      navigate('/admin')
    },
    onOpenShop: (shopId) => {
      setSelectedShopId(shopId)
      setShopReturnPage(currentPage)
      setCurrentPage('shop')
      navigate(`/shop/${shopId}`)
    },
    onOpenProduct: (productId) => {
      setSelectedProductId(productId)
      setCurrentPage('product')
      navigate(`/product/${productId}`)
    },
    onOpenCart: () => {
      setCurrentPage('cart')
      navigate('/cart')
    },
    onOpenCheckout: (shopId, selectedCartItemIds = [], voucherCode = '') => {
      setCheckoutShopId(shopId ?? null)
      setCheckoutSelectedCartItemIds(selectedCartItemIds)
      setCheckoutVoucherCode(voucherCode || '')
      setCurrentPage('checkout')
      navigate(buildCheckoutPath(shopId, selectedCartItemIds, voucherCode || ''))
    },
    onOpenOrders: () => {
      setCurrentPage('orders')
      navigate('/orders')
    },
    onSearchProducts: (keyword) => {
      handleSearchProducts(keyword)
      navigate(buildCategoryPath(null, keyword ? `Tim: ${keyword.trim()}` : 'Tat ca', keyword.trim()))
    },
    onRequestSearchSuggestions: handleRequestSearchSuggestions,
    onNotify: updateToast,
  }

  if (currentPage === 'auth') {
    return (
      <AuthPage
        onAuthenticated={handleAuthenticated}
        onBack={() => setCurrentPage(authReturnPage || 'home')}
        onGoHome={() => setCurrentPage(authReturnPage || 'home')}
      />
    )
  }

  if (currentPage === 'seller') {
    return (
      <SellerPage
        session={session}
        onLogout={handleLogoutLocal}
        onBackHome={() => setCurrentPage('home')}
      />
    )
  }

  if (currentPage === 'admin') {
    return (
      <>
        <AdminPage
          session={session}
          onLogout={handleLogoutLocal}
          onBackHome={() => setCurrentPage('home')}
          onNotify={updateToast}
        />
        {toast.type !== 'idle' ? (
          <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border bg-white px-4 py-3 text-sm shadow-xl">
            <p className={toast.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}>{toast.text}</p>
          </div>
        ) : null}
      </>
    )
  }

  if (currentPage === 'product' && selectedProductId) {
    return (
      <ProductDetailPage
        productId={selectedProductId}
        {...commonNav}
        onBack={() => setCurrentPage(selectedCategoryForPage ? 'category' : 'home')}
        onAddToCart={handleAddToCart}
        onOpenProduct={(id) => {
          setSelectedProductId(id)
          setCurrentPage('product')
          navigate(`/product/${id}`)
        }}
        onOpenShop={(shopId) => {
          setSelectedShopId(shopId)
          setShopReturnPage('product')
          setCurrentPage('shop')
          navigate(`/shop/${shopId}`)
        }}
      />
    )
  }

  if (currentPage === 'shop' && selectedShopId) {
    return (
      <ShopPage
        shopId={selectedShopId}
        {...commonNav}
        onBack={() => setCurrentPage(shopReturnPage || 'home')}
      />
    )
  }

  if (currentPage === 'cart') {
    return (
      <CartPage
        {...commonNav}
        onOpenCheckout={(shopId, selectedCartItemIds = []) => {
          setCheckoutShopId(shopId)
          setCheckoutSelectedCartItemIds(selectedCartItemIds)
          setCurrentPage('checkout')
          navigate(buildCheckoutPath(shopId, selectedCartItemIds))
        }}
        onCartUpdated={refreshCartCount}
      />
    )
  }

  if (currentPage === 'checkout') {
    return (
      <CheckoutPage
        shopId={checkoutShopId}
        selectedCartItemIds={checkoutSelectedCartItemIds}
        initialVoucherCode={checkoutVoucherCode}
        {...commonNav}
        onOrderPlaced={() => {
          setCheckoutShopId(null)
          setCheckoutSelectedCartItemIds([])
          setCheckoutVoucherCode('')
          refreshCartCount()
          setCurrentPage('orders')
          navigate('/orders')
        }}
      />
    )
  }

  if (currentPage === 'orders') {
    return <OrdersPage {...commonNav} />
  }

  if (currentPage === 'category' && selectedCategoryForPage) {
    return (
      <CategoryPage
        categoryId={selectedCategoryForPage.id}
        categoryName={selectedCategoryForPage.name}
        headerSearchKeyword={headerSearchKeyword}
        onBack={() => {
          setCurrentPage('home')
          navigate('/')
        }}
        onOpenProduct={(id) => {
          setSelectedProductId(id)
          setCurrentPage('product')
          navigate(`/product/${id}`)
        }}
        onAddToCart={handleAddToCart}
        {...commonNav}
        onNavigateCategory={(id, name) => {
          setSelectedCategoryForPage({ id, name })
          setCurrentPage('category')
          navigate(buildCategoryPath(id, name, headerSearchKeyword))
        }}
      />
    )
  }

  return (
    <>
      <HomePage
        {...commonNav}
        onOpenCategoryPage={(id, name) => {
          setSelectedCategoryForPage({ id, name })
          setCurrentPage('category')
          navigate(buildCategoryPath(id, name, headerSearchKeyword))
        }}
        onOpenProduct={(id) => {
          setSelectedProductId(id)
          setCurrentPage('product')
          navigate(`/product/${id}`)
        }}
        onAddToCart={handleAddToCart}
      />

      {toast.type === 'idle' ? null : (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border bg-white px-4 py-3 text-sm shadow-xl">
          <p className={toast.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}>{toast.text}</p>
        </div>
      )}
    </>
  )
}

export default App
