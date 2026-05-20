import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { useAppStore } from './store/appStore'
import { useDarkMode } from './hooks/useDarkMode'

import { AuthPage } from './pages/AuthPage'
import { ConfirmPage } from './pages/ConfirmPage'
import { PatientDashboard } from './pages/PatientDashboard'
import { TopBar } from './components/layout/TopBar'
import { Tabs } from './components/layout/Tabs'
import { BottomNav } from './components/layout/BottomNav'
import { FAB } from './components/layout/FAB'

import { PatientsSection } from './components/patients/PatientsSection'
import { AppointmentsSection } from './components/appointments/AppointmentsSection'
import { SessionsSection } from './components/sessions/SessionsSection'
import { ExercisesSection } from './components/exercises/ExercisesSection'
import { StatsModal } from './components/modals/StatsModal'

import { PatientFormModal } from './components/patients/PatientFormModal'
import { AppointmentFormModal } from './components/appointments/AppointmentFormModal'
import { SessionFormModal } from './components/sessions/SessionFormModal'
import { ExerciseFormModal } from './components/exercises/ExerciseFormModal'

function getAuthRedirectType() {
  const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : ''
  if (!hash) return null
  const params = new URLSearchParams(hash)
  return params.get('type')
}

function getAuthRoleFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search || '')
    const role = (params.get('role') || '').toLowerCase()
    if (role === 'patient' || role === 'therapist') return role
  } catch {
    // ignore
  }
  return null
}

function clearAuthRedirectFromUrl() {
  if (!window.location.hash) return
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
}

export default function App() {
  const { user, role, authLoading, signOut } = useAuth()
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const dataLoading = useAppStore((s) => s.dataLoading)
  const [dark, setDark] = useDarkMode()

  const [showConfirm, setShowConfirm] = useState(() => getAuthRedirectType() === 'signup')
  const [showStats, setShowStats] = useState(false)
  // For cross-section navigation (patient detail → log session / book appt)
  const [sessionPrePatient, setSessionPrePatient] = useState(null)
  const [apptPrePatient, setApptPrePatient] = useState(null)

  // FAB modals (quick-add from current tab)
  const [fabPatient, setFabPatient] = useState(false)
  const [fabAppt, setFabAppt] = useState(false)
  const [fabSession, setFabSession] = useState(false)
  const [fabExercise, setFabExercise] = useState(false)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f0fdfa] flex items-center justify-center">
        <div className="text-[#0f766e] text-lg font-display">PhysioTrack</div>
      </div>
    )
  }

  if (showConfirm) {
    return (
      <ConfirmPage
        onContinue={() => {
          clearAuthRedirectFromUrl()
          setShowConfirm(false)
        }}
      />
    )
  }

  if (!user) return <AuthPage initialAccountType={getAuthRoleFromUrl()} />

  if (role === 'patient') {
    return (
      <PatientDashboard
        user={user}
        onLogout={async () => { await signOut() }}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
      />
    )
  }

  const handleLogSession = (patientId) => {
    setActiveTab('sessions')
    setSessionPrePatient(patientId)
  }

  const handleBookAppt = (patientId) => {
    setActiveTab('appointments')
    setApptPrePatient(patientId)
  }

  const handleSearch = () => {
    setActiveTab('patients')
  }

  const handleFAB = () => {
    if (activeTab === 'patients') setFabPatient(true)
    else if (activeTab === 'appointments') setFabAppt(true)
    else if (activeTab === 'sessions') setFabSession(true)
    else if (activeTab === 'exercises') setFabExercise(true)
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative pb-20" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { fontFamily: 'DM Sans, sans-serif', fontSize: 13, borderRadius: 24, background: '#0f172a', color: '#fff', marginBottom: 90 },
        }}
      />

      <TopBar onSearch={handleSearch} onStats={() => setShowStats(true)} user={user} onLogout={handleLogout} dark={dark} onToggleDark={() => setDark((d) => !d)} />
      <Tabs active={activeTab} onChange={setActiveTab} />

      {dataLoading ? (
        <div className="flex items-center justify-center py-16 text-[#94a3b8]">Loading...</div>
      ) : (
        <>
          {activeTab === 'patients' && (
            <PatientsSection onLogSession={handleLogSession} onBookAppt={handleBookAppt} />
          )}
          {activeTab === 'appointments' && (
            <AppointmentsSection
              prePatientId={apptPrePatient}
              onClear={() => setApptPrePatient(null)}
            />
          )}
          {activeTab === 'sessions' && (
            <SessionsSection
              prePatientId={sessionPrePatient}
              onClear={() => setSessionPrePatient(null)}
            />
          )}
          {activeTab === 'exercises' && <ExercisesSection />}
        </>
      )}

      <BottomNav active={activeTab} onChange={setActiveTab} />
      <FAB onClick={handleFAB} />

      <StatsModal open={showStats} onClose={() => setShowStats(false)} />

      {/* FAB-triggered modals */}
      <PatientFormModal patient={null} open={fabPatient} onClose={() => setFabPatient(false)} />
      <AppointmentFormModal open={fabAppt} onClose={() => setFabAppt(false)} />
      <SessionFormModal open={fabSession} onClose={() => setFabSession(false)} />
      <ExerciseFormModal open={fabExercise} onClose={() => setFabExercise(false)} />
    </div>
  )
}
