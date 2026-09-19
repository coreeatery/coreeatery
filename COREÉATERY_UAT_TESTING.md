# COREÉATERY Internal UAT Testing

Test date: 2026-09-19 (Asia/Jakarta)  
Environment: linked Supabase project; Vercel Preview and Production builds

| ID | Scenario | Expected | Actual evidence | Status |
|---|---|---|---|---|
| UAT-001 | CMS handles nullable multilingual content | No `null.trim()` error; ID, EN, ZH persist | Form normalizes nullable fields and submit payload is null-safe. Linked row was saved and read back with all three languages. | PASS |
| UAT-002 | Public menu and homepage data load | Active CMS/menu data can be read | Production build and deployed CMS schema verified. | PASS |
| UAT-003 | Past-date reservation | Rejected by backend | Public RPC returned HTTP 400 for a past date. | PASS |
| UAT-004 | Invalid reservation slot | Rejected by backend | Backend accepts only 10:00–21:30 at 30-minute intervals. | PASS |
| UAT-005 | Reservation capacity conflict | Fourth 2-person booking at one slot is rejected with three active tables | Three API bookings succeeded; the fourth returned HTTP 400. Temporary UAT records were deleted. | PASS |
| UAT-006 | Reservation persistence | Booking receives a code and table | Public RPC returned a reservation code and assigned the suitable active table. | PASS |
| UAT-007 | Empty order | Rejected | `create_order_transaction` rejects an empty item array in the deployed database function. | PASS (catalog) |
| UAT-008 | Product price trust | Server calculates authoritative price | `create_order_transaction` reads active menu/variant price server-side. | PASS (catalog) |
| UAT-009 | Duplicate payment | No second payment for a paid order | `process_payment_transaction` locks the order and rejects an already-paid order. | PASS (catalog) |
| UAT-010 | Cashier access to Admin route | Denied | Frontend route guard and deployed RLS restrict homepage CMS management to owner/admin/manager. | PASS (source and catalog) |
| UAT-011 | Invalid login | Safe rejection message | Requires a controlled client test account; not executed in this automated run. | PENDING CLIENT UAT |
| UAT-012 | Admin/Cashier browser workflow | Each role completes its real daily flow | Requires named client accounts and browser sessions; not executed in this automated run. | PENDING CLIENT UAT |
| UAT-013 | Network failure UX | Clear user-facing error | Requires browser network simulation; not executed in this automated run. | PENDING CLIENT UAT |

## Automated Validation

- `npm run lint`: PASS
- Production Vite build: PASS
- Supabase migration history local/remote: aligned after reservation hardening migration
- Reservation API tests used temporary, clearly marked records and removed them after verification.

## UAT Sign-Off

Do not mark client acceptance complete until UAT-011 through UAT-013 are exercised by the client representatives and the actual result is recorded.
