import { FiCheckCircle, FiHome } from 'react-icons/fi'

export function ConfirmPage({ onContinue }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div
        className="rounded-2xl p-8 w-full text-center"
        style={{ maxWidth: 420, background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Logo */}
        <div
          className="w-16 h-16 bg-[#0f766e] rounded-2xl flex items-center justify-center mx-auto mb-5 text-white"
          style={{ boxShadow: '0 4px 20px rgba(15,118,110,0.3)' }}
        >
          <FiHome size={30} />
        </div>

        {/* Check icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--teal-soft)' }}
        >
          <FiCheckCircle size={40} color="var(--teal)" />
        </div>

        <h1 className="font-display text-2xl mb-2" style={{ color: 'var(--text)' }}>
          Email Confirmed!
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
          Your PhysioTrack account is ready. You can now sign in and start managing your patients.
        </p>

        <button
          onClick={onContinue}
          className="w-full py-3 text-white font-semibold rounded-xl text-[15px] cursor-pointer border-none transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#0f766e', boxShadow: '0 4px 12px rgba(15,118,110,0.3)' }}
        >
          Go to PhysioTrack →
        </button>
      </div>
    </div>
  )
}
