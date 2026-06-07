import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Camera, ShoppingCart } from 'lucide-react'

const SEARCH_DEBOUNCE_MS = 450

function normalizeRole(role) {
  if (typeof role === 'string') {
    return role.toUpperCase()
  }

  if (role && typeof role === 'object' && typeof role.roleName === 'string') {
    return role.roleName.toUpperCase()
  }

  return ''
}

export function MarketHeader({
  session,
  cartCount = 0,
  onOpenAuth,
  onLogout,
  onOpenSeller,
  onOpenAdmin,
  onGoHome,
  onOpenCart,
  onOpenOrders,
  onSearchProducts,
  onRequestSearchSuggestions,
  searchSuggestions = [],
  searchKeyword = '',
  title,
}) {
  const [keyword, setKeyword] = useState(searchKeyword)
  const isFirstRender = useRef(true)
  const searchRootRef = useRef(null)
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false)

  useEffect(() => {
    setKeyword(searchKeyword || '')
  }, [searchKeyword])

  useEffect(() => {
    if (!onRequestSearchSuggestions) {
      return undefined
    }

    if (isFirstRender.current) {
      isFirstRender.current = false
      return undefined
    }

    const timerId = globalThis.setTimeout(() => {
      onRequestSearchSuggestions(keyword)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      globalThis.clearTimeout(timerId)
    }
  }, [keyword, onRequestSearchSuggestions])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchRootRef.current?.contains(event.target)) {
        setIsSuggestionOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const hasSellerAccess = useMemo(() => {
    const roles = session?.roles || []
    return roles.some((r) => ['SELLER', 'ROLE_SELLER'].includes(normalizeRole(r)))
  }, [session])

  const hasAdminAccess = useMemo(() => {
    const roles = session?.roles || []
    return roles.some((r) => ['ADMIN', 'ROLE_ADMIN'].includes(normalizeRole(r)))
  }, [session])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const normalizedKeyword = keyword.trim()
    if (!normalizedKeyword) {
      return
    }

    setIsSuggestionOpen(false)
    onSearchProducts?.(normalizedKeyword)
  }

  const handleSelectSuggestion = (value) => {
    const normalizedValue = value.trim()
    if (!normalizedValue) {
      return
    }

    setKeyword(normalizedValue)
    setIsSuggestionOpen(false)
    onSearchProducts?.(normalizedValue)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between gap-2 py-3">
          <button type="button" onClick={onGoHome} className="flex shrink-0 items-center gap-2 text-base font-extrabold tracking-tight text-blue-700">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm">M</span>
            <span className="hidden sm:inline">{title || 'Marketplace Pro'}</span>
          </button>

          <div className="flex items-center gap-1.5 text-sm sm:gap-2">
            {session?.username ? (
              <>
                <span className="hidden max-w-[100px] truncate text-slate-600 md:inline">Xin chao, {session.username}</span>
                <button type="button" onClick={onOpenOrders} className="hidden rounded-full border border-slate-300 px-2.5 py-1.5 text-xs font-semibold sm:inline">
                  Don mua
                </button>
                {hasAdminAccess && (
                  <button type="button" onClick={onOpenAdmin} className="rounded-full border border-violet-300 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700">
                    Quan tri
                  </button>
                )}
                {hasSellerAccess && (
                  <button type="button" onClick={onOpenSeller} className="hidden rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 sm:inline">
                    Quan ly shop
                  </button>
                )}
                <button type="button" onClick={onLogout} className="rounded-full border border-slate-300 px-2.5 py-1.5 text-xs font-semibold">
                  Dang xuat
                </button>
              </>
            ) : (
              <button type="button" onClick={() => onOpenAuth?.()} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                Dang nhap
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 py-3" ref={searchRootRef}>
          <form onSubmit={handleSearchSubmit} className="relative flex flex-1 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onFocus={() => {
                  if (keyword.trim()) {
                    setIsSuggestionOpen(true)
                  }
                }}
                placeholder="Tim kiem san pham..."
                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
              />
            </div>
            <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Tim
            </button>

            {isSuggestionOpen && keyword.trim() ? (
              <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <button
                  type="button"
                  onClick={() => handleSelectSuggestion(keyword)}
                  className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span aria-hidden="true">🏬</span>
                  Tim Shop "{keyword.trim()}"
                </button>
                {searchSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </form>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
            aria-label="Tim kiem bang hinh anh"
            title="Tim kiem bang hinh anh"
          >
            <Camera size={18} />
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
            aria-label="Gio hang"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
