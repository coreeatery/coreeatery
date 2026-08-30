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

  const changeLanguage = (event) => {
    i18n.changeLanguage(event.target.value)
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="text-xl font-bold tracking-tight">
          COREÉATERY
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map(({ to, key, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `text-sm transition ${
                  isActive ? 'font-semibold' : 'opacity-60'
                }`
              }
            >
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>

        <select
          value={i18n.language}
          onChange={changeLanguage}
          aria-label="Language"
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="id">🇮🇩 ID</option>
          <option value="en">🇬🇧 EN</option>
          <option value="zh">🇨🇳 中文</option>
        </select>
      </div>
    </header>
  )
}
