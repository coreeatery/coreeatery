import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function PublicFooter() {
  const { t } = useTranslation()

  return (
    <footer className="bg-[#171512] text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-14 sm:px-10 lg:px-16">
        <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Link to="/" className="font-serif text-2xl tracking-[0.08em]">COREÉATERY</Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/45">
              Contemporary dining, thoughtful hospitality, and memorable moments.
            </p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-[#c7aa70]">Explore</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/55">
              <Link to="/menu" className="hover:text-white">{t('nav.menu')}</Link>
              <Link to="/reservasi" className="hover:text-white">{t('nav.reservation')}</Link>
              <Link to="/galeri" className="hover:text-white">{t('nav.gallery')}</Link>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-[#c7aa70]">Reservations</p>
            <Link to="/reservasi" className="mt-4 inline-flex text-sm text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white">
              Reserve your table ↗
            </Link>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 pt-6 text-[9px] uppercase tracking-[0.25em] text-white/30 sm:flex-row">
          <p>© {new Date().getFullYear()} COREÉATERY</p>
          <p>Crafted with intention</p>
        </div>
      </div>
    </footer>
  )
}
