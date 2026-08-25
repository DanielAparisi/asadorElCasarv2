import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

type Admin = {
  id: number
  created_at: string
  name: string
}

function App() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function getAdmins() {
      const { data, error } = await supabase
        .from('Admins')
        .select()
        .abortSignal(controller.signal)

      if (controller.signal.aborted) return

      if (error) setError(error.message)
      else setAdmins(data)

      setLoading(false)
    }

    getAdmins()
    return () => controller.abort()
  }, [])


  return (
    <div>
      <h1>Admins</h1>
      {admins.length === 0 ? (
        <p>No hay admins todavía.</p>
      ) : (
        <ul>
          {admins.map((admin) => (
            <li key={admin.id}>{admin.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
