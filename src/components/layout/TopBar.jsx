import React from 'react'
import { FiSearch, FiBarChart2, FiLogOut, FiSun, FiMoon } from 'react-icons/fi'

export function TopBar({ onSearch, onStats, user, onLogout, showStats = true, dark, onToggleDark }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-[#0f766e] text-white px-5 py-4 sticky top-0 z-[100] flex items-center justify-between">
      <div>
        <div className="font-display text-[22px] tracking-[-0.3px]">PhysioTrack</div>
        <div className="text-xs opacity-75 mt-0.5">{dateStr}</div>
      </div>
      <div className="flex gap-2">
        {/* Dark mode toggle — always visible */}
        {onToggleDark && (
          <button
            onClick={onToggleDark}
            className="w-9 h-9 rounded-full bg-white/15 border-none text-white cursor-pointer flex items-center justify-center transition-colors hover:bg-white/25 active:bg-white/30"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
        )}

        {user ? (
          <>
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-full bg-white/15 border-none text-white text-lg cursor-pointer flex items-center justify-center transition-colors hover:bg-white/25 active:bg-white/30"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
            {showStats && (
              <button
                onClick={onStats}
                className="w-9 h-9 rounded-full bg-white/15 border-none text-white text-lg cursor-pointer flex items-center justify-center transition-colors hover:bg-white/25 active:bg-white/30"
                title="Stats"
              >
                <FiBarChart2 size={20} />
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={onSearch}
              className="w-9 h-9 rounded-full bg-white/15 border-none text-white text-lg cursor-pointer flex items-center justify-center transition-colors hover:bg-white/25 active:bg-white/30"
            >
              <FiSearch size={20} />
            </button>
            {showStats && (
              <button
                onClick={onStats}
                className="w-9 h-9 rounded-full bg-white/15 border-none text-white text-lg cursor-pointer flex items-center justify-center transition-colors hover:bg-white/25 active:bg-white/30"
                title="Stats"
              >
                <FiBarChart2 size={20} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
