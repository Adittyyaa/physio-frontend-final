import React from 'react'
import { FiCheckCircle } from 'react-icons/fi'

export function ConfirmPage({ onContinue }) {
  return (
    <div
      className="min-h-screen bg-[#f0fdfa] flex flex-col items-center justify-center p-6"
      style={{ maxWidth: 480, margin: '0 auto' }}
    >
      <div className="bg-white rounded-2xl p-6 w-full" style={{ boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-[#dcfce7] text-[#166534] flex items-center justify-center">
            <FiCheckCircle size={22} />
          </div>
          <div>
            <h2 className="font-display text-xl text-[#0f172a]">Email confirmed</h2>
            <p className="text-sm text-[#475569]">Your account is ready.</p>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full mt-5 py-[11px] bg-[#0f766e] text-white font-semibold rounded-[10px] text-[15px] cursor-pointer border-none transition-colors hover:bg-[#134e4a]"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

