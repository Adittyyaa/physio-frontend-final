  import React, { useState } from 'react'
  import { GiMuscleUp } from 'react-icons/gi'
  import { FiPlus, FiMinus, FiCheck, FiPause, FiPlay, FiEdit2, FiTrash2 } from 'react-icons/fi'
  import { useAppStore } from '../../store/appStore'
  import { Chip, EmptyState, Card, SearchBar } from '../ui'
  import { ExerciseFormModal } from './ExerciseFormModal'
  import { capitalize } from '../../lib/utils'
  import { DEFAULT_EXERCISES } from '../../lib/defaultData'
  import toast from 'react-hot-toast'

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'neck', label: 'Neck' },
    { id: 'shoulder', label: 'Shoulder' },
    { id: 'back', label: 'Back' },
    { id: 'knee', label: 'Knee' },
    { id: 'hip', label: 'Hip' },
    { id: 'ankle', label: 'Ankle' },
    { id: 'other', label: 'Other' },
  ]

  // ── Therapist view ────────────────────────────────────────────
  // Shows the full library. If patientId is provided, each card has
  // a + / − button to assign or remove the exercise for that patient.
  function TherapistExercises({ patientId, onDone }) {
    const exercises = useAppStore((s) => s.exercises)
    const assignExercise = useAppStore((s) => s.assignExercise)
    const removeAssignedExercise = useAppStore((s) => s.removeAssignedExercise)
    const addExercise = useAppStore((s) => s.addExercise)
    const deleteExercise = useAppStore((s) => s.deleteExercise)
    const patients = useAppStore((s) => s.patients)
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editExercise, setEditExercise] = useState(null)
    const [busy, setBusy] = useState({}) // exerciseId → true while loading

    const libraryExercises = exercises.filter((e) => !e.patient_id)
    const assignedExercises = patientId ? exercises.filter((e) => e.patient_id === patientId) : []
    
    // Get patient name
    const patient = patients.find(p => p.id === patientId)
    const patientName = patient?.name || 'Unknown Patient'

    // Map: library exercise name+category → assigned exercise id
    const assignedMap = {}
    assignedExercises.forEach((e) => { assignedMap[e.name + '|' + e.category] = e.id })

    // Filter by category and search
    let filtered = filter === 'all'
      ? libraryExercises
      : libraryExercises.filter((e) => e.category === filter)
    
    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter((e) => 
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.instructions?.toLowerCase().includes(search.toLowerCase())
      )
    }

    const handleToggle = async (libExercise) => {
      const key = libExercise.name + '|' + libExercise.category
      const assignedId = assignedMap[key]
      setBusy((b) => ({ ...b, [libExercise.id]: true }))
      if (assignedId) {
        await removeAssignedExercise(assignedId)
      } else {
        await assignExercise({
          name: libExercise.name,
          category: libExercise.category,
          reps: libExercise.reps,
          instructions: libExercise.instructions,
          media: libExercise.media,
        }, patientId)
      }
      setBusy((b) => ({ ...b, [libExercise.id]: false }))
    }

    const handleDelete = async (exerciseId) => {
      if (!window.confirm('Delete this exercise from your library?')) return
      setBusy((b) => ({ ...b, [exerciseId]: true }))
      await deleteExercise(exerciseId)
      setBusy((b) => ({ ...b, [exerciseId]: false }))
    }

    const handleEdit = (exercise) => {
      setEditExercise(exercise)
      setShowForm(true)
    }

    return (
      <div className="p-4 pb-24">
        {/* Header with Done button when assigning to patient */}
        {patientId ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="font-display text-xl">Assign Exercises</h2>
                <p className="text-sm text-[#64748b]">for {patientName}</p>
              </div>
              <button
                onClick={onDone}
                className="px-4 py-2 bg-[#0f766e] text-white text-sm font-semibold rounded-lg hover:bg-[#0d665f] transition-colors"
              >
                Done
              </button>
            </div>
            {assignedExercises.length > 0 && (
              <div className="text-xs font-semibold px-3 py-2 rounded-lg mb-3" 
                style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
                ✓ {assignedExercises.length} exercise{assignedExercises.length !== 1 ? 's' : ''} assigned to this patient
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-display text-xl">Exercise Library</h2>
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 text-white text-xs font-semibold rounded-lg"
              style={{ background: '#0f766e' }}
            >
              + Add
            </button>
          </div>
        )}

        {/* Search Bar */}
        <SearchBar value={search} onChange={setSearch} placeholder="Search exercises..." />

        <div className="chip-scroll">{FILTERS.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={GiMuscleUp} title="No exercises in this category" />
        ) : (
          filtered.map((e) => {
            const key = e.name + '|' + e.category
            const isAssigned = !!assignedMap[key]
            const isLoading = busy[e.id]
            return (
              <Card key={e.id}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>{e.name}</div>
                      {isAssigned && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
                          <FiCheck size={10} /> Assigned
                        </span>
                      )}
                    </div>
                    <div className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>
                      {capitalize(e.category)} · {e.reps || 'No reps set'}
                    </div>
                    {e.instructions && (
                      <div className="text-[13px]" style={{ color: 'var(--text-2)' }}>{e.instructions}</div>
                    )}
                    {e.media && (
                      <a href={e.media} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] no-underline font-medium mt-1"
                        style={{ color: 'var(--teal)' }}>
                        ▶ View Demo →
                      </a>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {/* +/− button — only shown when assigning to a specific patient */}
                    {patientId && (
                      <button
                        onClick={() => handleToggle(e)}
                        disabled={isLoading}
                        title={isAssigned ? 'Remove from patient' : 'Assign to patient'}
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg transition-all active:scale-90 disabled:opacity-40"
                        style={
                          isAssigned
                            ? { background: 'var(--red-soft)', color: 'var(--red)' }
                            : { background: 'var(--teal-soft)', color: 'var(--teal)' }
                        }
                      >
                        {isLoading ? '…' : isAssigned ? <FiMinus size={16} /> : <FiPlus size={16} />}
                      </button>
                    )}

                    {/* Edit/Delete buttons — only shown in library view (not assigning) */}
                    {!patientId && (
                      <>
                        <button
                          onClick={() => handleEdit(e)}
                          title="Edit exercise"
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                          style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          disabled={isLoading}
                          title="Delete exercise"
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
                          style={{ background: 'var(--red-soft)', color: 'var(--red)' }}
                        >
                          {isLoading ? '…' : <FiTrash2 size={16} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}

        <ExerciseFormModal exercise={editExercise} open={showForm} onClose={() => { setShowForm(false); setEditExercise(null) }} />
      </div>
    )
  }

  // ── Patient view ──────────────────────────────────────────────
  function PatientExercises() {
    const exercises = useAppStore((s) => s.exercises) || []
    const addPatientExercise = useAppStore((s) => s.addPatientExercise)
    const removePatientExercise = useAppStore((s) => s.removePatientExercise)
    const togglePatientExerciseActive = useAppStore((s) => s.togglePatientExerciseActive)
    const [filter, setFilter] = useState('all')
    const [view, setView] = useState('all') // 'all' | 'mine'
    const [busy, setBusy] = useState({})
    const [busyActive, setBusyActive] = useState({})

    // Map saved exercises by name+category for quick lookup
    const savedMap = {}
    const savedExerciseMap = {} // key → full exercise object
    exercises.forEach((e) => {
      const key = (e.name || '').trim() + '|' + (e.category || '').trim()
      savedMap[key] = e.id
      savedExerciseMap[key] = e
    })

    const handleToggle = async (ex) => {
      const key = (ex.name || '').trim() + '|' + (ex.category || '').trim()
      const savedId = savedMap[key]
      setBusy((b) => ({ ...b, [key]: true }))
      try {
        if (savedId) {
          await removePatientExercise(savedId)
        } else {
          await addPatientExercise({
            name: ex.name.trim(),
            category: ex.category.trim(),
            reps: ex.reps || '',
            instructions: ex.instructions || '',
            media: ex.media || null,
          })
        }
      } catch (err) {
        console.error('Toggle exercise error:', err)
        toast.error('Something went wrong')
      } finally {
        setBusy((b) => ({ ...b, [key]: false }))
      }
    }

    const handleToggleActive = async (ex) => {
      const key = (ex.name || '').trim() + '|' + (ex.category || '').trim()
      const savedId = savedMap[key]
      const savedExercise = savedExerciseMap[key]
      if (!savedId || !savedExercise) return
      setBusyActive((b) => ({ ...b, [key]: true }))
      try {
        await togglePatientExerciseActive(savedId)
      } catch (err) {
        console.error('Toggle active error:', err)
        toast.error('Something went wrong')
      } finally {
        setBusyActive((b) => ({ ...b, [key]: false }))
      }
    }

    const addedCount = exercises.length
    const activeCount = exercises.filter((e) => e.active !== false).length

    // Filter catalogue by category
    let catalogue = filter === 'all'
      ? DEFAULT_EXERCISES
      : DEFAULT_EXERCISES.filter((e) => e.category === filter)

    // If "My Plan" view, only show added ones
    if (view === 'mine') {
      catalogue = catalogue.filter((e) => {
        const k = (e.name || '').trim() + '|' + (e.category || '').trim()
        return !!savedMap[k]
      })
    } else {
      // Sort: added ones first
      catalogue = [...catalogue].sort((a, b) => {
        const aK = (a.name || '').trim() + '|' + (a.category || '').trim()
        const bK = (b.name || '').trim() + '|' + (b.category || '').trim()
        const aAdded = !!savedMap[aK]
        const bAdded = !!savedMap[bK]
        return bAdded - aAdded
      })
    }

    return (
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Exercises</h2>
          {addedCount > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
              {activeCount} active · {addedCount} total
            </span>
          )}
        </div>

        {/* My Plan / All toggle */}
        <div className="flex gap-2 mb-3">
          {[['all', 'All Exercises'], ['mine', 'My Plan']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className="flex-1 py-2 rounded-[10px] text-sm font-semibold border-[1.5px] transition-colors"
              style={
                view === id
                  ? { background: '#0f766e', borderColor: '#0f766e', color: '#fff' }
                  : { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text-2)' }
              }
            >
              {label}{id === 'mine' && addedCount > 0 ? ` (${addedCount})` : ''}
            </button>
          ))}
        </div>

        {/* Category filter chips */}
        <div className="chip-scroll">
          {FILTERS.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>
          ))}
        </div>

        {catalogue.length === 0 ? (
          <EmptyState
            icon={GiMuscleUp}
            title={view === 'mine' ? 'No exercises in your plan yet' : 'No exercises in this category'}
            sub={view === 'mine' ? 'Switch to "All Exercises" and tap + to add some' : undefined}
          />
        ) : (
          catalogue.map((ex) => {
            const key = (ex.name || '').trim() + '|' + (ex.category || '').trim()
            const isAdded = !!savedMap[key]
            const savedExercise = savedExerciseMap[key]
            const isActive = savedExercise ? savedExercise.active !== false : true
            const isLoading = busy[key]
            const isActiveLoading = busyActive[key]

            return (
              <div
                key={key}
                className="rounded-2xl p-4 mb-3 transition-all"
                style={{
                  background: isAdded
                    ? isActive ? 'var(--teal-soft)' : 'var(--card)'
                    : 'var(--card)',
                  border: isAdded
                    ? isActive ? '2px solid var(--teal)' : '2px solid var(--border)'
                    : '1px solid var(--border)',
                  boxShadow: isAdded && isActive ? '0 2px 12px rgba(15,118,110,0.15)' : 'var(--shadow)',
                  opacity: isAdded && !isActive ? 0.7 : 1,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Name + badge */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div
                        className="text-[15px] font-semibold"
                        style={{ color: isAdded && isActive ? 'var(--teal-dim)' : 'var(--text)' }}
                      >
                        {ex.name}
                      </div>
                      {isAdded && isActive && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: 'var(--teal)', color: '#fff' }}
                        >
                          <FiCheck size={10} /> Active
                        </span>
                      )}
                      {isAdded && !isActive && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: 'var(--border)', color: 'var(--text-3)' }}
                        >
                          <FiPause size={10} /> Paused
                        </span>
                      )}
                    </div>

                    {/* Category · Reps */}
                    <div className="text-xs mb-1.5" style={{ color: isAdded && isActive ? 'var(--teal)' : 'var(--text-3)' }}>
                      {capitalize(ex.category)} · {ex.reps}
                    </div>

                    {/* Instructions */}
                    {ex.instructions && (
                      <div className="text-[13px]" style={{ color: isAdded && isActive ? 'var(--teal-dim)' : 'var(--text-2)' }}>
                        {ex.instructions}
                      </div>
                    )}

                    {/* Active/Inactive toggle — shown for added exercises */}
                    {isAdded && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(ex) }}
                        disabled={isActiveLoading}
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40"
                        style={
                          isActive
                            ? { background: 'var(--border)', color: 'var(--text-2)' }
                            : { background: 'var(--teal-soft)', color: 'var(--teal)' }
                        }
                      >
                        {isActiveLoading ? '…' : isActive ? <><FiPause size={12} /> Pause</> : <><FiPlay size={12} /> Activate</>}
                      </button>
                    )}
                  </div>

                  {/* +/− button */}
                  <button
                    onClick={() => handleToggle(ex)}
                    disabled={isLoading}
                    title={isAdded ? 'Remove from my plan' : 'Add to my plan'}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
                    style={
                      isAdded
                        ? { background: 'var(--teal)', color: '#fff', boxShadow: '0 2px 8px rgba(15,118,110,0.3)' }
                        : { background: 'var(--teal-soft)', color: 'var(--teal)' }
                    }
                  >
                    {isLoading ? '…' : isAdded ? <FiMinus size={18} /> : <FiPlus size={18} />}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    )
  }

  export function ExercisesSection({ patientId, onDone }) {
    const patientMode = useAppStore((s) => (s.user?.user_metadata?.role || 'therapist') === 'patient')
    return patientMode
      ? <PatientExercises />
      : <TherapistExercises patientId={patientId} onDone={onDone} />
  }
