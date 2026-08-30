import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/useAuth'
import { signInWithPassword } from '../../features/auth/auth'
import Button from '../../components/shared/Button'
import Input from '../../components/shared/Input'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    const destination = location.state?.from || '/admin'
    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await signInWithPassword(email, password)

      const destination = location.state?.from || '/admin'
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message || 'Login gagal.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-medium tracking-[0.25em] text-neutral-400">
            COREÉATERY
          </p>

          <h1 className="text-3xl font-bold">
            Masuk ke Dashboard
          </h1>

          <p className="mt-2 text-sm text-neutral-400">
            Kelola restoran dari satu tempat.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl"
        >
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@coreeatery.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan password"
            required
          />

          {error && (
            <div className="rounded-xl border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
      </div>
    </main>
  )
}
