import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../../features/auth/auth'

function Icon({ children, className = 'h-5 w-5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function MenuIcon() {
  return (
    <Icon>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Icon>
  )
}

function CloseIcon() {
  return (
    <Icon>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  )
}

function LogoutIcon() {
  return (
    <Icon className="h-4 w-4">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 00-2-2h-6" />
    </Icon>
  )
}

export default function AdminSidebar() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()

  const links = [
    [t('admin.dashboard', 'Dashboard'), '/admin'],
    [t('admin.homepage', 'Homepage'), '/admin/homepage'],
    [t('admin.menu', 'Menu'), '/admin/menu'],
    [t('admin.reservation', 'Reservasi'), '/admin/reservasi'],
    [t('admin.gallery', 'Galeri'), '/admin/galeri'],
    [t('admin.promo', 'Promo'), '/admin/promo'],
    [t('admin.settings', 'Pengaturan'), '/admin/settings'],
    ['Operations Hub', '/admin/operations'],
  ]

  async function handleLogout() {
    setLoggingOut(true)

    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout gagal:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  function closeMobileMenu() {
    setOpen(false)
  }

  async function handleLanguageChange(event) {
    const language = event.target.value
    const currentLanguage = (
      i18n.resolvedLanguage ||
      i18n.language ||
      'id'
    ).split('-')[0]

    if (!language || language === currentLanguage) return

    await i18n.changeLanguage(language)
  }

  function renderLanguageSwitcher() {
    const currentLanguage = (
      i18n.resolvedLanguage ||
      i18n.language ||
      'id'
    ).split('-')[0]

    return (
      <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <label
          htmlFor="admin-language"
          className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          {t('common.language', 'Bahasa')}
        </label>

        <select
          id="admin-language"
          value={currentLanguage}
          onChange={handleLanguageChange}
          className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
        >
          <option value="id">🇮🇩 Indonesia</option>
          <option value="en">🇬🇧 English</option>
          <option value="zh">🇨🇳 中文</option>
        </select>
      </div>
    )
  }

  function renderNavLinks(isMobile = false) {
    return (
      <nav
        aria-label="Admin navigation"
        className={isMobile ? 'space-y-1.5' : 'space-y-1'}
      >
        {links.map(([label, to]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            onClick={isMobile ? closeMobileMenu : undefined}
            className={({ isActive }) =>
              [
                'group flex min-h-12 w-full items-center rounded-xl px-4 py-3 text-sm font-medium leading-5 transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2',
                isActive
                  ? 'bg-gray-950 !text-white shadow-md shadow-gray-950/10'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950',
              ].join(' ')
            }
          >
            <span className="min-w-0 flex-1 truncate text-inherit">
              {label}
            </span>

            <span className="ml-3 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-0 transition-opacity group-[.active]:opacity-100" />
          </NavLink>
        ))}
      </nav>
    )
  }

  function renderLogoutButton() {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogoutIcon />
        {loggingOut ? 'Keluar...' : 'Logout'}
      </button>
    )
  }

  return (
    <>
      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md md:hidden">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate font-bold text-gray-950">
              COREÉATERY
            </div>

            <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gray-400">
              Admin Panel
            </div>
          </div>

          <button
            type="button"
            aria-label={open ? 'Tutup navigasi' : 'Buka navigasi'}
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-900 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigasi admin"
        >
          <button
            type="button"
            aria-label="Tutup navigasi"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-gray-950/45 backdrop-blur-[2px]"
          />

          <aside className="absolute right-0 top-0 flex h-dvh w-[min(88vw,22rem)] flex-col overflow-y-auto border-l border-gray-200 bg-white shadow-2xl">
            <div className="flex min-h-16 items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="min-w-0">
                <div className="font-bold text-gray-950">
                  COREÉATERY
                </div>

                <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gray-400">
                  Admin Panel
                </div>
              </div>

              <button
                type="button"
                aria-label="Tutup navigasi"
                onClick={closeMobileMenu}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-900 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 px-4 py-5">
              {renderNavLinks(true)}
            </div>

            <div className="border-t border-gray-200 p-4">
              {renderLanguageSwitcher()}
            {renderLogoutButton()}
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="font-bold text-gray-950">
            COREÉATERY
          </div>

          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gray-400">
            Admin Panel
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {renderNavLinks()}
        </div>

        <div className="border-t border-gray-200 p-4">
          {renderLanguageSwitcher()}
            {renderLogoutButton()}
        </div>
      </aside>
    </>
  )
}
