# SOP Reservasi

## Customer flow

1. Customer chooses a date and guest count.
2. The system shows available 30-minute slots from 10:00 to 21:30 WIB.
3. The backend rechecks availability and assigns the smallest suitable active table.
4. The customer receives a reservation code; the booking begins as `pending`.

## Staff flow

1. Review pending reservations in Admin.
2. Confirm, seat, complete, cancel, or mark no-show according to actual service activity.
3. If no suitable table is available, offer a different generated slot. Do not promise a slot before it exists in the system.

## Limitations

The initial MVP uses one table per reservation. Combining tables requires owner approval and a separate release.
