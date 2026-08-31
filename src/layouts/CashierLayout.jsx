import { Outlet } from 'react-router-dom'
import CashierSidebar from '../components/cashier/CashierSidebar'

export default function CashierLayout() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <div className="flex min-h-screen">
        <CashierSidebar />

        <main className="min-w-0 flex-1 px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
