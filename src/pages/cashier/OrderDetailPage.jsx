import { useParams } from 'react-router-dom'

export default function OrderDetailPage() {
  const { id } = useParams()

  return (
    <div>
      <p className="text-sm opacity-50">Order: {id}</p>
      <h1 className="mt-2 text-3xl font-bold">Order Detail</h1>
    </div>
  )
}
