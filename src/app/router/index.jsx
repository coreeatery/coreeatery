import { createBrowserRouter } from 'react-router-dom'

import PublicLayout from '../../layouts/PublicLayout'
import AdminLayout from '../../layouts/AdminLayout'
import CashierLayout from '../../layouts/CashierLayout'

import HomePage from '../../pages/public/HomePage'
import MenuPage from '../../pages/public/MenuPage'
import MenuDetailPage from '../../pages/public/MenuDetailPage'
import ReservationPage from '../../pages/public/ReservationPage'
import GalleryPage from '../../pages/public/GalleryPage'

import AdminDashboardPage from '../../pages/admin/AdminDashboardPage'
import AdminHomepagePage from '../../pages/admin/AdminHomepagePage'
import AdminMenuPage from '../../pages/admin/AdminMenuPage'
import AdminReservationPage from '../../pages/admin/AdminReservationPage'
import AdminGalleryPage from '../../pages/admin/AdminGalleryPage'
import AdminPromoPage from '../../pages/admin/AdminPromoPage'
import AdminSettingsPage from '../../pages/admin/AdminSettingsPage'

import CashierDashboardPage from '../../pages/cashier/CashierDashboardPage'
import CashierOrdersPage from '../../pages/cashier/CashierOrdersPage'
import NewOrderPage from '../../pages/cashier/NewOrderPage'
import OrderDetailPage from '../../pages/cashier/OrderDetailPage'
import CashierPaymentsPage from '../../pages/cashier/CashierPaymentsPage'
import CashierTransactionsPage from '../../pages/cashier/CashierTransactionsPage'
import CashierRegisterPage from '../../pages/cashier/CashierRegisterPage'
import CashierReportsPage from '../../pages/cashier/CashierReportsPage'
import CashierSettingsPage from '../../pages/cashier/CashierSettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 'menu/:id', element: <MenuDetailPage /> },
      { path: 'reservasi', element: <ReservationPage /> },
      { path: 'galeri', element: <GalleryPage /> },
    ],
  },

  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'homepage', element: <AdminHomepagePage /> },
      { path: 'menu', element: <AdminMenuPage /> },
      { path: 'reservasi', element: <AdminReservationPage /> },
      { path: 'galeri', element: <AdminGalleryPage /> },
      { path: 'promo', element: <AdminPromoPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
    ],
  },

  {
    path: '/cashier',
    element: <CashierLayout />,
    children: [
      { index: true, element: <CashierDashboardPage /> },
      { path: 'orders', element: <CashierOrdersPage /> },
      { path: 'orders/new', element: <NewOrderPage /> },
      { path: 'orders/:id', element: <OrderDetailPage /> },
      { path: 'payments', element: <CashierPaymentsPage /> },
      { path: 'transactions', element: <CashierTransactionsPage /> },
      { path: 'register', element: <CashierRegisterPage /> },
      { path: 'reports', element: <CashierReportsPage /> },
      { path: 'settings', element: <CashierSettingsPage /> },
    ],
  },
])
