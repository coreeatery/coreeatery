import { createBrowserRouter } from 'react-router-dom'
import PublicLayout from '../../layouts/PublicLayout'
import AdminLayout from '../../layouts/AdminLayout'
import CashierLayout from '../../layouts/CashierLayout'
import Placeholder from '../../components/shared/Placeholder'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <Placeholder title="COREÉATERY" />,
      },
      {
        path: 'menu',
        element: <Placeholder title="Menu" />,
      },
      {
        path: 'menu/:id',
        element: <Placeholder title="Menu Detail" />,
      },
      {
        path: 'reservasi',
        element: <Placeholder title="Reservasi" />,
      },
      {
        path: 'galeri',
        element: <Placeholder title="Galeri" />,
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Placeholder title="Admin Dashboard" />,
      },
      {
        path: 'homepage',
        element: <Placeholder title="Homepage CMS" />,
      },
      {
        path: 'menu',
        element: <Placeholder title="Admin Menu" />,
      },
      {
        path: 'reservasi',
        element: <Placeholder title="Admin Reservasi" />,
      },
      {
        path: 'galeri',
        element: <Placeholder title="Admin Galeri" />,
      },
      {
        path: 'promo',
        element: <Placeholder title="Admin Promo" />,
      },
      {
        path: 'settings',
        element: <Placeholder title="Admin Settings" />,
      },
    ],
  },
  {
    path: '/cashier',
    element: <CashierLayout />,
    children: [
      {
        index: true,
        element: <Placeholder title="Cashier Dashboard" />,
      },
      {
        path: 'orders',
        element: <Placeholder title="Orders" />,
      },
      {
        path: 'orders/new',
        element: <Placeholder title="New Order" />,
      },
      {
        path: 'orders/:id',
        element: <Placeholder title="Order Detail" />,
      },
      {
        path: 'payments',
        element: <Placeholder title="Payments" />,
      },
      {
        path: 'transactions',
        element: <Placeholder title="Transactions" />,
      },
      {
        path: 'register',
        element: <Placeholder title="Cash Register" />,
      },
      {
        path: 'reports',
        element: <Placeholder title="Reports" />,
      },
      {
        path: 'settings',
        element: <Placeholder title="Cashier Settings" />,
      },
    ],
  },
])
