export default function LoadingScreen({ label = 'Memuat...' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <p className="text-sm opacity-70">{label}</p>
      </div>
    </div>
  )
}
