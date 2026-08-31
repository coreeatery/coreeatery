import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Calculator,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react'

import { signOut } from '../../features/auth/auth'
import { useAuth } from '../../app/providers/useAuth'

const links = [
  {
    label: 'Dashboard',
    to: '/cashier',
    icon: LayoutDashboard,
  },
  {
    label: 'Order Baru',
    to: '/cashier/orders/new',
    icon: ShoppingCart,
  },
  {
    label: 'Order Aktif',
    to: '/cashier/orders',
    icon: ClipboardList,
  },
  {
    label: 'Pembayaran',
    to: '/cashier/payments',
    icon: CreditCard,
  },
  {
    label: 'Transaksi',
    to: '/cashier/transactions',
    icon: Receipt,
  },
  {
    label: 'Kasir',
    to: '/cashier/register',
    icon: Calculator,
  },
  {
    label: 'Laporan',
    to: '/cashier/reports',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    to: '/cashier/settings',
    icon: Settings,
  },
]

export default function CashierSidebar() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout gagal:', error)
      setLoggingOut(false)
    }
  }

  const closeMobile = () => setMobileOpen(false)

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-stone-200 bg-white">
      {/* BRAND */}
      <div className="border-b border-stone-200 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-white shadow-sm">
            <Store size={20} strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-bold tracking-[0.18em] text-stone-950">
              COREÉATERY
            </div>

            <div className="mt-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
                Cashier System
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* USER */}
      <div className="mx-4 mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white">
            {(profile?.full_name || 'C').charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">
              {profile?.full_name || 'Cashier'}
            </p>

            <span className="mt-1 inline-flex rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-600">
              {profile?.role || 'cashier'}
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
          Operasional
        </p>

        <div className="space-y-1">
          {links.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/cashier'}
              onClick={closeMobile}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-stone-950 text-white shadow-md shadow-stone-900/10'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className="shrink-0"
                  />

                  <span className="truncate">{label}</span>

                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* STATUS */}
      <div className="mx-4 mb-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-700">
            Sistem aktif
          </span>
        </div>
      </div>

      {/* LOGOUT */}
      <div className="border-t border-stone-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={18} className="shrink-0" />

          <span>
            {loggingOut ? 'Keluar...' : 'Keluar dari Sistem'}
          </span>
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-950 text-white">
            <Store size={17} />
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-stone-950">
              COREÉATERY
            </p>
            <p className="text-[10px] text-stone-500">CASHIER</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-sm"
          aria-label="Buka menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:block">
        {sidebar}
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={closeMobile}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          />

          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            {sidebar}
          </div>
        </>
      )}
    </>
  )
}
