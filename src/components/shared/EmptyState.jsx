export default function EmptyState({
  title = 'Belum ada data',
  message = 'Belum tersedia data untuk ditampilkan.',
}) {
  return (
    <div className="flex min-h-[30vh] items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm opacity-60">{message}</p>
      </div>
    </div>
  )
}
