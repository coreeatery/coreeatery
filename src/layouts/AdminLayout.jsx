import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <div className="flex min-h-screen flex-col md:flex-row">
        <AdminSidebar />

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
