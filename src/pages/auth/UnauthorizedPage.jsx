import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <p className="mb-2 text-sm font-medium text-gray-500">
          403
        </p>

        <h1 className="mb-3 text-3xl font-bold">
          Akses Ditolak
        </h1>

        <p className="mb-6 text-gray-600">
          Akun kamu tidak memiliki izin untuk membuka halaman ini.
        </p>

        <Link
          to="/"
          className="inline-flex rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  )
}
