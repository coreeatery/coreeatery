import { useParams } from 'react-router-dom'

export default function MenuDetailPage() {
  const { id } = useParams()

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-sm opacity-50">Menu ID: {id}</p>
      <h1 className="mt-2 text-3xl font-bold">Menu Detail</h1>
    </main>
  )
}
