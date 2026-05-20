import React from 'react'

export function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[90px] right-5 w-14 h-14 rounded-full bg-[#0f766e] text-white text-[26px] border-none flex items-center justify-center z-[200] cursor-pointer transition-transform active:scale-90"
      style={{ boxShadow: 'var(--shadow-lg)' }}
    >
      ＋
    </button>
  )
}
