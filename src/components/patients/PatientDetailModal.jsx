import { FiEdit2, FiTrash2, FiPhone, FiCalendar, FiTrendingUp } from 'react-icons/fi'
import { GiMuscleUp } from 'react-icons/gi'
import { Modal } from '../ui/Modal'
import { Button, Avatar, StatCard } from '../ui'
import { useAppStore } from '../../store/appStore'
import { formatDate, sendWhatsApp } from '../../lib/utils'
import { today } from '../../lib/utils'

export function PatientDetailModal({ patient, open, onClose, onEdit, onLogSession, onBookAppt, onAssignExercises, onViewSessions }) {
  const sessions = useAppStore((s) => s.sessions)
  const appointments = useAppStore((s) => s.appointments)
  const deletePatient = useAppStore((s) => s.deletePatient)

  if (!patient) return null

  const ptSessions = sessions
    .filter((s) => s.patient_id === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  const ptAppts = appointments
    .filter((a) => a.patient_id === patient.id)
    .sort((a, b) => a.date.localeCompare(b.date))

  const upcoming = ptAppts.filter(
    (a) => a.date >= today() && a.status !== 'cancelled'
  )

  const sessionsWithPain = ptSessions.filter((s) => s.pain != null && s.pain !== '')
  const avgPain = sessionsWithPain.length
    ? Math.round(sessionsWithPain.reduce((sum, s) => sum + parseInt(s.pain), 0) / sessionsWithPain.length)
    : null

  const lastSession = ptSessions[0]

  const handleDelete = async () => {
    if (!window.confirm('Delete this patient? All their sessions and appointments will also be removed.')) return
    const ok = await deletePatient(patient.id)
    if (ok) onClose()
  }

  return (
    <Modal open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={patient.name} size="lg" />
        <div>
          <div className="font-display text-xl" style={{ color: 'var(--text)' }}>{patient.name}</div>
          <div className="text-[13px]" style={{ color: 'var(--text-2)' }}>
            {patient.age ? `${patient.age} yrs · ` : ''}
            {patient.gender || ''}
            {patient.phone ? ` · ${patient.phone}` : ''}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <StatCard num={ptSessions.length} label="Sessions" />
        <StatCard num={avgPain !== null ? avgPain : '—'} label="Avg Pain" />
      </div>

      {/* Diagnosis */}
      {patient.diagnosis && (
        <div className="rounded-2xl p-3 mb-2.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] uppercase font-semibold tracking-wide" style={{ color: 'var(--text-3)' }}>Diagnosis</div>
          <div className="text-sm mt-1 font-medium" style={{ color: 'var(--text)' }}>{patient.diagnosis}</div>
        </div>
      )}

      {/* Notes */}
      {patient.notes && (
        <div className="rounded-2xl p-3 mb-2.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] uppercase font-semibold tracking-wide" style={{ color: 'var(--text-3)' }}>Notes</div>
          <div className="text-[13px] mt-1" style={{ color: 'var(--text-2)' }}>{patient.notes}</div>
        </div>
      )}

      {/* Next Appointment */}
      {upcoming.length > 0 && (
        <div className="rounded-2xl p-3 mb-2.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] uppercase font-semibold tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>Next Appointment</div>
          {upcoming.slice(0, 2).map((a) => (
            <div key={a.id} className="text-[13px] font-medium flex items-center gap-1" style={{ color: 'var(--text)' }}>
              <FiCalendar size={14} /> {formatDate(a.date)} at {a.time}
            </div>
          ))}
        </div>
      )}

      {/* Last Session */}
      {lastSession && (
        <div className="rounded-2xl p-3 mb-2.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] uppercase font-semibold tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>Last Session Notes</div>
          {lastSession.next_plan && (
            <>
              <div className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Next Plan:</div>
              <div className="text-[13px]" style={{ color: 'var(--text-2)' }}>{lastSession.next_plan}</div>
            </>
          )}
        </div>
      )}

      {/* Session History */}
      {ptSessions.length > 0 && (
        <div className="mb-2.5">
          <div className="text-[13px] font-semibold mb-2.5" style={{ color: 'var(--text)' }}>Session History</div>
          {ptSessions.slice(0, 5).map((s) => (
            <div key={s.id} className="session-timeline-item">
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                {formatDate(s.date)} · Session #{s.session_num || '?'} · Pain: {s.pain !== null ? s.pain : '—'}/10
              </div>
              {s.exercises && s.exercises.length > 0 && (
                <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--teal)' }}><GiMuscleUp size={14} /> {s.exercises.join(', ')}</div>
              )}
              {s.current_treatment && (
                <div className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.current_treatment}</div>
              )}
              {s.progress && (
                <div className="text-[13px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--teal)' }}><FiTrendingUp size={14} /> {s.progress}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap mt-2">
        <Button size="sm" onClick={() => { onClose(); onViewSessions && onViewSessions(patient) }}>View Sessions</Button>
        <Button size="sm" onClick={() => { onClose(); onLogSession(patient.id) }}>+ Log Session</Button>
        <Button variant="outline" size="sm" onClick={() => { onClose(); onBookAppt(patient.id) }}>+ Appointment</Button>
        <Button variant="outline" size="sm" onClick={() => { onClose(); onAssignExercises && onAssignExercises(patient.id) }}>
          <GiMuscleUp size={16} className="inline mr-1" /> Assign Exercises
        </Button>
        {patient.phone && (
          <Button variant="whatsapp" size="sm" onClick={() => sendWhatsApp(patient.phone, patient.name)}>
            <FiPhone size={16} className="inline mr-1" /> WhatsApp
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(patient) }}><FiEdit2 size={16} className="inline mr-1" /> Edit</Button>
        <Button variant="danger" size="sm" onClick={handleDelete}><FiTrash2 size={16} className="inline mr-1" /> Delete</Button>
      </div>
    </Modal>
  )
}
