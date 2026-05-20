import React from 'react'
import { Avatar } from '../ui'
import { useAppStore } from '../../store/appStore'

export function PatientItem({ patient, onClick }) {
  const sessions = useAppStore((s) => s.sessions)
  const sessionCount = sessions.filter((s) => s.patient_id === patient.id).length

  return (
    <div
      onClick={onClick}
      className="rounded-2xl px-4 py-3.5 mb-2.5 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
    >
      <Avatar name={patient.name} />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: 'var(--text)' }}>
          {patient.name}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
          {patient.diagnosis || patient.treatment_area || 'No diagnosis'} · {sessionCount} session{sessionCount !== 1 ? 's' : ''}
        </div>
      </div>
      <span
        className="text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0"
        style={
          patient.active === false
            ? { background: 'var(--border)', color: 'var(--text-3)' }
            : { background: 'var(--teal-soft)', color: 'var(--teal-dim)' }
        }
      >
        {patient.active === false ? 'Inactive' : 'Active'}
      </span>
    </div>
  )
}
