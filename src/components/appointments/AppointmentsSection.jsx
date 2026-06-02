import React, { useState } from 'react'
import { FiCheck, FiX, FiRotateCcw, FiCalendar, FiPhone } from 'react-icons/fi'
import { useAppStore } from '../../store/appStore'
import { Chip, EmptyState, Badge, Button } from '../ui'
import { AppointmentFormModal } from './AppointmentFormModal'
import { formatDate, today, tomorrow, weekEnd, sendWhatsAppReminder } from '../../lib/utils'

const FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'This Week' },
  { id: 'all', label: 'All' },
]

const STATUS_EMPTY = {
  today: 'No appointments today',
  tomorrow: 'No appointments tomorrow',
  week: 'No appointments this week',
  all: 'No appointments yet',
}

export function AppointmentsSection({ prePatientId, onClear }) {
  const appointments = useAppStore((s) => s.appointments)
  const patients = useAppStore((s) => s.patients)
  const updateAppointmentStatus = useAppStore((s) => s.updateAppointmentStatus)
  const patientMode = useAppStore((s) => (s.user?.user_metadata?.role || 'therapist') === 'patient')
  const [filter, setFilter] = useState('today')
  const [showForm, setShowForm] = useState(false)
  const [editAppt, setEditAppt] = useState(null)
  const [bookPatientId, setBookPatientId] = useState(null)

  const t = today()
  const tom = tomorrow()
  const we = weekEnd()

  let list = [...appointments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  if (filter === 'today') list = list.filter((a) => a.date === t)
  else if (filter === 'tomorrow') list = list.filter((a) => a.date === tom)
  else if (filter === 'week') list = list.filter((a) => a.date >= t && a.date <= we)

  // Group by date
  const groups = list.reduce((acc, a) => {
    if (!acc[a.date]) acc[a.date] = []
    acc[a.date].push(a)
    return acc
  }, {})

  const openAdd = (patientId = null) => {
    setEditAppt(null)
    setBookPatientId(patientId)
    setShowForm(true)
  }

  const openEdit = (appt) => {
    setEditAppt(appt)
    setBookPatientId(null)
    setShowForm(true)
  }

  // Expose openAdd for parent (FAB & pre-patient)
  React.useEffect(() => {
    if (prePatientId) {
      openAdd(prePatientId)
      if (onClear) onClear()
    }
  }, [prePatientId])

  const apptBorderColor = (status) => {
    if (status === 'completed') return '#22c55e'
    if (status === 'cancelled') return '#ef4444'
    if (status === 'pending') return '#f59e0b'
    return '#0f766e'
  }

  const apptOpacity = (status) => {
    if (status === 'completed') return 'opacity-70'
    if (status === 'cancelled') return 'opacity-60'
    return ''
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-display text-xl">Schedule</h2>
        {!patientMode ? (
          <button
            onClick={() => openAdd()}
            className="px-3 py-1.5 bg-[#0f766e] text-white text-xs font-semibold rounded-lg"
          >
            + Book
          </button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="chip-scroll">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <EmptyState icon={FiCalendar} title={STATUS_EMPTY[filter]} sub="Tap + Book to schedule" />
      ) : (
        Object.entries(groups).map(([date, appts]) => (
          <div key={date}>
            <div className="flex items-center gap-2 text-[12px] font-bold text-[#94a3b8] uppercase tracking-[0.8px] py-2 pb-1.5">
              {date === t ? (
                <span className="bg-[#0f766e] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">TODAY</span>
              ) : (
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>{formatDate(date)}</span>
              )}
            </div>
            {appts.map((a) => {
              const patient = patients.find((p) => p.id === a.patient_id)
              return (
                <div
                  key={a.id}
                  className={`rounded-2xl px-4 py-3.5 mb-2.5 flex gap-3 items-start cursor-pointer active:scale-[0.98] transition-transform ${apptOpacity(a.status)}`}
                  style={{
                    background: 'var(--card)',
                    boxShadow: 'var(--shadow)',
                    borderLeft: `4px solid ${apptBorderColor(a.status)}`,
                  }}
                >
                  <div className="text-center min-w-[48px]">
                    <div className="text-[15px] font-bold text-[#0f766e]">{a.time}</div>
                    <div className="text-[10px] text-[#94a3b8] mt-0.5">{a.duration}m</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{a.patient_name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                      {a.type}
                      {a.notes ? ` · ${a.notes.slice(0, 30)}` : ''}
                    </div>
                    {a.status === 'completed' && <Badge variant="green" className="mt-1"><FiCheck size={14} className="inline mr-1" /> Done</Badge>}
                    {a.status === 'cancelled' && <Badge variant="red" className="mt-1"><FiX size={14} className="inline mr-1" /> Cancelled</Badge>}
                  </div>
                  {!patientMode ? (
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {a.status === 'scheduled' ? (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(a.id, 'completed')}
                            className="px-3 py-1.5 bg-[#dcfce7] text-[#166534] text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                          ><FiCheck size={16} /></button>
                          <button
                            onClick={() => openEdit(a)}
                            className="px-3 py-1.5 bg-[#fef3c7] text-[#92400e] text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                          ><FiRotateCcw size={16} /></button>
                          <button
                            onClick={() => updateAppointmentStatus(a.id, 'cancelled')}
                            className="px-3 py-1.5 bg-[#fee2e2] text-[#ef4444] text-xs font-semibold rounded-lg"
                          >✗</button>
                        </>
                      ) : (
                        <button
                          onClick={() => openEdit(a)}
                          className="px-3 py-1.5 bg-transparent text-[#0f766e] border border-[#0f766e] text-xs font-semibold rounded-lg"
                        >Edit</button>
                      )}
                      {patient?.phone && (
                        <button
                          onClick={() => sendWhatsAppReminder(patient.phone, patient.name, a.date, a.time)}
                          className="px-3 py-1.5 bg-[#25d366] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                        ><FiPhone size={16} /></button>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))
      )}

      {!patientMode ? (
        <AppointmentFormModal
          appointment={editAppt}
          prePatientId={bookPatientId}
          open={showForm}
          onClose={() => { setShowForm(false); setEditAppt(null); setBookPatientId(null) }}
        />
      ) : null}
    </div>
  )
}
