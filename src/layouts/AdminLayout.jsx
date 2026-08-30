import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <main className="min-w-0 flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
