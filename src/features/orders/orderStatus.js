export const ORDER_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const ORDER_STATUS_OPTIONS = [
  {
    value: ORDER_STATUS.DRAFT,
    label: 'Draft',
  },
  {
    value: ORDER_STATUS.PENDING,
    label: 'Pending',
  },
  {
    value: ORDER_STATUS.CONFIRMED,
    label: 'Confirmed',
  },
  {
    value: ORDER_STATUS.PREPARING,
    label: 'Preparing',
  },
  {
    value: ORDER_STATUS.READY,
    label: 'Ready',
  },
  {
    value: ORDER_STATUS.COMPLETED,
    label: 'Completed',
  },
  {
    value: ORDER_STATUS.CANCELLED,
    label: 'Cancelled',
  },
]

export const ORDER_STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] ?? status
}
