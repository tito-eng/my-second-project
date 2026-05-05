import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import AuthPage from './AuthPage'
import HomePage from './HomePage'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    )
  }

  return session ? <HomePage session={session} /> : <AuthPage />
}

function Spinner() {
  return (
    <div style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      border: '3px solid #2f3336',
      borderTopColor: '#1d9bf0',
      animation: 'spin 0.7s linear infinite',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
