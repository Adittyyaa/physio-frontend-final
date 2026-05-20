import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/appStore'

export function useAuth() {
  const { user, authLoading, setUser, setAuthLoading, loadData, loadPatientData } = useAppStore()
  const role = user?.user_metadata?.role || 'therapist'
  const patientId = user?.user_metadata?.patient_id || null

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
      if (session?.user) {
        const r = session.user.user_metadata?.role || 'therapist'
        if (r === 'patient') loadPatientData()
        else loadData()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const r = session.user.user_metadata?.role || 'therapist'
        if (r === 'patient') loadPatientData()
        else loadData()
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