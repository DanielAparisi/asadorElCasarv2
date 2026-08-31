import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <p className="text-5xl font-semibold mb-2">404</p>
        <p className="mb-4">Esta página no existe.</p>
        <Link to="/" className="underline text-sm">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
