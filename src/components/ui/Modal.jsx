import React, { useEffect } from 'react'
import { FiX } from 'react-icons/fi'

export function Modal({ id, open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div
      className={`modal-overlay ${open ? 'open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-sheet" style={{ background: 'var(--card)', color: 'var(--text)' }}>
        {/* Handle bar */}
        <div className="w-10 h-1 rounded mx-auto mb-4" style={{ background: 'var(--border)' }} />
        
        {/* Header with title and close button */}
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>{title}</h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <FiX size={24} style={{ color: 'var(--text-2)' }} />
          </button>
        </div>
        
        {children}
      </div>
    </div>
  )
}
