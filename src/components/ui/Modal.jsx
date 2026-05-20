import React, { useEffect } from 'react'

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
        {title && (
          <h2 className="font-display text-xl mb-4" style={{ color: 'var(--text)' }}>{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}
