export default function PublicFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-sm opacity-60">
          © {new Date().getFullYear()} COREÉATERY
        </p>
      </div>
    </footer>
  )
}
