import React from 'react'
import { FiUsers, FiCalendar, FiClipboard } from 'react-icons/fi'
import { GiMuscleUp } from 'react-icons/gi'
import { BsCalendar3 } from 'react-icons/bs'

const TABS = [
  { id: 'patients', icon: FiUsers, label: 'Patients' },
  { id: 'calendar', icon: BsCalendar3, label: 'Calendar' },
  { id: 'appointments', icon: FiCalendar, label: 'Schedule' },
  { id: 'sessions', icon: FiClipboard, label: 'Sessions' },
  { id: 'exercises', icon: GiMuscleUp, label: 'Exercises' },
]

function TabIcon({ Icon }) {
  return <div className="flex items-center justify-center"><Icon size={18} /></div>
}

export function Tabs({ active, onChange, items = TABS }) {
  return (
    <div
      className="hidden lg:flex border-b sticky top-[72px] z-[99] overflow-x-auto tabs-scroll"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {items.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 min-w-[80px] px-2 py-3 pb-2.5 text-center text-[11px] font-semibold cursor-pointer border-b-[2.5px] transition-all whitespace-nowrap uppercase tracking-[0.3px] bg-transparent border-none font-sans ${
            active === tab.id
              ? 'text-[#0f766e] border-b-[#0f766e]'
              : 'text-[#94a3b8] border-b-transparent'
          }`}
          style={{ borderBottom: active === tab.id ? '2.5px solid #0f766e' : '2.5px solid transparent' }}
        >
          <span className="text-base block mb-0.5 flex items-center justify-center"><TabIcon Icon={tab.icon} /></span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
