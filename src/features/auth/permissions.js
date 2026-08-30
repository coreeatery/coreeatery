export const PERMISSIONS = {
  VIEW_ADMIN: 'view_admin',
  MANAGE_MENU: 'manage_menu',
  MANAGE_RESERVATIONS: 'manage_reservations',
  MANAGE_GALLERY: 'manage_gallery',
  MANAGE_PROMOTIONS: 'manage_promotions',
  MANAGE_SETTINGS: 'manage_settings',

  VIEW_CASHIER: 'view_cashier',
  CREATE_ORDER: 'create_order',
  MANAGE_ORDERS: 'manage_orders',
  PROCESS_PAYMENT: 'process_payment',
  MANAGE_REGISTER: 'manage_register',

  VIEW_REPORTS: 'view_reports',
  MANAGE_INVENTORY: 'manage_inventory',
}

export const ROLE_PERMISSIONS = {
  owner: Object.values(PERMISSIONS),

  admin: [
    PERMISSIONS.VIEW_ADMIN,
    PERMISSIONS.MANAGE_MENU,
    PERMISSIONS.MANAGE_RESERVATIONS,
    PERMISSIONS.MANAGE_GALLERY,
    PERMISSIONS.MANAGE_PROMOTIONS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_CASHIER,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_INVENTORY,
  ],

  manager: [
    PERMISSIONS.VIEW_ADMIN,
    PERMISSIONS.MANAGE_MENU,
    PERMISSIONS.MANAGE_RESERVATIONS,
    PERMISSIONS.MANAGE_PROMOTIONS,
    PERMISSIONS.VIEW_CASHIER,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.PROCESS_PAYMENT,
    PERMISSIONS.MANAGE_REGISTER,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_INVENTORY,
  ],

  cashier: [
    PERMISSIONS.VIEW_CASHIER,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.PROCESS_PAYMENT,
    PERMISSIONS.MANAGE_REGISTER,
    PERMISSIONS.VIEW_REPORTS,
  ],

  kitchen: [
    PERMISSIONS.MANAGE_ORDERS,
  ],

  staff: [
    PERMISSIONS.VIEW_CASHIER,
  ],
}

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role, permissions = []) {
  return permissions.some((permission) =>
    hasPermission(role, permission),
  )
}
