import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/appStore'

export function useAuth() {
  const { user, authLoading, setUser, setAuthLoading, loadData, loadPatientData } = useAppStore()
  const role = user?.user_metadata?.role || 'therapist'
  const patientId = user?.user_metadata?.patient_id || null

  useEffect(() => {
    let initialLoadDone = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
      if (session?.user) {
        initialLoadDone = true
        const r = session.user.user_metadata?.role || 'therapist'
        if (r === 'patient') loadPatientData()
        else loadData()
      } else {
        setAuthLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      // Only load data on actual sign-in events, not on every state change
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        if (!initialLoadDone) {
          initialLoadDone = true
          const r = session.user.user_metadata?.role || 'therapist'
          if (r === 'patient') loadPatientData()
          else loadData()
        } else if (event === 'SIGNED_IN') {
          // Fresh sign-in after being logged out
          const r = session.user.user_metadata?.role || 'therapist'
          if (r === 'patient') loadPatientData()
          else loadData()
        }
      }
      if (event === 'SIGNED_OUT') {
        initialLoadDone = false
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'therapist' },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signUpWithMetadata = async (email, password, metadata) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { user, role, patientId, authLoading, signIn, signUp, signUpWithMetadata, signInWithGoogle, signOut }
}