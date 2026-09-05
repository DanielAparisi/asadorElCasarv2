import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

type Mode = 'signIn' | 'signUp'

const ACCESS_REQUESTS_EMAIL = 'daniel.aparisi.lozano@gmail.com'

function LoginForm() {
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signUp, signIn, submitting, error, notice, clearMessages } = useAuth()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (mode === 'signUp') {
      const created = await signUp(email, password)
      if (created) setMode('signIn')
    } else {
      await signIn(email, password)
    }
  }

  function toggleMode() {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn')
    clearMessages()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-80 bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4">Asador El Casar</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-green-700">{notice}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-gray-800 text-white rounded py-2 disabled:opacity-50"
          >
            {submitting
              ? 'Enviando…'
              : mode === 'signIn'
                ? 'Entrar'
                : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-4 text-sm">
          {mode === 'signIn'
            ? '¿Aún no tienes cuenta? '
            : '¿Ya tienes cuenta? '}
          <button type="button" onClick={toggleMode} className="underline">
            {mode === 'signIn' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>

        {/* Signing up does not grant panel access: an admin grants it by hand
            from /admins. */}
        <p className="mt-3 text-xs text-gray-500">
          El acceso de administrador se concede a mano. Si lo necesitas, escribe
          a{' '}
          <a href={`mailto:${ACCESS_REQUESTS_EMAIL}`} className="underline">
            {ACCESS_REQUESTS_EMAIL}
          </a>
          .
        </p>
      </div>
    </div>
  )
}

export default LoginForm
