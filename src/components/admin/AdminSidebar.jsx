import { NavLink } from 'react-router-dom'

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
  return (
    <aside className="w-64 shrink-0 border-r bg-white">
      <div className="border-b px-6 py-5">
        <div className="font-bold">COREÉATERY</div>
        <div className="mt-1 text-xs opacity-50">ADMIN</div>
      </div>

      <nav className="space-y-1 p-4">
        {links.map(([label, to]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 text-sm ${
                isActive
                  ? 'bg-black text-white'
                  : 'opacity-70 hover:bg-gray-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
