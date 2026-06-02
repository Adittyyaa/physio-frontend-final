import React, { useState, useEffect } from 'react'
import { FiClipboard } from 'react-icons/fi'
import { useAppStore } from '../../store/appStore'
import { SearchBar, EmptyState, Card } from '../ui'
import { SessionFormModal } from './SessionFormModal'
import { formatDate, painColor } from '../../lib/utils'

export function SessionsSection({ prePatientId, onClear }) {
  const sessions = useAppStore((s) => s.sessions)
  const patientMode = useAppStore((s) => (s.user?.user_metadata?.role || 'therapist') === 'patient')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [sessionPatientId, setSessionPatientId] = useState(null)

  useEffect(() => {
    if (prePatientId) {
      setSessionPatientId(prePatientId)
      setShowForm(true)
      if (onClear) onClear()
    }
  }, [prePatientId])

  const filtered = sessions
    .filter((s) => !search || s.patient_name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))

  const openLog = (patientId = null) => {
    setSessionPatientId(patientId)
    setShowForm(true)
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-display text-xl">Sessions</h2>
        {!patientMode ? (
          <button
            onClick={() => openLog()}
            className="px-3 py-1.5 bg-[#0f766e] text-white text-xs font-semibold rounded-lg"
          >
            + Log
          </button>
        ) : null}
      </div>

      {!patientMode ? (
        <SearchBar value={search} onChange={setSearch} placeholder="Search by patient..." />
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState icon={FiClipboard} title="No sessions logged" sub="Tap + Log after each session" />
      ) : (
        filtered.map((s) => {
          const pc = s.pain !== null && s.pain !== undefined ? painColor(s.pain) : null
          return (
            <Card key={s.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>{s.patient_name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {formatDate(s.date)} · Session #{s.session_num || '?'}
                  </div>
                </div>
                {pc && (
                  <div style={{ color: pc }} className="text-xl font-extrabold leading-none">
                    {s.pain}
                    <span className="text-[11px] font-normal" style={{ color: 'var(--text-3)' }}>/10</span>
                  </div>
                )}
              </div>
              {s.exercises && s.exercises.length > 0 && (
                <div className="mb-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Exercises</div>
                  <div className="text-[13px]" style={{ color: 'var(--teal)' }}>{s.exercises.join(' · ')}</div>
                </div>
              )}
              {s.progress && (
                <div className="mb-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Progress</div>
                  <div className="text-[13px]" style={{ color: 'var(--text-2)' }}>{s.progress}</div>
                </div>
              )}
              {s.next_plan && (
                <div className="p-2 rounded-lg" style={{ background: 'var(--teal-soft)' }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--teal-dim)' }}>Next Session Plan</div>
                  <div className="text-[13px] mt-0.5" style={{ color: 'var(--teal-dim)' }}>{s.next_plan}</div>
                </div>
              )}
              {s.rating ? (
                <div className="mt-2 text-sm">
                  {'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}
                </div>
              ) : null}
            </Card>
          )
        })
      )}

      {!patientMode ? (
        <SessionFormModal
          prePatientId={sessionPatientId}
          open={showForm}
          onClose={() => { setShowForm(false); setSessionPatientId(null) }}
        />
      ) : null}
    </div>
  )
}
