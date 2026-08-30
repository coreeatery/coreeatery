import { useTranslation } from 'react-i18next'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <main className="mx-auto max-w-7xl px-6 py-20">
      <section className="max-w-3xl">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] opacity-60">
          COREÉATERY
        </p>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          {t('common.appName')}
        </h1>

        <p className="mt-6 max-w-2xl text-lg opacity-70">
          Restaurant experience, crafted for people who appreciate good food.
        </p>
      </section>
    </main>
  )
}
