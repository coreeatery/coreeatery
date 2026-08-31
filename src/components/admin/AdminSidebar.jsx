import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../../features/auth/auth'

const links = [
  ['Dashboard', '/admin'],
  ['Homepage', '/admin/homepage'],
  ['Menu', '/admin/menu'],
  ['Reservasi', '/admin/reservasi'],
  ['Galeri', '/admin/galeri'],
  ['Promo', '/admin/promo'],
  ['Settings', '/admin/settings'],
]

export default function AdminSidebar() {
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()

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

  return (
    <>
      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-bold text-gray-950">
              COREÉATERY
            </div>

            <div className="text-[10px] uppercase tracking-widest text-gray-400">
              Admin Panel
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white"
          >
            {open ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {open && (
          <div className="border-t border-gray-100 px-4 py-3">
            <nav className="space-y-1">
              {links.map(([label, to]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-medium ${
                      isActive
                        ? 'bg-gray-950 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 17l5-5-5-5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12H3"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 19V5a2 2 0 00-2-2h-6"
                />
              </svg>

              {loggingOut ? 'Keluar...' : 'Logout'}
            </button>
          </div>
        )}
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:flex md:min-h-screen md:flex-col">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="font-bold text-gray-950">
            COREÉATERY
          </div>

          <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-400">
            Admin Panel
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {links.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-medium ${
                  isActive
                    ? 'bg-gray-950 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 17l5-5-5-5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12H3"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 19V5a2 2 0 00-2-2h-6"
              />
            </svg>

            {loggingOut ? 'Keluar...' : 'Logout'}
          </button>
        </div>
      </aside>
    </>
  )
}
