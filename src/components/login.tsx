import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

type Modo = 'login' | 'registro'

const CORREO_SOLICITUDES = 'daniel.aparisi.lozano@gmail.com'

function Login() {
  const [modo, setModo] = useState<Modo>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { registrar, entrar, enviando, error, aviso, limpiarMensajes } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (modo === 'registro') {
      const creada = await registrar(email, password)
      if (creada) setModo('login')
    } else {
      await entrar(email, password)
    }
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
              limpiarMensajes()
            }}
            className="underline"
          >
            {modo === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>

        {/* Registrarse no da acceso al panel: el alta de admin la hace a mano
            un admin desde /admins. */}
        <p className="mt-3 text-xs text-gray-500">
          El acceso de administrador se concede a mano. Si lo necesitas, escribe a{' '}
          <a href={`mailto:${CORREO_SOLICITUDES}`} className="underline">
            {CORREO_SOLICITUDES}
          </a>
          .
        </p>
      </div>
    </div>
  )
}

export default Login
