import React from 'react'
import { capitalize } from '../../lib/utils'

// ── Badge ─────────────────────────────────────────────────────
const badgeVariants = {
  teal: 'bg-[#ccfbf1] text-[#134e4a]',
  amber: 'bg-[#fef3c7] text-[#92400e]',
  green: 'bg-[#dcfce7] text-[#166534]',
  red: 'bg-[#fee2e2] text-[#991b1b]',
  gray: 'bg-slate-100 text-slate-400',
}

export function Badge({ variant = 'teal', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold gap-1 ${badgeVariants[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ── Button ────────────────────────────────────────────────────
export function Button({ variant = 'primary', size = 'md', full = false, className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold font-sans cursor-pointer border-none transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs rounded-lg', md: 'px-[18px] py-[10px] text-sm rounded-[10px]' }
  const variants = {
    primary: 'bg-[#0f766e] text-white hover:bg-[#134e4a]',
    outline: 'bg-transparent text-[#0f766e] border-[1.5px] border-[#0f766e]',
    danger: 'bg-[#fee2e2] text-[#ef4444]',
    amber: 'bg-[#fef3c7] text-[#92400e]',
    green: 'bg-[#dcfce7] text-[#166534]',
    whatsapp: 'bg-[#25d366] text-white',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${full ? 'w-full' : ''} ${className}`} {...props}>
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3.5 py-[11px] rounded-[10px] text-[15px] font-sans outline-none transition-colors focus:border-[#0f766e] appearance-none ${className}`}
      style={{ background: 'var(--card)', color: 'var(--text)', border: '1.5px solid var(--border)' }}
      {...props}
    />
  )
}

// ── Select ────────────────────────────────────────────────────
export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full px-3.5 py-[11px] rounded-[10px] text-[15px] font-sans outline-none transition-colors focus:border-[#0f766e] appearance-none ${className}`}
      style={{ background: 'var(--card)', color: 'var(--text)', border: '1.5px solid var(--border)' }}
      {...props}
    >
      {children}
    </select>
  )
}

// ── Textarea ──────────────────────────────────────────────────
export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full px-3.5 py-[11px] rounded-[10px] text-[15px] font-sans outline-none transition-colors focus:border-[#0f766e] min-h-[80px] resize-y ${className}`}
      style={{ background: 'var(--card)', color: 'var(--text)', border: '1.5px solid var(--border)' }}
      {...props}
    />
  )
}

// ── FormGroup ─────────────────────────────────────────────────
export function FormGroup({ label, children }) {
  return (
    <div className="mb-3.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-2)' }}>
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

// ── FormRow ───────────────────────────────────────────────────
export function FormRow({ children }) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>
}

// ── Toggle ────────────────────────────────────────────────────
export function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`toggle-switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    />
  )
}

// ── ToggleRow ─────────────────────────────────────────────────
export function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</div>
        {sub && <div className="text-xs" style={{ color: 'var(--text-3)' }}>{sub}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ className = '', children, onClick }) {
  return (
    <div
      className={`rounded-2xl p-4 mb-3 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="text-center py-10 px-5 text-[#94a3b8]">
      <div className="text-5xl mb-3 flex items-center justify-center h-16">
        {Icon ? <Icon size={48} /> : null}
      </div>
      <div className="text-[15px] font-medium text-[#475569]">{title}</div>
      {sub && <div className="text-[13px] mt-1.5">{sub}</div>}
    </div>
  )
}

// ── Chip ──────────────────────────────────────────────────────
export function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] cursor-pointer whitespace-nowrap transition-all"
      style={
        active
          ? { background: 'var(--teal)', color: '#fff', borderColor: 'var(--teal)' }
          : { background: 'var(--card)', color: 'var(--text-2)', borderColor: 'var(--border)' }
      }
    >
      {children}
    </button>
  )
}

// ── SearchBar ─────────────────────────────────────────────────
import { FiSearch, FiCheck, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi'

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div
      className="flex items-center rounded-[10px] px-3 mb-3.5 gap-2"
      style={{ background: 'var(--card)', border: '1.5px solid var(--border)' }}
    >
      <FiSearch className="text-[#94a3b8]" size={18} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 py-[11px] border-none outline-none text-sm font-sans bg-transparent"
        style={{ color: 'var(--text)' }}
      />
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────
export function Divider() {
  return <div className="h-px bg-[#e2e8f0] my-3" />
}

// ── StatCard ──────────────────────────────────────────────────
export function StatCard({ num, label, color }) {
  return (
    <div className="rounded-2xl p-3.5 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
      <div className="text-[28px] font-bold leading-none" style={{ color: color || 'var(--teal)' }}>{num}</div>
      <div className="text-[11px] mt-1 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>{label}</div>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────
export function Avatar({ name, size = 'md' }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'
  const sizes = { sm: 'w-9 h-9 text-sm', md: 'w-[46px] h-[46px] text-base', lg: 'w-14 h-14 text-xl' }
  return (
    <div className={`${sizes[size]} rounded-full bg-[#0f766e] text-white font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  )
}

// ── CategoryBadge ─────────────────────────────────────────────
export function CategoryBadge({ category }) {
  return <Badge variant="teal">{capitalize(category)}</Badge>
}
