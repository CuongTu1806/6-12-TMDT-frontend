import { useMemo } from 'react'

export function MarketHeader({
  session,
  cartCount = 0,
  onOpenAuth,
  onLogout,
  onOpenSeller,
  onGoHome,
  onOpenCart,
  onOpenOrders,
  title,
}) {
  const hasSellerAccess = useMemo(() => {
    const roles = session?.roles || []
    return roles.some((r) => ['SELLER', 'ADMIN', 'ROLE_SELLER', 'ROLE_ADMIN'].includes(r))
  }, [session])

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <button type="button" onClick={onGoHome} className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-blue-600">
          <span className="inline-block rounded-md bg-blue-100 px-2 py-1">M</span>
          {title || 'Marketplace Pro'}
        </button>
        <div className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
          {session?.username ? (
            <>
              <button type="button" onClick={onOpenOrders} className="hidden rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold sm:inline">
                Don mua
              </button>
              {hasSellerAccess && (
                <button type="button" onClick={onOpenSeller} className="hidden rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:inline">
                  Quan ly shop
                </button>
              )}
              <span className="hidden text-slate-600 sm:inline">Hi, {session.username}</span>
              <button type="button" onClick={onLogout} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold">
                Dang xuat
              </button>
            </>
          ) : (
            <button type="button" onClick={onOpenAuth} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Dang nhap
            </button>
          )}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative rounded-full border border-slate-200 p-2 hover:bg-slate-50"
            aria-label="Gio hang"
          >
            🛒
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
