import { Outlet } from 'react-router-dom'
import PublicNavbar from '../components/public/PublicNavbar'
import PublicFooter from '../components/public/PublicFooter'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-gray-950">
      <PublicNavbar />

      <div>
        <Outlet />
      </div>

      <PublicFooter />
    </div>
  )
}
