function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-80 bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4">Asador El Casar</h1>

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm">Contraseña</label>
            <input
              id="password"
              type="password"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" />
            Mantener sesión iniciada
          </label>

          <button type="submit" className="bg-gray-800 text-white rounded py-2">
            Entrar
          </button>
        </form>

        <p className="mt-4 text-sm">
          ¿Aún no tienes cuenta? <a href="#" className="underline">Regístrate</a>
        </p>
      </div>
    </div>
  )
}

export default Login
