import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiUser } from 'react-icons/fi'
import { SiGooglecalendar, SiApple } from 'react-icons/si'
import { today } from '../../lib/utils'
import toast from 'react-hot-toast'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Generate ICS file content for Apple Calendar
function generateICS(appointment, patientName) {
  const startDateTime = new Date(`${appointment.date}T${appointment.time}:00`)
  const endDateTime = new Date(startDateTime.getTime() + parseInt(appointment.duration || 60) * 60000)
  
  const formatICSDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PhysioTrack//Appointment//EN',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@physiotrack.app`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDateTime)}`,
    `DTEND:${formatICSDate(endDateTime)}`,
    `SUMMARY:${appointment.type || 'Appointment'} - ${patientName}`,
    `DESCRIPTION:Patient: ${patientName}\\nType: ${appointment.type || 'Regular Session'}\\nDuration: ${appointment.duration || 60} minutes${appointment.notes ? '\\nNotes: ' + appointment.notes : ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  return icsContent
}

// Generate Google Calendar URL
function generateGoogleCalendarURL(appointment, patientName) {
  const startDateTime = new Date(`${appointment.date}T${appointment.time}:00`)
  const endDateTime = new Date(startDateTime.getTime() + parseInt(appointment.duration || 60) * 60000)
  
  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${appointment.type || 'Appointment'} - ${patientName}`,
    dates: `${formatGoogleDate(startDateTime)}/${formatGoogleDate(endDateTime)}`,
    details: `Patient: ${patientName}\nType: ${appointment.type || 'Regular Session'}\nDuration: ${appointment.duration || 60} minutes${appointment.notes ? '\nNotes: ' + appointment.notes : ''}`,
    location: 'Physiotherapy Clinic'
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function downloadICS(icsContent, filename) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

function AppointmentCard({ appointment, patientName, onAddToGoogle, onAddToApple }) {
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  }

  return (
    <div className="p-3 rounded-xl mb-2 transition-all hover:shadow-md" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <FiUser size={14} className="text-[#0f766e] flex-shrink-0" />
          <span className="font-semibold text-sm">{patientName}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[appointment.status] || statusColors.scheduled}`}>
          {appointment.status || 'scheduled'}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-[#64748b] mb-2">
        <div className="flex items-center gap-1.5">
          <FiClock size={12} />
          <span>{appointment.time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FiCalendar size={12} />
          <span>{appointment.duration || 60} min</span>
        </div>
      </div>

      <div className="text-xs mb-2" style={{ color: 'var(--text-2)' }}>
        {appointment.type || 'Regular Session'}
      </div>

      {appointment.notes && (
        <div className="text-xs mb-3 p-2 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text-2)' }}>
          {appointment.notes}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onAddToGoogle(appointment, patientName)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: '#4285f4', color: 'white' }}
        >
          <SiGooglecalendar size={12} />
          Google Calendar
        </button>
        <button
          onClick={() => onAddToApple(appointment, patientName)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: '#555', color: 'white' }}
        >
          <SiApple size={14} />
          Apple Calendar
        </button>
      </div>
    </div>
  )
}

export function CalendarSection() {
  const appointments = useAppStore((s) => s.appointments)
  const patients = useAppStore((s) => s.patients)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get patient name by ID
  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id === patientId)
    return patient?.name || 'Unknown Patient'
  }

  // Get appointments grouped by date
  const appointmentsByDate = useMemo(() => {
    const grouped = {}
    appointments.forEach(apt => {
      if (!grouped[apt.date]) grouped[apt.date] = []
      grouped[apt.date].push(apt)
    })
    // Sort appointments by time within each day
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.time.localeCompare(b.time))
    })
    return grouped
  }, [appointments])

  // Get appointments for selected date or today
  const todayStr = today()
  const displayDate = selectedDate || todayStr
  const dayAppointments = appointmentsByDate[displayDate] || []

  // Calendar grid calculation
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calendarDays = []

  // Previous month padding
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const hasAppointments = appointmentsByDate[dateStr]?.length > 0
    calendarDays.push({ day, dateStr, hasAppointments })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleAddToGoogle = (appointment, patientName) => {
    const url = generateGoogleCalendarURL(appointment, patientName)
    window.open(url, '_blank')
    toast.success('Opening Google Calendar...')
  }

  const handleAddToApple = (appointment, patientName) => {
    const icsContent = generateICS(appointment, patientName)
    const filename = `physiotrack-${appointment.patient_id}-${appointment.date}.ics`
    downloadICS(icsContent, filename)
    toast.success('Calendar file downloaded! Open it to add to Apple Calendar.')
  }

  return (
    <div className="p-4 max-w-7xl mx-auto pb-24">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar Grid */}
        <div>
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiChevronLeft size={20} />
              </button>
              <h2 className="font-display text-lg font-semibold">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiChevronRight size={20} />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-[#64748b] py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, idx) => {
                if (!item) {
                  return <div key={`empty-${idx}`} className="aspect-square" />
                }

                const isSelected = selectedDate === item.dateStr
                const isToday = todayStr === item.dateStr
                const hasApts = item.hasAppointments

                return (
                  <button
                    key={item.dateStr}
                    onClick={() => setSelectedDate(item.dateStr)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all relative
                      ${isSelected ? 'bg-[#0f766e] text-white' : isToday ? 'bg-[#0f766e]/10 text-[#0f766e] font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                    `}
                  >
                    {item.day}
                    {hasApts && (
                      <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#0f766e]'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="text-2xl font-bold text-[#0f766e]">{appointments.filter(a => a.status === 'scheduled').length}</div>
              <div className="text-xs text-[#64748b] mt-1">Scheduled</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="text-2xl font-bold text-green-600">{appointments.filter(a => a.status === 'completed').length}</div>
              <div className="text-xs text-[#64748b] mt-1">Completed</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="text-2xl font-bold text-yellow-600">{appointments.filter(a => a.status === 'pending').length}</div>
              <div className="text-xs text-[#64748b] mt-1">Pending</div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div>
          <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
              <FiCalendar className="text-[#0f766e]" />
              {selectedDate 
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                : "Today's Appointments"
              }
            </h3>

            {dayAppointments.length === 0 ? (
              <div className="text-center py-12">
                <FiCalendar size={48} className="mx-auto mb-3 text-[#94a3b8]" />
                <p className="text-[#64748b] text-sm">No appointments scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {dayAppointments.map(apt => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    patientName={getPatientName(apt.patient_id)}
                    onAddToGoogle={handleAddToGoogle}
                    onAddToApple={handleAddToApple}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
