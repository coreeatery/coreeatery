import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const links = [
  { to: '/', key: 'home', end: true },
  { to: '/menu', key: 'menu' },
  { to: '/reservasi', key: 'reservation' },
  { to: '/galeri', key: 'gallery' },
]

export default function PublicNavbar() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const changeLanguage = (event) => {
    i18n.changeLanguage(event.target.value)
    setOpen(false)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#171512]/90 text-white shadow-lg shadow-black/5 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link
          to="/"
          className="group flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <span className="h-px w-6 bg-[#c7aa70] transition-all duration-300 group-hover:w-10" />
          <span className="font-serif text-lg tracking-[0.12em] sm:text-xl">
            COREÉATERY
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map(({ to, key, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                  isActive
                    ? 'text-[#dbc38f] after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-[#c7aa70]'
                    : 'text-white/55 hover:text-white'
                }`
              }
            >
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <select
            value={i18n.language}
            onChange={changeLanguage}
            aria-label={t('public.language')}
            className="hidden appearance-none border-0 bg-transparent px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white outline-none sm:block"
          >
            <option className="text-black" value="id">ID</option>
            <option className="text-black" value="en">EN</option>
            <option className="text-black" value="zh">ZH</option>
          </select>

          <Link
            to="/reservasi"
            className="hidden items-center gap-3 border border-[#c7aa70]/70 px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] transition hover:bg-[#c7aa70] hover:text-[#171512] sm:inline-flex"
          >
            {t('public.reserveTable')}
            <span>↗</span>
          </Link>

          <button
            type="button"
            aria-label={t('public.toggleMenu')}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center border border-white/20 transition hover:border-[#c7aa70] lg:hidden"
          >
            <span className="sr-only">{t('public.toggleMenu')}</span>
            <span className="flex w-5 flex-col gap-1.5">
              <span
                className={`h-px w-full bg-white transition ${
                  open ? 'translate-y-2 rotate-45' : ''
                }`}
              />
              <span
                className={`h-px w-3/4 self-end bg-white transition ${
                  open ? 'w-full -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#171512] px-5 pb-7 pt-2 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col">
            {links.map(({ to, key, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `border-b border-white/10 py-4 text-xs font-medium uppercase tracking-[0.2em] transition ${
                    isActive ? 'text-[#dbc38f]' : 'text-white/65'
                  }`
                }
              >
                {t(`nav.${key}`)}
              </NavLink>
            ))}
          </nav>

          <div className="mt-5 flex items-center justify-between gap-4">
            <select
              value={i18n.language}
              onChange={changeLanguage}
              aria-label={t('public.language')}
              className="border border-white/20 bg-transparent px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white outline-none"
            >
              <option className="text-black" value="id">ID</option>
              <option className="text-black" value="en">EN</option>
              <option className="text-black" value="zh">ZH</option>
            </select>

            <Link
              to="/reservasi"
              onClick={() => setOpen(false)}
              className="border border-[#c7aa70] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#dbc38f] transition hover:bg-[#c7aa70] hover:text-[#171512]"
            >
              {t('public.reserveTable')} ↗
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
