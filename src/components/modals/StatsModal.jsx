import React from 'react'
import { FiBarChart2 } from 'react-icons/fi'
import { Modal } from '../ui/Modal'
import { Button, StatCard } from '../ui'
import { useAppStore } from '../../store/appStore'
import { today } from '../../lib/utils'

export function StatsModal({ open, onClose }) {
  const patients = useAppStore((s) => s.patients)
  const appointments = useAppStore((s) => s.appointments)
  const sessions = useAppStore((s) => s.sessions)

  const t = today()
  const todayAppts = appointments.filter((a) => a.date === t).length
  const completedAppts = appointments.filter((a) => a.status === 'completed').length
  const activePatients = patients.filter((p) => p.active !== false).length
  const sessionsWithPain = sessions.filter((s) => s.pain != null && s.pain !== '')
  const avgPain = sessionsWithPain.length
    ? (sessionsWithPain.reduce((sum, x) => sum + parseInt(x.pain), 0) / sessionsWithPain.length).toFixed(1)
    : '—'

  return (
    <Modal open={open} onClose={onClose} title={<div className="flex items-center gap-2"><FiBarChart2 /> Overview</div>}>
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <StatCard num={patients.length} label="Total Patients" />
        <StatCard num={activePatients} label="Active" color="#22c55e" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <StatCard num={todayAppts} label="Today's Appts" color="#f59e0b" />
        <StatCard num={sessions.length} label="Sessions Logged" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <StatCard num={appointments.length} label="Total Bookings" />
        <StatCard num={completedAppts} label="Completed" />
      </div>
      <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>Average Pain Score</div>
        <div className="text-[32px] font-bold text-[#0f766e]">{avgPain}</div>
        <div className="text-xs" style={{ color: 'var(--text-3)' }}>across all sessions</div>
      </div>
      <Button variant="outline" full className="mt-2" onClick={onClose}>Close</Button>
    </Modal>
  )
}
