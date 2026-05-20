import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button, Select, Input, Textarea, FormGroup, FormRow, ToggleRow } from '../ui'
import { useAppStore } from '../../store/appStore'
import { today, formatDate, sendWhatsAppReminder } from '../../lib/utils'

const EMPTY = {
  patient_id: '',
  date: today(),
  time: '10:00',
  duration: '60',
  type: 'Regular Session',
  notes: '',
  reminder: true,
  status: 'scheduled',
}

export function AppointmentFormModal({ prePatientId, appointment, open, onClose }) {
  const patients = useAppStore((s) => s.patients)
  const addAppointment = useAppStore((s) => s.addAppointment)
  const updateAppointment = useAppStore((s) => s.updateAppointment)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (!open) return
    if (appointment) {
      setForm({
        patient_id: appointment.patient_id || '',
        date: appointment.date || today(),
        time: appointment.time || '10:00',
        duration: appointment.duration || '60',
        type: appointment.type || 'Regular Session',
        notes: appointment.notes || '',
        reminder: appointment.reminder !== false,
        status: appointment.status || 'scheduled',
      })
    } else {
      setForm({ ...EMPTY, patient_id: prePatientId || '', date: today() })
    }
  }, [appointment, prePatientId, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const activePatients = patients.filter((p) => p.active !== false)

  const handleSave = async () => {
    if (!form.patient_id) { alert('Please select a patient'); return }
    if (!form.date || !form.time) { alert('Please set date and time'); return }
    const patient = patients.find((p) => p.id === form.patient_id)
    const data = {
      patient_id: form.patient_id,
      patient_name: patient?.name || 'Unknown',
      date: form.date,
      time: form.time,
      duration: form.duration,
      type: form.type,
      notes: form.notes,
      reminder: form.reminder,
      status: appointment ? appointment.status : 'scheduled',
    }
    const ok = appointment
      ? await updateAppointment(appointment.id, data)
      : await addAppointment(data)
    if (!ok) return
    onClose()
    // WhatsApp reminder prompt
    if (!appointment && form.reminder && patient?.phone) {
      setTimeout(() => {
        if (window.confirm(`Send WhatsApp reminder to ${patient.name} for ${formatDate(form.date)} at ${form.time}?`)) {
          sendWhatsAppReminder(patient.phone, patient.name, form.date, form.time)
        }
      }, 300)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={appointment ? 'Reschedule Appointment' : 'Book Appointment'}>
      <FormGroup label="Patient *">
        <Select value={form.patient_id} onChange={(e) => set('patient_id', e.target.value)}>
          <option value="">Select patient...</option>
          {activePatients.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </FormGroup>
      <FormRow>
        <FormGroup label="Date *">
          <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </FormGroup>
        <FormGroup label="Time *">
          <Input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
        </FormGroup>
      </FormRow>
      <FormGroup label="Duration">
        <Select value={form.duration} onChange={(e) => set('duration', e.target.value)}>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">60 minutes</option>
          <option value="90">90 minutes</option>
        </Select>
      </FormGroup>
      <FormGroup label="Session Type">
        <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
          {['Initial Assessment', 'Regular Session', 'Review Session', 'Final Discharge', 'Home Visit'].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </FormGroup>
      <FormGroup label="Notes">
        <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any specific instructions for this appointment..." />
      </FormGroup>
      <ToggleRow
        label="Send WhatsApp Reminder"
        sub="Send reminder 1 day before"
        checked={form.reminder}
        onChange={(v) => set('reminder', v)}
      />
      <div className="flex gap-2.5 mt-2">
        <Button variant="outline" full onClick={onClose}>Cancel</Button>
        <Button full onClick={handleSave}>Book Appointment</Button>
      </div>
    </Modal>
  )
}
