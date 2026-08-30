export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SEATED: 'seated',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
}

export const RESERVATION_STATUS_OPTIONS = [
  {
    value: RESERVATION_STATUS.PENDING,
    label: 'Pending',
  },
  {
    value: RESERVATION_STATUS.CONFIRMED,
    label: 'Confirmed',
  },
  {
    value: RESERVATION_STATUS.SEATED,
    label: 'Seated',
  },
  {
    value: RESERVATION_STATUS.COMPLETED,
    label: 'Completed',
  },
  {
    value: RESERVATION_STATUS.CANCELLED,
    label: 'Cancelled',
  },
  {
    value: RESERVATION_STATUS.NO_SHOW,
    label: 'No Show',
  },
]

export const RESERVATION_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  seated: 'Seated',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

export function getReservationStatusLabel(status) {
  return RESERVATION_STATUS_LABELS[status] ?? status
}
