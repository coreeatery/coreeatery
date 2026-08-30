import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMenuItems } from '../../features/menu/menu'
import { getTables } from '../../features/tables/tables'
import {
  calculateOrderTotals,
  createOrder,
  addOrderItem,
} from '../../features/orders/orders'

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)

const createOrderNumber = () => {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replaceAll('-', '')
  const time = now
    .toTimeString()
    .slice(0, 8)
    .replaceAll(':', '')

  return `ORD-${date}-${time}`
}

export default function NewOrderPage() {
  const navigate = useNavigate()

  const [menuItems, setMenuItems] = useState([])
  const [tables, setTables] = useState([])
  const [cart, setCart] = useState([])

  const [tableId, setTableId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [serviceCharge, setServiceCharge] = useState(0)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [menu, restaurantTables] = await Promise.all([
          getMenuItems(),
          getTables(),
        ])

        setMenuItems(menu)
        setTables(restaurantTables)
      } catch (err) {
        setError(err.message || 'Gagal memuat data.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const categories = useMemo(() => {
    const map = new Map()

    menuItems.forEach((item) => {
      const categoryData = item.menu_categories

      if (categoryData?.id) {
        map.set(categoryData.id, categoryData.name_id)
      }
    })

    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
    }))
  }, [menuItems])

  const filteredMenu = useMemo(() => {
    const term = search.trim().toLowerCase()

    return menuItems.filter((item) => {
      if (!item.is_available) return false

      if (
        category !== 'all' &&
        item.category_id !== category
      ) {
        return false
      }

      if (!term) return true

      return (
        item.name_id?.toLowerCase().includes(term) ||
        item.name_en?.toLowerCase().includes(term)
      )
    })
  }, [menuItems, search, category])

  const totals = useMemo(
    () =>
      calculateOrderTotals(cart, {
        discountAmount,
        taxAmount,
        serviceCharge,
      }),
    [cart, discountAmount, taxAmount, serviceCharge],
  )

  function getItemPrice(item, variant = null) {
    return Number(variant?.price ?? item.base_price ?? 0)
  }

  function addToCart(item, variant = null) {
    const price = getItemPrice(item, variant)
    const cartId = variant
      ? `${item.id}-${variant.id}`
      : item.id

    setCart((current) => {
      const existing = current.find(
        (cartItem) => cartItem.cartId === cartId,
      )

      if (existing) {
        return current.map((cartItem) =>
          cartItem.cartId === cartId
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
                subtotal:
                  (cartItem.quantity + 1) *
                  cartItem.unit_price,
              }
            : cartItem,
        )
      }

      return [
        ...current,
        {
          cartId,
          menu_item_id: item.id,
          variant_id: variant?.id ?? null,
          item_name: variant
            ? `${item.name_id} - ${variant.name_id}`
            : item.name_id,
          quantity: 1,
          unit_price: price,
          discount_amount: 0,
          subtotal: price,
          notes: '',
        },
      ]
    })
  }

  function changeQuantity(cartId, quantity) {
    if (quantity <= 0) {
      setCart((current) =>
        current.filter((item) => item.cartId !== cartId),
      )
      return
    }

    setCart((current) =>
      current.map((item) =>
        item.cartId === cartId
          ? {
              ...item,
              quantity,
              subtotal:
                quantity * Number(item.unit_price),
            }
          : item,
      ),
    )
  }

  function removeFromCart(cartId) {
    setCart((current) =>
      current.filter((item) => item.cartId !== cartId),
    )
  }

  async function handleSaveOrder() {
    if (cart.length === 0) {
      setError('Tambahkan minimal satu menu.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const order = await createOrder({
        order_number: createOrderNumber(),
        table_id: tableId || null,
        customer_name: customerName.trim() || null,
        status: 'pending',
        payment_status: 'unpaid',
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        tax_amount: totals.taxAmount,
        service_charge: totals.serviceCharge,
        total_amount: totals.totalAmount,
        notes: notes.trim() || null,
      })

      await Promise.all(
        cart.map((item) =>
          addOrderItem({
            order_id: order.id,
            menu_item_id: item.menu_item_id,
            variant_id: item.variant_id,
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount,
            subtotal: item.subtotal,
            notes: item.notes || null,
          }),
        ),
      )

      navigate(`/cashier/orders/${order.id}`)
    } catch (err) {
      setError(err.message || 'Gagal membuat order.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-neutral-500">
          Memuat menu dan meja...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold">
          Order Baru
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Buat pesanan pelanggan dari POS.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Meja
                </label>

                <select
                  value={tableId}
                  onChange={(event) =>
                    setTableId(event.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2.5"
                >
                  <option value="">Tanpa meja / Take Away</option>

                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Meja {table.table_number} · {table.capacity} orang
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nama pelanggan
                </label>

                <input
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(event.target.value)
                  }
                  placeholder="Opsional"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2.5"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Cari menu..."
                className="flex-1 rounded-xl border border-neutral-300 px-3 py-2.5"
              />

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="rounded-xl border border-neutral-300 px-3 py-2.5"
              >
                <option value="all">Semua kategori</option>

                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMenu.map((item) => {
              const variants =
                item.menu_variants?.filter(
                  (variant) => variant.is_available,
                ) ?? []

              if (variants.length > 0) {
                return variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() =>
                      addToCart(item, variant)
                    }
                    className="rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-400"
                  >
                    <p className="font-semibold">
                      {item.name_id}
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                      {variant.name_id}
                    </p>

                    <p className="mt-3 font-bold">
                      {formatRupiah(variant.price)}
                    </p>
                  </button>
                ))
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addToCart(item)}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-400"
                >
                  <p className="font-semibold">
                    {item.name_id}
                  </p>

                  <p className="mt-3 font-bold">
                    {formatRupiah(item.base_price)}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 p-4">
            <h2 className="font-bold">Keranjang</h2>
            <p className="mt-1 text-xs text-neutral-500">
              {cart.length} jenis menu
            </p>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-4">
            {cart.length === 0 ? (
              <p className="py-10 text-center text-sm text-neutral-500">
                Belum ada menu.
              </p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.cartId}
                    className="border-b border-neutral-100 pb-4"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {item.item_name}
                        </p>

                        <p className="text-sm text-neutral-500">
                          {formatRupiah(item.unit_price)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.cartId)
                        }
                        className="text-xs text-red-600"
                      >
                        Hapus
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(
                              item.cartId,
                              item.quantity - 1,
                            )
                          }
                          className="h-8 w-8 rounded-lg border"
                        >
                          −
                        </button>

                        <span className="w-8 text-center text-sm">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(
                              item.cartId,
                              item.quantity + 1,
                            )
                          }
                          className="h-8 w-8 rounded-lg border"
                        >
                          +
                        </button>
                      </div>

                      <strong>
                        {formatRupiah(item.subtotal)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-neutral-200 p-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <strong>{formatRupiah(totals.subtotal)}</strong>
            </div>

            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                Diskon
              </label>

              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(event) =>
                  setDiscountAmount(event.target.value)
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                Pajak
              </label>

              <input
                type="number"
                min="0"
                value={taxAmount}
                onChange={(event) =>
                  setTaxAmount(event.target.value)
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                Service Charge
              </label>

              <input
                type="number"
                min="0"
                value={serviceCharge}
                onChange={(event) =>
                  setServiceCharge(event.target.value)
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                Catatan
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows="2"
                placeholder="Catatan order..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
            </div>

            <div className="flex justify-between border-t pt-4 text-lg">
              <span className="font-bold">TOTAL</span>
              <strong>{formatRupiah(totals.totalAmount)}</strong>
            </div>

            <button
              type="button"
              disabled={saving || cart.length === 0}
              onClick={handleSaveOrder}
              className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Menyimpan...' : 'Simpan Order'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
