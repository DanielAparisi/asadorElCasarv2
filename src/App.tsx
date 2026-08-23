import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

type Admin = {
  id: number
  created_at: string
  name: string
}

function App() {
  const [admins, setAdmins] = useState<Admin[]>([])

  useEffect(() => {
    getAdmins()
  }, [])

  async function getAdmins() {
    const { data, error } = await supabase.from('Admins').select()

    if (error) {
      console.error(error)
      return
    }

    setAdmins(data)
  }

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
