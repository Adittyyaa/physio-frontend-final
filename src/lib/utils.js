/** Generate a unique ID */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/** Generate a 4-digit numeric patient code (string, leading zeros allowed) */
export function patientCode4() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

/** Format date string to Indian locale */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Capitalize first letter */
export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

/** Get initials from full name */
export function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Get today's ISO date string */
export function today() {
  return new Date().toISOString().split('T')[0]
}

/** Get tomorrow's ISO date string */
export function tomorrow() {
  return new Date(Date.now() + 86400000).toISOString().split('T')[0]
}

/** Get end-of-week ISO date string (7 days from now) */
export function weekEnd() {
  return new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
}

/** Format date nicely for display headers */
export function formatDateHeader(dateStr) {
  const t = today()
  const tom = tomorrow()
  if (dateStr === t) return 'TODAY'
  if (dateStr === tom) return 'TOMORROW'
  return formatDate(dateStr)
}

/** Get pain color based on level */
export function painColor(level) {
  if (level >= 7) return '#ef4444'
  if (level >= 4) return '#f59e0b'
  return '#22c55e'
}

/** Send WhatsApp message */
export function sendWhatsApp(phone, name) {
  const clean = phone.replace(/\D/g, '')
  const num = clean.startsWith('91') ? clean : '91' + clean
  const msg = encodeURIComponent(
    `Hello ${name}! This is a message from your physiotherapist. How are you feeling today?`
  )
  window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
}

/** Send WhatsApp reminder */
export function sendWhatsAppReminder(phone, name, date, time) {
  const clean = phone.replace(/\D/g, '')
  const num = clean.startsWith('91') ? clean : '91' + clean
  const msg = encodeURIComponent(
    `Hello ${name}! 🙏\n\nThis is a reminder for your physiotherapy appointment:\n📅 Date: ${formatDate(date)}\n⏰ Time: ${time}\n\nPlease be on time. If you need to reschedule, reply to this message.\n\nThank you!`
  )
  window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
}
