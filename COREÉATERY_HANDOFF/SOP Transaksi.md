# SOP Transaksi

## Required checks

- An order must contain at least one active, available menu item.
- The server calculates prices and totals from current menu data.
- A paid order cannot receive a second successful payment.

## Failure handling

1. Stop and record the order number.
2. Refresh the order or search the transaction list.
3. If payment is already marked paid, do not retry it.
4. If not paid and no payment record exists, retry only once after verifying network and shift status.
5. Escalate with the order number, time, payment method, and screenshot if the state is unclear.
