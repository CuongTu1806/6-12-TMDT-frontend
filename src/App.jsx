import { useState, useEffect, useCallback } from 'react'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { CategoryPage } from './pages/CategoryPage'
import { SellerPage } from './pages/SellerPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrdersPage } from './pages/OrdersPage'
import { getGuestCart, getGuestCartCount, clearGuestCart, addToGuestCart } from './services/guestCart'
import { addToCart as addToBuyerCart, mergeGuestCart, getCart } from './services/buyerApi'

const STORAGE_KEY = 'tmdt-auth-session'

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

function App() {
  const [toast, setToast] = useState({ type: 'idle', text: '' })
  const [session, setSession] = useState(() => loadSession())
  const [currentPage, setCurrentPage] = useState('home')
  const [authReturnPage, setAuthReturnPage] = useState('home')
  const [selectedCategoryForPage, setSelectedCategoryForPage] = useState(null)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [checkoutShopId, setCheckoutShopId] = useState(null)
  const [cartCount, setCartCount] = useState(0)

  const updateToast = (type, text) => {
    setToast({ type, text })
    window.setTimeout(() => {
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

  const openAuth = (returnPage = currentPage) => {
    setAuthReturnPage(returnPage)
    setCurrentPage('auth')
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

    setCurrentPage(authReturnPage || 'home')
    refreshCartCount()
  }

  const handleLogoutLocal = () => {
    saveSession(null)
    setSession(null)
    setCurrentPage('home')
    refreshCartCount()
    updateToast('success', 'Dang xuat thanh cong')
  }

  const handleAddToCart = async (product, quantity = 1) => {
    try {
      if (session?.token) {
        await addToBuyerCart(product.productId, quantity)
      } else {
        addToGuestCart(product, quantity)
      }
      await refreshCartCount()
      updateToast('success', 'Da them vao gio hang')
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
    onGoHome: () => setCurrentPage('home'),
    onOpenAuth: openAuth,
    onLogout: handleLogoutLocal,
    onOpenSeller: () => setCurrentPage('seller'),
    onOpenCart: () => setCurrentPage('cart'),
    onOpenOrders: () => setCurrentPage('orders'),
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

  if (currentPage === 'product' && selectedProductId) {
    return (
      <ProductDetailPage
        productId={selectedProductId}
        {...commonNav}
        onBack={() => setCurrentPage(selectedCategoryForPage ? 'category' : 'home')}
        onAddToCart={handleAddToCart}
        onOpenShop={() => updateToast('success', 'Xem shop (sap co trang rieng)')}
      />
    )
  }

  if (currentPage === 'cart') {
    return (
      <CartPage
        {...commonNav}
        onOpenCheckout={(shopId) => {
          setCheckoutShopId(shopId)
          setCurrentPage('checkout')
        }}
        onCartUpdated={refreshCartCount}
      />
    )
  }

  if (currentPage === 'checkout' && checkoutShopId) {
    return (
      <CheckoutPage
        shopId={checkoutShopId}
        {...commonNav}
        onOrderPlaced={() => {
          setCheckoutShopId(null)
          refreshCartCount()
          setCurrentPage('orders')
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
        onBack={() => setCurrentPage('home')}
        onOpenProduct={(id) => {
          setSelectedProductId(id)
          setCurrentPage('product')
        }}
        onAddToCart={handleAddToCart}
        {...commonNav}
        onNavigateCategory={(id, name) => setSelectedCategoryForPage({ id, name })}
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
        }}
        onOpenProduct={(id) => {
          setSelectedProductId(id)
          setCurrentPage('product')
        }}
        onAddToCart={handleAddToCart}
      />

      {toast.type !== 'idle' ? (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border bg-white px-4 py-3 text-sm shadow-xl">
          <p className={toast.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}>{toast.text}</p>
        </div>
      ) : null}
    </>
  )
}

export default App
