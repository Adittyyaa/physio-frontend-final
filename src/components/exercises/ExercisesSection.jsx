import React, { useState } from 'react'
import { GiMuscleUp } from 'react-icons/gi'
import { useAppStore } from '../../store/appStore'
import { Chip, EmptyState, Card, Badge } from '../ui'
import { ExerciseFormModal } from './ExerciseFormModal'
import { capitalize } from '../../lib/utils'

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

export function ExercisesSection() {
  const exercises = useAppStore((s) => s.exercises)
  const patientMode = useAppStore((s) => (s.user?.user_metadata?.role || 'therapist') === 'patient')
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)

  const filtered = filter === 'all' ? exercises : exercises.filter((e) => e.category === filter)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-display text-xl">Exercise Library</h2>
        {!patientMode ? (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-[#0f766e] text-white text-xs font-semibold rounded-lg"
          >
            + Add
          </button>
        ) : null}
      </div>

      <div className="chip-scroll">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={GiMuscleUp}
          title={patientMode ? 'No exercises shared yet' : 'No exercises in this category'}
          sub={patientMode ? 'Your physiotherapist will add exercises to your plan.' : undefined}
        />
      ) : (
        filtered.map((e) => (
          <Card key={e.id}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[15px] font-semibold">{e.name}</div>
                <div className="text-xs text-[#94a3b8] mt-0.5">
                  {capitalize(e.category)} · {e.reps || 'No reps set'}
                </div>
              </div>
              <Badge variant="teal">{capitalize(e.category)}</Badge>
            </div>
            {e.instructions && (
              <div className="text-[13px] text-[#475569] mb-2">{e.instructions}</div>
            )}
            {e.media && (
              <a
                href={e.media}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#0f766e] no-underline font-medium"
              >
                ▶ View Demo →
              </a>
            )}
          </Card>
        ))
      )}

      {!patientMode ? <ExerciseFormModal open={showForm} onClose={() => setShowForm(false)} /> : null}
    </div>
  )
}
