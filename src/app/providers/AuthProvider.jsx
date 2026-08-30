import { useEffect, useState } from 'react'
import { AuthContext } from './AuthContext'
import { supabase } from '../../lib/supabase/client'
import { getCurrentProfile } from '../../features/auth/profile'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return undefined

    let mounted = true

    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(currentSession)

      if (currentSession) {
        try {
          const currentProfile = await getCurrentProfile()

          if (mounted) {
            setProfile(currentProfile)
          }
        } catch (error) {
          console.error('Gagal mengambil profile:', error)

          if (mounted) {
            setProfile(null)
          }
        }
      }

      if (mounted) {
        setLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return

      setSession(nextSession)

      if (!nextSession) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const currentProfile = await getCurrentProfile()

        if (mounted) {
          setProfile(currentProfile)
        }
      } catch (error) {
        console.error('Gagal mengambil profile:', error)

        if (mounted) {
          setProfile(null)
        }
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    isAuthenticated: Boolean(session),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
