import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UtensilsCrossed,
} from 'lucide-react'
import { useAuth } from '../../app/providers/useAuth'
import { signInWithPassword } from '../../features/auth/auth'

function getRoleDestination(role) {
  switch (role) {
    case 'cashier':
      return '/cashier'

    case 'owner':
    case 'admin':
    case 'manager':
      return '/admin'

    default:
      return '/unauthorized'
  }
}

export default function LoginPage() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user && profile) {
    const destination = getRoleDestination(profile.role)

    if (destination === '/unauthorized') {
      return <Navigate to="/unauthorized" replace />
    }

    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSubmitting(true)

    try {
      const result = await signInWithPassword(email.trim(), password)

      const role = result?.user?.user_metadata?.role

      if (role) {
        navigate(getRoleDestination(role), { replace: true })
        return
      }

      /*
       * AuthProvider akan mengambil profile dari tabel profiles.
       * Kita tidak memaksa redirect ke /admin di sini karena
       * cashier harus masuk ke /cashier.
       */
      const destination = location.state?.from

      if (
        destination &&
        !destination.startsWith('/admin') &&
        !destination.startsWith('/login') &&
        !destination.startsWith('/unauthorized')
      ) {
        navigate(destination, { replace: true })
        return
      }

      /*
       * Jika profile belum tersedia di state saat login,
       * AuthProvider akan memperbaruinya dan LoginPage akan
       * otomatis melakukan redirect berdasarkan profile.role.
       */
    } catch (err) {
      setError(err.message || 'Login gagal.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0c0a09] text-white">
      {/* BACKGROUND DECORATION */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-amber-500/10 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/5" />
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/5" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        {/* LEFT BRANDING */}
        <section className="relative hidden w-1/2 overflow-hidden border-r border-white/5 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/80 via-[#17100c] to-black" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <div>
              <div className="mb-8 inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-950/30">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-lg font-bold tracking-[0.18em]">
                    COREÉATERY
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-orange-400/70">
                    Restaurant Management
                  </p>
                </div>
              </div>

              <div className="max-w-xl">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
                  Management System
                </p>

                <h1 className="text-4xl font-semibold leading-tight text-white xl:text-6xl">
                  Semua operasional restoran,
                  <span className="block bg-gradient-to-r from-orange-300 via-amber-200 to-orange-400 bg-clip-text text-transparent">
                    satu tempat.
                  </span>
                </h1>

                <p className="mt-6 max-w-lg text-base leading-8 text-stone-400">
                  Kelola pesanan, reservasi, menu, promosi, kasir, dan
                  operasional restoran dengan sistem yang terintegrasi.
                </p>
              </div>

              <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                  <p className="text-lg font-semibold text-white">POS</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Kasir & Order
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                  <p className="text-lg font-semibold text-white">CMS</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Konten Restoran
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                  <p className="text-lg font-semibold text-white">Report</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Keuangan
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600">
              © 2026 COREÉATERY · Internal Management System
            </p>
          </div>
        </section>

        {/* RIGHT LOGIN */}
        <section className="flex w-full items-center justify-center px-5 py-8 sm:px-8 lg:w-1/2 lg:px-12">
          <div className="w-full max-w-md">
            {/* MOBILE BRAND */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                <UtensilsCrossed className="h-5 w-5" />
              </div>

              <div>
                <p className="font-bold tracking-[0.18em]">
                  COREÉATERY
                </p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-orange-400/70">
                  Restaurant Management
                </p>
              </div>
            </div>

            {/* CARD */}
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8">
              <div className="mb-8">
                <div className="mb-4 inline-flex items-center rounded-full border border-orange-400/10 bg-orange-400/5 px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300">
                    Secure Access
                  </span>
                </div>

                <h2 className="text-3xl font-semibold tracking-tight text-white">
                  Masuk ke Dashboard
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-400">
                  Gunakan akun yang memiliki izin untuk mengakses sistem
                  COREÉATERY.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-stone-300">
                    Email
                  </label>

                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 transition-colors group-focus-within:text-orange-400" />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@coreeatery.com"
                      autoComplete="email"
                      required
                      className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-stone-600 focus:border-orange-500/60 focus:bg-black/30 focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-300">
                      Password
                    </label>
                  </div>

                  <div className="group relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 transition-colors group-focus-within:text-orange-400" />

                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Masukkan password"
                      autoComplete="current-password"
                      required
                      className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-stone-600 focus:border-orange-500/60 focus:bg-black/30 focus:ring-4 focus:ring-orange-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword
                          ? 'Sembunyikan password'
                          : 'Tampilkan password'
                      }
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-white/5 hover:text-orange-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5">
                    <p className="text-sm leading-5 text-red-300">
                      {error}
                    </p>
                  </div>
                )}

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-950/30 transition-all hover:from-orange-400 hover:to-amber-400 hover:shadow-orange-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 border-t border-white/10 pt-5 text-center">
                <p className="text-xs leading-5 text-stone-500">
                  Akses sistem dibatasi berdasarkan role akun.
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] text-stone-600 lg:hidden">
              © 2026 COREÉATERY
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
