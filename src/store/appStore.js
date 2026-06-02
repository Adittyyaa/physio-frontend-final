import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { uid, formatDate, patientCode4 } from '../lib/utils'
import { DEFAULT_EXERCISES } from '../lib/defaultData'
import toast from 'react-hot-toast'

export const useAppStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────
  user: null,
  authLoading: true,

  setUser: (user) => set({ user }),
  setAuthLoading: (authLoading) => set({ authLoading }),

  // ── Data ──────────────────────────────────────────────────
  patients: [],
  appointments: [],
  sessions: [],
  exercises: [],
  dataLoading: false,

  // ── UI State ──────────────────────────────────────────────
  activeTab: 'patients',
  setActiveTab: (activeTab) => set({ activeTab }),

  // ── Load all data ─────────────────────────────────────────
  loadData: async () => {
    const { user } = get()
    if (!user) return
    set({ dataLoading: true })
    try {
      const [pRes, aRes, sRes, eRes] = await Promise.all([
        supabase.from('tbl_patients').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tbl_appointments').select('*').eq('user_id', user.id).order('date', { ascending: true }),
        supabase.from('tbl_sessions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('tbl_exercises').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      ])
      const patients = pRes.data || []
      const exercises = eRes.data || []

      // Seed default exercises if user has none
      if (exercises.length === 0) {
        const seeded = DEFAULT_EXERCISES.map((e) => ({ ...e, user_id: user.id }))
        const { data: insertedExercises } = await supabase.from('tbl_exercises').insert(seeded).select()
        set({
          patients,
          appointments: aRes.data || [],
          sessions: sRes.data || [],
          exercises: insertedExercises || seeded,
        })
      } else {
        set({
          patients,
          appointments: aRes.data || [],
          sessions: sRes.data || [],
          exercises,
        })
      }
    } catch (err) {
      console.error('Load data error:', err)
    } finally {
      set({ dataLoading: false })
    }
  },

  // ── Load patient portal data ───────────────────────────────
  loadPatientData: async () => {
    set({ dataLoading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: patientRow, error: patientError } = await supabase
        .from('tbl_patients')
        .select('*')
        .eq('patient_auth_id', user.id)
        .maybeSingle()

      if (patientError) {
        console.error('Patient lookup error:', patientError)
        throw patientError
      }

      if (!patientRow) {
        console.warn('No patient row found for auth user:', user.id)
        set({ patients: [], appointments: [], sessions: [], exercises: [] })
        return
      }

      console.log('Patient found:', patientRow.id, '| therapist user_id:', patientRow.user_id)

      const [aRes, sRes, eRes] = await Promise.all([
        supabase.from('tbl_appointments').select('*').eq('patient_id', patientRow.id).order('date', { ascending: true }),
        supabase.from('tbl_sessions').select('*').eq('patient_id', patientRow.id).order('date', { ascending: false }),
        supabase.from('tbl_exercises').select('*').eq('patient_id', patientRow.id).order('created_at', { ascending: true }),
      ])

      console.log('Appointments fetched:', aRes.data?.length, aRes.error)
      console.log('Sessions fetched:', sRes.data?.length, sRes.error)

      set({
        patients: [patientRow],
        appointments: aRes.data || [],
        sessions: sRes.data || [],
        exercises: eRes.data || [],
      })
    } catch (err) {
      console.error('Load patient data error:', err)
      set({ patients: [], appointments: [], sessions: [], exercises: [] })
    } finally {
      set({ dataLoading: false })
    }
  },

  // ── PATIENTS ──────────────────────────────────────────────
  addPatient: async (data) => {
    const { user } = get()
    const makeRecord = (id) => ({ ...data, id, user_id: user.id, created_at: new Date().toISOString() })

    let record = makeRecord(data?.id || patientCode4())
    for (let attempt = 0; attempt < 5; attempt += 1) {
      let { error } = await supabase.from('tbl_patients').insert(record)
      if (error && (String(error.message || '').includes('patient_email') || String(error.details || '').includes('patient_email'))) {
        const { patient_email, ...rest } = record
        record = rest
        ;({ error } = await supabase.from('tbl_patients').insert(record))
      }
      if (!error) {
        set((s) => ({ patients: [record, ...s.patients] }))
        toast.success('Patient added')
        return true
      }
      if (String(error.code) === '23505') {
        record = makeRecord(patientCode4())
        continue
      }
      console.error('Add patient error:', error)
      toast.error(error.message || 'Failed to add patient')
      return false
    }
    toast.error('Could not generate unique patient code')
    return false
  },

  updatePatient: async (id, data) => {
    let { error } = await supabase.from('tbl_patients').update(data).eq('id', id)
    if (error && (String(error.message || '').includes('patient_email') || String(error.details || '').includes('patient_email'))) {
      const { patient_email, ...rest } = data || {}
      ;({ error } = await supabase.from('tbl_patients').update(rest).eq('id', id))
    }
    if (error) { toast.error('Failed to update patient'); return false }
    set((s) => ({ patients: s.patients.map((p) => (p.id === id ? { ...p, ...data } : p)) }))
    toast.success('Patient updated')
    return true
  },

  deletePatient: async (id) => {
    const { error } = await supabase.from('tbl_patients').delete().eq('id', id)
    if (error) { toast.error('Failed to delete patient'); return false }
    await supabase.from('tbl_appointments').delete().eq('patient_id', id)
    await supabase.from('tbl_sessions').delete().eq('patient_id', id)
    set((s) => ({
      patients: s.patients.filter((p) => p.id !== id),
      appointments: s.appointments.filter((a) => a.patient_id !== id),
      sessions: s.sessions.filter((s2) => s2.patient_id !== id),
    }))
    toast.success('Patient deleted')
    return true
  },

  // ── APPOINTMENTS ──────────────────────────────────────────
  addAppointment: async (data) => {
    const { user } = get()
    const record = { ...data, id: uid(), user_id: user.id, created_at: new Date().toISOString() }
    const { error } = await supabase.from('tbl_appointments').insert(record)
    if (error) { toast.error('Failed to book appointment'); return false }
    set((s) => ({ appointments: [...s.appointments, record].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) }))
    toast.success('Appointment booked')
    return true
  },

  updateAppointment: async (id, data) => {
    const { error } = await supabase.from('tbl_appointments').update(data).eq('id', id)
    if (error) { toast.error('Failed to update appointment'); return false }
    set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...data } : a)) }))
    return true
  },

  updateAppointmentStatus: async (id, status) => {
    const { error } = await supabase.from('tbl_appointments').update({ status }).eq('id', id)
    if (error) { toast.error('Failed to update status'); return false }
    set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)) }))
    const msg = status === 'completed' ? 'Marked complete ✓' : status === 'cancelled' ? 'Appointment cancelled' : 'Status updated'
    toast.success(msg)
    return true
  },

  // ── SESSIONS ──────────────────────────────────────────────
  addSession: async (data) => {
    const { user } = get()
    const record = { ...data, id: uid(), user_id: user.id, created_at: new Date().toISOString() }
    const { error } = await supabase.from('tbl_sessions').insert(record)
    if (error) { toast.error('Failed to save session'); return false }
    set((s) => ({ sessions: [record, ...s.sessions] }))
    toast.success('Session logged')
    return true
  },

  // ── EXERCISES ─────────────────────────────────────────────
  addExercise: async (data) => {
    const { user } = get()
    const record = { ...data, id: uid(), user_id: user.id, created_at: new Date().toISOString() }
    const { error } = await supabase.from('tbl_exercises').insert(record)
    if (error) { toast.error('Failed to add exercise'); return false }
    set((s) => ({ exercises: [...s.exercises, record] }))
    toast.success('Exercise added to library')
    return true
  },

  updateExercise: async (id, data) => {
    const { error } = await supabase.from('tbl_exercises').update(data).eq('id', id)
    if (error) { toast.error('Failed to update exercise'); return false }
    set((s) => ({ exercises: s.exercises.map((e) => (e.id === id ? { ...e, ...data } : e)) }))
    toast.success('Exercise updated')
    return true
  },

  deleteExercise: async (id) => {
    const { error } = await supabase.from('tbl_exercises').delete().eq('id', id)
    if (error) { toast.error('Failed to delete exercise'); return false }
    set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) }))
    toast.success('Exercise deleted')
    return true
  },

  assignExercise: async (exerciseData, patientId) => {
    const { user } = get()
    const record = {
      ...exerciseData,
      id: uid(),
      user_id: user.id,
      patient_id: patientId,
      created_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('tbl_exercises').insert(record)
    if (error) { toast.error('Failed to assign exercise'); return false }
    set((s) => ({ exercises: [...s.exercises, record] }))
    toast.success('Exercise assigned to patient')
    return true
  },

  removeAssignedExercise: async (id) => {
    const { error } = await supabase.from('tbl_exercises').delete().eq('id', id)
    if (error) { toast.error('Failed to remove exercise'); return false }
    set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) }))
    toast.success('Exercise removed')
    return true
  },

  // ── Patient self-manage exercises ─────────────────────────
  addPatientExercise: async (exerciseData) => {
    const { patients, exercises: currentExercises } = get()
    const patientRow = patients?.[0]
    if (!patientRow) {
      toast.error('Patient record not found. Please contact your therapist.')
      return false
    }

    // Check if already exists in plan
    const alreadyInPlan = currentExercises.some(
      (e) => (e.name || '').trim() === (exerciseData.name || '').trim()
        && (e.category || '').trim() === (exerciseData.category || '').trim()
    )
    if (alreadyInPlan) {
      toast.error('This exercise is already in your plan')
      return false
    }

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      toast.error('Session expired. Please log in again.')
      return false
    }

    const id = uid()
    const record = {
      id,
      name: exerciseData.name,
      category: exerciseData.category,
      reps: exerciseData.reps || null,
      instructions: exerciseData.instructions || null,
      media: exerciseData.media || null,
      user_id: patientRow.user_id, // ✅ Use therapist's user_id, not patient's auth ID
      patient_id: patientRow.id,
      created_at: new Date().toISOString(),
    }

    // Optimistically update UI first
    set((s) => ({ exercises: [...s.exercises, { ...record, active: true }] }))

    const { error } = await supabase.from('tbl_exercises').insert(record)

    if (error) {
      console.error('Add exercise error:', error)
      // Revert optimistic update
      set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) }))
      toast.error(error.message || 'Failed to add exercise')
      return false
    }

    toast.success('Exercise added to your plan ✓')
    return true
  },

  removePatientExercise: async (id) => {
    // Optimistically remove from store first for instant UI feedback
    const { exercises: prev } = get()
    set((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) }))

    const { error } = await supabase.from('tbl_exercises').delete().eq('id', id)
    if (error) {
      console.error('Remove exercise error:', error)
      // Revert on failure
      set({ exercises: prev })
      toast.error('Failed to remove exercise')
      return false
    }
    toast.success('Exercise removed from your plan ✓')
    return true
  },

  togglePatientExerciseActive: async (id) => {
    const { exercises } = get()
    const exercise = exercises.find((e) => e.id === id)
    if (!exercise) {
      console.warn('togglePatientExerciseActive: exercise not found with id:', id)
      return false
    }

    // Toggle: if currently active (true or undefined/null), set to false; if false, set to true
    const currentlyActive = exercise.active !== false
    const newActive = !currentlyActive

    // Optimistic update — create a brand new array to ensure Zustand detects the change
    const updatedExercises = exercises.map((e) =>
      e.id === id ? { ...e, active: newActive } : e
    )
    set({ exercises: updatedExercises })

    // Try to persist to Supabase — if it fails (e.g. column doesn't exist yet),
    // keep the local state change so the UI still works
    try {
      const { error } = await supabase.from('tbl_exercises').update({ active: newActive }).eq('id', id)
      if (error) {
        console.warn('Could not persist active status to database:', error.message)
      }
    } catch (err) {
      console.warn('Toggle active network error:', err)
    }
    toast.success(newActive ? 'Exercise activated ✓' : 'Exercise paused')
    return true
  },
}))