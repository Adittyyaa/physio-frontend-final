import React from 'react'
import { FiUsers, FiCalendar, FiClipboard } from 'react-icons/fi'
import { GiMuscleUp } from 'react-icons/gi'

const NAV_ITEMS = [
  { id: 'patients', icon: FiUsers, label: 'Patients' },
  { id: 'appointments', icon: FiCalendar, label: 'Schedule' },
  { id: 'sessions', icon: FiClipboard, label: 'Sessions' },
  { id: 'exercises', icon: GiMuscleUp, label: 'Exercises' },
]

function NavIcon({ Icon }) {
  return <div className="flex items-center justify-center"><Icon size={20} /></div>
}

export function BottomNav({ active, onChange, items = NAV_ITEMS }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t flex z-[300]"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--border)',
        maxWidth: 480,
        margin: '0 auto',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex-1 py-2.5 pb-2 text-center cursor-pointer border-none bg-transparent font-sans transition-colors ${
            active === item.id ? 'text-[#0f766e]' : 'text-[#94a3b8]'
          }`}
        >
          <span className="text-xl block flex items-center justify-center"><NavIcon Icon={item.icon} /></span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.3px] mt-0.5 block">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  )
}
