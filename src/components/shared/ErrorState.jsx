export default function ErrorState({
  title = 'Terjadi kesalahan',
  message = 'Silakan coba lagi.',
  onRetry,
}) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm opacity-70">{message}</p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Coba lagi
          </button>
        )}
      </div>
    </div>
  )
}
