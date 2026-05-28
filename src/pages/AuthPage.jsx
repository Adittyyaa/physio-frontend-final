import { useState } from 'react'
import { FiHome, FiEye, FiEyeOff } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../hooks/useAuth'

export function AuthPage({ initialAccountType = null }) {
  const { signIn, signUp, signUpWithMetadata, signInWithGoogle } = useAuth()
  
  // Parse URL parameters
  const params = new URLSearchParams(window.location.search)
  const urlPatientId = params.get('patient_id')
  const urlRole = params.get('role')
  const urlMode = params.get('mode')
  const urlEmail = params.get('email')

  const [mode, setMode] = useState(urlMode || 'login')
  const [accountType, setAccountType] = useState(
    urlRole === 'patient' ? 'patient' : (initialAccountType === 'patient' ? 'patient' : 'therapist')
  )
  const [email, setEmail] = useState(urlEmail || '')
  const [password, setPassword] = useState('')
  const [patientCode, setPatientCode] = useState(urlPatientId || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const isPatient = accountType === 'patient'
      let result = null

      if (isPatient) {
        if (mode === 'signup') {
          result = await signUpWithMetadata(email, password, { role: 'patient', patient_id: patientCode.trim() || null })
        } else {
          result = await signIn(email, password)
        }
      } else {
        if (mode === 'signup') {
          result = await signUp(email, password)
        } else {
          result = await signIn(email, password)
        }
      }

      if (result.error) {
        const msg = String(result.error || '').toLowerCase()
        if (msg.includes('rate limit')) {
          setError('Too many attempts. Wait a few minutes and try again.')
        } else if (mode === 'signup' && (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already') || msg.includes('duplicate') || msg.includes('email address is already'))) {
          setError('An account with this email already exists. Please sign in instead.')
        } else if (mode === 'login' && msg.includes('email not confirmed')) {
          setError('Please confirm your email first. Check your inbox for the confirmation link.')
        } else if (mode === 'login' && (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('no user') || msg.includes('user not found'))) {
          setError('Incorrect email or password. Please try again.')
        } else if (msg.includes('password') && msg.includes('short')) {
          setError('Password must be at least 6 characters.')
        } else if (msg.includes('sending confirmation') || msg.includes('smtp')) {
          setError('Account created but confirmation email failed. Please try signing in directly.')
        } else {
          setError(result.error)
        }
      } else if (mode === 'signup') {
        setSuccess('Account created! Check your email to confirm, then log in.')
        setMode('login')
      }
    } finally {
      setLoading(false)
    }
  }

  // Shared input style using CSS vars
  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: 10,
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
    background: 'var(--bg)',
    color: 'var(--text)',
    transition: 'border-color 0.2s',
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ maxWidth: 480, margin: '0 auto', background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 bg-[#0f766e] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 text-white"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <FiHome size={32} />
        </div>
        <h1 className="font-display text-3xl" style={{ color: 'var(--text)' }}>PhysioTrack</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Patient Manager for Physiotherapists</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl p-6 w-full" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>

        {/* Therapist / Patient switcher */}
        <div className="flex gap-2 mb-4">
          {['therapist', 'patient'].map((type) => (
            <button
              key={type}
              onClick={() => { setAccountType(type); setError(''); setSuccess('') }}
              className="flex-1 py-[9px] rounded-[10px] text-[13px] font-semibold border-[1.5px] transition-colors capitalize"
              style={
                accountType === type
                  ? { background: '#0f766e', borderColor: '#0f766e', color: '#fff' }
                  : { background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }
              }
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <h2 className="font-display text-xl mb-5" style={{ color: 'var(--text)' }}>
          {accountType === 'patient'
            ? mode === 'login' ? 'Patient login' : 'Patient sign up'
            : mode === 'login' ? 'Therapist login' : 'Therapist sign up'}
        </h2>

        {error && (
          <div className="text-sm px-3 py-2.5 rounded-lg mb-4" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>
            {error}
            {/* Suggest switching mode based on error type */}
            {mode === 'signup' && error.includes('already exists') && (
              <div className="mt-1.5">
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  className="font-bold underline bg-transparent border-none cursor-pointer text-sm"
                  style={{ color: 'var(--red)' }}
                >
                  Sign in instead →
                </button>
              </div>
            )}
            {mode === 'login' && error.includes('sign up first') && (
              <div className="mt-1.5">
                <button
                  onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
                  className="font-bold underline bg-transparent border-none cursor-pointer text-sm"
                  style={{ color: 'var(--red)' }}
                >
                  Create an account →
                </button>
              </div>
            )}
          </div>
        )}
        {success && (
          <div className="text-sm px-3 py-2 rounded-lg mb-4" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
            {success}
          </div>
        )}

        {/* Google sign-in (therapist only) */}
        {accountType === 'therapist' && (
          <>
            <button
              onClick={async () => {
                setGoogleLoading(true)
                setError('')
                const result = await signInWithGoogle()
                if (result.error) { setError(result.error); setGoogleLoading(false) }
              }}
              disabled={googleLoading || loading}
              className="w-full py-[11px] rounded-[10px] text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 mb-4 disabled:opacity-50 transition-colors"
              style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
            >
              <FcGoogle size={18} />
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>OR</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
          </>
        )}

        {/* Patient info hint */}
        {accountType === 'patient' && (
          <div className="text-sm px-3 py-2 rounded-lg mb-4" style={{ background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            Use the email &amp; password provided by your physiotherapist.
          </div>
        )}

        {/* Email */}
        <div className="mb-3.5">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-2)' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#0f766e')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Patient code (signup only) */}
        {mode === 'signup' && accountType === 'patient' && (
          <div className="mb-3.5">
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-2)' }}>
              Patient Code (optional)
            </label>
            <input
              type="text"
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value)}
              placeholder="Ask your physio for your code"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#0f766e')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        )}

        {/* Password */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-2)' }}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={(e) => (e.target.style.borderColor = '#0f766e')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-0 h-full px-3 flex items-center justify-center bg-transparent border-none cursor-pointer"
              style={{ color: 'var(--text-3)' }}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || googleLoading}
          className="w-full py-[11px] text-white font-semibold rounded-[10px] text-[15px] cursor-pointer border-none transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ background: '#0f766e' }}
        >
          {loading
            ? '...'
            : accountType === 'patient'
              ? mode === 'login' ? 'Sign In' : 'Register'
              : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        {/* Toggle login/signup */}
        <div className="text-center mt-4 text-sm" style={{ color: 'var(--text-2)' }}>
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button
                onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
                className="font-semibold border-none bg-transparent cursor-pointer"
                style={{ color: '#0f766e' }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="font-semibold border-none bg-transparent cursor-pointer"
                style={{ color: '#0f766e' }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
