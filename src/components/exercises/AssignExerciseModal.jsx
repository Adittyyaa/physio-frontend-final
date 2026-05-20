import React, { useState } from 'react'
import { FiCheck, FiPlus } from 'react-icons/fi'
import { Modal } from '../ui/Modal'
import { Button, Input, FormGroup, FormRow, Select, Textarea } from '../ui'
import { useAppStore } from '../../store/appStore'
import { capitalize } from '../../lib/utils'

const EMPTY_CUSTOM = { name: '', category: 'neck', reps: '', instructions: '', media: '' }

export function AssignExerciseModal({ open, onClose, patientId, libraryExercises, assignedExercises }) {
  const assignExercise = useAppStore((s) => s.assignExercise)
  const [tab, setTab] = useState('library') // 'library' | 'custom'
  const [search, setSearch] = useState('')
  const [assigning, setAssigning] = useState(null)
  const [custom, setCustom] = useState(EMPTY_CUSTOM)
  const [saving, setSaving] = useState(false)

  const assignedIds = new Set(assignedExercises.map((e) => e.name + e.category))

  const filtered = libraryExercises.filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.category.includes(search.toLowerCase())
  )

  const handleAssignFromLibrary = async (exercise) => {
    setAssigning(exercise.id)
    await assignExercise({
      name: exercise.name,
      category: exercise.category,
      reps: exercise.reps,
      instructions: exercise.instructions,
      media: exercise.media,
    }, patientId)
    setAssigning(null)
  }

  const handleAssignCustom = async () => {
    if (!custom.name.trim()) { alert('Please enter exercise name'); return }
    setSaving(true)
    const ok = await assignExercise({
      name: custom.name.trim(),
      category: custom.category,
      reps: custom.reps.trim() || null,
      instructions: custom.instructions.trim() || null,
      media: custom.media.trim() || null,
    }, patientId)
    setSaving(false)
    if (ok) {
      setCustom(EMPTY_CUSTOM)
      onClose()
    }
  }

  const setC = (key, val) => setCustom((f) => ({ ...f, [key]: val }))

  return (
    <Modal open={open} onClose={onClose} title="Assign Exercise">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {[['library', 'From Library'], ['custom', 'Custom']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 py-2 rounded-[10px] text-sm font-semibold border-[1.5px] transition-colors"
            style={
              tab === id
                ? { background: '#0f766e', borderColor: '#0f766e', color: '#fff' }
                : { background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'library' ? (
        <>
          {/* Search */}
          <div
            className="flex items-center rounded-[10px] px-3 mb-3 gap-2"
            style={{ background: 'var(--bg)', border: '1.5px solid var(--border)' }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="flex-1 py-2.5 border-none outline-none text-sm font-sans bg-transparent"
              style={{ color: 'var(--text)' }}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-3)' }}>No exercises found</div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {filtered.map((e) => {
                const alreadyAssigned = assignedIds.has(e.name + e.category)
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-3 rounded-xl gap-3"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{e.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                        {capitalize(e.category)}{e.reps ? ` · ${e.reps}` : ''}
                      </div>
                    </div>
                    {alreadyAssigned ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
                        <FiCheck size={11} /> Assigned
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAssignFromLibrary(e)}
                        disabled={assigning === e.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1 disabled:opacity-50"
                        style={{ background: '#0f766e' }}
                      >
                        {assigning === e.id ? '...' : <><FiPlus size={12} /> Assign</>}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button variant="outline" full onClick={onClose}>Close</Button>
          </div>
        </>
      ) : (
        <>
          <FormGroup label="Exercise Name *">
            <Input value={custom.name} onChange={(e) => setC('name', e.target.value)} placeholder="e.g. Chin Tucks" />
          </FormGroup>
          <FormRow>
            <FormGroup label="Category">
              <Select value={custom.category} onChange={(e) => setC('category', e.target.value)}>
                {['neck','shoulder','back','knee','hip','ankle','other'].map((c) => (
                  <option key={c} value={c}>{capitalize(c)}</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup label="Sets × Reps">
              <Input value={custom.reps} onChange={(e) => setC('reps', e.target.value)} placeholder="3 × 10" />
            </FormGroup>
          </FormRow>
          <FormGroup label="Instructions">
            <Textarea value={custom.instructions} onChange={(e) => setC('instructions', e.target.value)} placeholder="Step-by-step instructions..." />
          </FormGroup>
          <FormGroup label="Video/Image URL (optional)">
            <Input type="url" value={custom.media} onChange={(e) => setC('media', e.target.value)} placeholder="https://youtube.com/..." />
          </FormGroup>
          <div className="flex gap-2.5 mt-2">
            <Button variant="outline" full onClick={onClose}>Cancel</Button>
            <Button full onClick={handleAssignCustom} disabled={saving}>
              {saving ? 'Assigning...' : 'Assign to Patient'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
