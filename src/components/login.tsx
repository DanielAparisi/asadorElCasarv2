import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Modo = 'login' | 'registro'

function Login() {
  const [modo, setModo] = useState<Modo>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    setAviso(null)

    if (modo === 'registro') {
      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) setError(error.message)
      else if (!data.session) {
        // El proyecto tiene la confirmación por email activada: hay usuario,
        // pero no hay sesión hasta que se pulse el enlace del correo.
        setAviso('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.')
        setModo('login')
      }
      // Si data.session existe, onAuthStateChange en App se encarga del resto.
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }

    setEnviando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-80 bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4">Asador El Casar</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm">Correo electrónico</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {aviso && <p className="text-sm text-green-700">{aviso}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="bg-gray-800 text-white rounded py-2 disabled:opacity-50"
          >
            {enviando ? 'Enviando…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-4 text-sm">
          {modo === 'login' ? '¿Aún no tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button
            type="button"
            onClick={() => {
              setModo(modo === 'login' ? 'registro' : 'login')
              setError(null)
              setAviso(null)
            }}
            className="underline"
          >
            {modo === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
