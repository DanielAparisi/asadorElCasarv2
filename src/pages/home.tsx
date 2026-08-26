import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6">
      <div className="text-center max-w-md">
        <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-3">
          Desde 1985
        </p>

        <h1 className="text-4xl font-semibold mb-4">Asador El Casar</h1>

        <p className="text-gray-600 mb-8">
          Cocina de brasa y producto de temporada.
        </p>

        <Link
          to="/login"
          className="inline-block bg-gray-800 text-white rounded px-6 py-2 text-sm hover:bg-gray-700"
        >
          Acceder
        </Link>
      </div>
    </div>
  )
}

export default Home
