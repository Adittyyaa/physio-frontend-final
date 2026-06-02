import React, { useEffect, useMemo } from 'react'
import { FiCalendar, FiClipboard, FiUser } from 'react-icons/fi'
import { GiMuscleUp } from 'react-icons/gi'
import toast from 'react-hot-toast'
import { useAppStore } from '../store/appStore'
import { useIdleTimeout } from '../hooks/useIdleTimeout'
import { TopBar } from '../components/layout/TopBar'
import { Tabs } from '../components/layout/Tabs'
import { BottomNav } from '../components/layout/BottomNav'
import { AppointmentsSection } from '../components/appointments/AppointmentsSection'
import { SessionsSection } from '../components/sessions/SessionsSection'
import { ExercisesSection } from '../components/exercises/ExercisesSection'
import { Avatar, Badge, Card, StatCard } from '../components/ui'
import { formatDate, painColor, today } from '../lib/utils'

const TABS = [
  { id: 'profile',       icon: FiUser,      label: 'Profile'    },
  { id: 'appointments',  icon: FiCalendar,  label: 'Schedule'   },
  { id: 'sessions',      icon: FiClipboard, label: 'Sessions'   },
  { id: 'exercises',     icon: GiMuscleUp,  label: 'Exercises'  },
]

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-2.5 last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-xs font-semibold uppercase tracking-wide w-28 flex-shrink-0" style={{ color: 'var(--text-3)' }}>{label}</span>
      <span className="text-sm text-right flex-1" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

function ProfileTab({ patient, user, appointments, sessions }) {
  const todayStr = today()

  const upcoming = useMemo(() =>
    appointments
      .filter((a) => (a.status || 'scheduled') === 'scheduled' && a.date >= todayStr)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [appointments, todayStr]
  )

  const completedSessions = sessions.filter((s) => s.patient_id === patient?.id)
  const lastSession = [...sessions].sort((a, b) => b.date.localeCompare(a.date))[0]
  const sessionsWithPain = sessions.filter((s) => s.pain != null)
  const avgPain = sessionsWithPain.length
    ? (sessionsWithPain.reduce((sum, s) => sum + s.pain, 0) / sessionsWithPain.length).toFixed(1)
    : null

  const nextAppt = upcoming[0]

  return (
    <div className="p-4 space-y-4">

      {/* Hero card */}
      <div className="bg-gradient-to-br from-[#0f766e] to-[#134e4a] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {patient?.name
              ? patient.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
              : '?'}
          </div>
          <div>
            <div className="text-xl font-bold leading-tight">{patient?.name || 'Patient'}</div>
            <div className="text-sm opacity-75 mt-0.5">{user?.email}</div>
            {patient?.active !== false ? (
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                Active Patient
              </span>
            ) : (
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-white/10 rounded-full text-xs font-semibold opacity-60">
                Discharged
              </span>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <div className="text-xl font-bold">{upcoming.length}</div>
            <div className="text-[10px] opacity-75 mt-0.5 uppercase tracking-wide">Upcoming</div>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <div className="text-xl font-bold">{sessions.length}</div>
            <div className="text-[10px] opacity-75 mt-0.5 uppercase tracking-wide">Sessions</div>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <div className="text-xl font-bold">{avgPain ?? '—'}</div>
            <div className="text-[10px] opacity-75 mt-0.5 uppercase tracking-wide">Avg Pain</div>
          </div>
        </div>
      </div>

      {/* Next appointment banner */}
      {nextAppt && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--green-soft)', border: '1px solid var(--green)' }}>
          <div className="w-10 h-10 bg-[#22c55e] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <FiCalendar size={18} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--green)' }}>Next Appointment</div>
            <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--text)' }}>
              {formatDate(nextAppt.date)} at {nextAppt.time}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-2)' }}>{nextAppt.type}{nextAppt.duration ? ` · ${nextAppt.duration} min` : ''}</div>
          </div>
        </div>
      )}

      {/* Personal details */}
      <Card>
        <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-3)' }}>Personal Details</div>
        <InfoRow label="Full Name"    value={patient?.name} />
        <InfoRow label="Age"          value={patient?.age ? `${patient.age} years` : null} />
        <InfoRow label="Gender"       value={patient?.gender} />
        <InfoRow label="Phone"        value={patient?.phone} />
        <InfoRow label="Patient ID"   value={patient?.id} />
      </Card>

      {/* Clinical details */}
      <Card>
        <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-3)' }}>Clinical Details</div>
        <InfoRow label="Diagnosis"       value={patient?.diagnosis} />
        <InfoRow label="Treatment Area"  value={patient?.treatment_area} />
        <InfoRow label="Referred By"     value={patient?.referred_by} />
        {patient?.notes && (
          <div className="mt-2 p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Notes</div>
            <div className="text-sm" style={{ color: 'var(--text-2)' }}>{patient.notes}</div>
          </div>
        )}
      </Card>

      {/* Last session summary */}
      {lastSession && (
        <Card>
          <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-3)' }}>Last Session</div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{formatDate(lastSession.date)}</div>
            {lastSession.pain != null && (
              <div style={{ color: painColor(lastSession.pain) }} className="text-lg font-extrabold">
                {lastSession.pain}<span className="text-xs font-normal" style={{ color: 'var(--text-3)' }}>/10</span>
              </div>
            )}
          </div>
          {lastSession.exercises?.length > 0 && (
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--teal)' }}>
              {lastSession.exercises.join(' · ')}
            </div>
          )}
          {lastSession.progress && (
            <div className="text-sm" style={{ color: 'var(--text-2)' }}>{lastSession.progress}</div>
          )}
          {lastSession.next_plan && (
            <div className="mt-2 p-2.5 rounded-xl" style={{ background: 'var(--teal-soft)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--teal-dim)' }}>Next Plan</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--teal-dim)' }}>{lastSession.next_plan}</div>
            </div>
          )}
        </Card>
      )}

    </div>
  )
}

export function PatientDashboard({ user, onLogout, dark, onToggleDark }) {
  const dataLoading = useAppStore((s) => s.dataLoading)
  const patients    = useAppStore((s) => s.patients)
  const appointments = useAppStore((s) => s.appointments)
  const sessions    = useAppStore((s) => s.sessions)
  const activeTab   = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)

  const patient = patients?.[0] || null

  // Auto logout after 15 minutes of inactivity
  useIdleTimeout(async () => {
    if (user) {
      toast.error('Session expired due to inactivity. Please log in again.', {
        duration: 5000,
      })
      await onLogout()
    }
  }, 15 * 60 * 1000) // 15 minutes

  useEffect(() => {
    // Default to profile tab for patients
    if (activeTab === 'patients') setActiveTab('profile')
  }, [])

  return (
    <div className="w-full max-w-[480px] lg:max-w-full mx-auto min-h-screen relative pb-20" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <TopBar user={user} onLogout={onLogout} onStats={() => {}} showStats={false} dark={dark} onToggleDark={onToggleDark} />

      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        items={TABS}
      />

      {dataLoading ? (
        <div className="flex items-center justify-center py-16 text-[#94a3b8]">Loading...</div>
      ) : (
        <>
          {activeTab === 'profile'       && <ProfileTab patient={patient} user={user} appointments={appointments} sessions={sessions} />}
          {activeTab === 'appointments'  && <AppointmentsSection />}
          {activeTab === 'sessions'      && <SessionsSection />}
          {activeTab === 'exercises'     && <ExercisesSection />}
        </>
      )}

      <BottomNav
        active={activeTab}
        onChange={setActiveTab}
        items={TABS}
        className="lg:hidden"
      />
    </div>
  )
}
