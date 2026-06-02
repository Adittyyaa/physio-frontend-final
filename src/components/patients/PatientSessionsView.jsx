import React from 'react'
import { FiArrowLeft, FiClipboard, FiTrendingUp } from 'react-icons/fi'
import { GiMuscleUp } from 'react-icons/gi'
import { useAppStore } from '../../store/appStore'
import { Card, EmptyState, Avatar, StatCard } from '../ui'
import { formatDate, painColor } from '../../lib/utils'

export function PatientSessionsView({ patient, onBack }) {
  const sessions = useAppStore((s) => s.sessions)

  if (!patient) return null

  const ptSessions = sessions
    .filter((s) => s.patient_id === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  const sessionsWithPain = ptSessions.filter((s) => s.pain != null && s.pain !== '')
  const avgPain = sessionsWithPain.length
    ? Math.round(sessionsWithPain.reduce((sum, s) => sum + parseInt(s.pain), 0) / sessionsWithPain.length)
    : null

  return (
    <div className="p-4 pb-24">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FiArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar name={patient.name} size="md" />
          <div>
            <div className="font-display text-lg font-semibold">{patient.name}</div>
            <div className="text-xs text-[#64748b]">
              {patient.age ? `${patient.age} yrs` : ''}{patient.gender ? ` · ${patient.gender}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <StatCard num={ptSessions.length} label="Total Sessions" />
        <StatCard num={avgPain !== null ? avgPain : '—'} label="Avg Pain" />
      </div>

      {/* Diagnosis */}
      {patient.diagnosis && (
        <div className="bg-white dark:bg-[#22302f] rounded-2xl p-3 mb-3 border border-[#e2e8f0] dark:border-[#2e4442]">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wide">Diagnosis</div>
          <div className="text-sm mt-1 font-medium">{patient.diagnosis}</div>
        </div>
      )}

      {/* Session History Title */}
      <h3 className="font-display text-lg font-semibold mb-3 mt-5">Session History</h3>

      {/* Sessions List */}
      {ptSessions.length === 0 ? (
        <EmptyState
          icon={FiClipboard}
          title="No sessions yet"
          sub="Sessions will appear here once logged"
        />
      ) : (
        ptSessions.map((s) => {
          const pc = s.pain !== null && s.pain !== undefined ? painColor(s.pain) : null
          return (
            <Card key={s.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                    {formatDate(s.date)}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    Session #{s.session_num || '?'}
                  </div>
                </div>
                {pc && (
                  <div style={{ color: pc }} className="text-2xl font-extrabold leading-none">
                    {s.pain}
                    <span className="text-[11px] font-normal" style={{ color: 'var(--text-3)' }}>/10</span>
                  </div>
                )}
              </div>

              {/* Exercises */}
              {s.exercises && s.exercises.length > 0 && (
                <div className="mb-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                    <GiMuscleUp size={14} /> Exercises
                  </div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--teal)' }}>
                    {s.exercises.join(' · ')}
                  </div>
                </div>
              )}

              {/* Current Treatment */}
              {s.current_treatment && (
                <div className="mb-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>
                    Treatment
                  </div>
                  <div className="text-[13px]" style={{ color: 'var(--text-2)' }}>
                    {s.current_treatment}
                  </div>
                </div>
              )}

              {/* Progress */}
              {s.progress && (
                <div className="mb-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-1 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                    <FiTrendingUp size={14} /> Progress
                  </div>
                  <div className="text-[13px]" style={{ color: 'var(--text-2)' }}>
                    {s.progress}
                  </div>
                </div>
              )}

              {/* Next Plan */}
              {s.next_plan && (
                <div className="p-2.5 rounded-lg mt-2" style={{ background: 'var(--teal-soft)' }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--teal-dim)' }}>
                    Next Session Plan
                  </div>
                  <div className="text-[13px] mt-0.5" style={{ color: 'var(--teal-dim)' }}>
                    {s.next_plan}
                  </div>
                </div>
              )}

              {/* Rating */}
              {s.rating && (
                <div className="mt-2 text-lg">
                  {'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}
                </div>
              )}

              {/* Private Notes (therapist only) */}
              {s.private_notes && (
                <div className="mt-2 p-2 rounded-lg" style={{ background: 'var(--bg)' }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>
                    Private Notes
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-2)' }}>
                    {s.private_notes}
                  </div>
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}
