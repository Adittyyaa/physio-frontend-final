import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button, Input, Select, Textarea, FormGroup, FormRow } from '../ui'
import { useAppStore } from '../../store/appStore'

const EMPTY = { name: '', category: 'neck', reps: '', instructions: '', media: '' }

export function ExerciseFormModal({ exercise, open, onClose }) {
  const addExercise = useAppStore((s) => s.addExercise)
  const updateExercise = useAppStore((s) => s.updateExercise)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (open) {
      if (exercise) {
        // Editing existing exercise
        setForm({
          name: exercise.name || '',
          category: exercise.category || 'neck',
          reps: exercise.reps || '',
          instructions: exercise.instructions || '',
          media: exercise.media || '',
        })
      } else {
        // Adding new exercise
        setForm(EMPTY)
      }
    }
  }, [open, exercise])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Please enter exercise name'); return }
    
    const data = {
      name: form.name.trim(),
      category: form.category,
      reps: form.reps.trim() || null,
      instructions: form.instructions.trim() || null,
      media: form.media.trim() || null,
    }

    let ok
    if (exercise) {
      // Update existing
      ok = await updateExercise(exercise.id, data)
    } else {
      // Add new
      ok = await addExercise(data)
    }
    
    if (ok) onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={exercise ? 'Edit Exercise' : 'Add Exercise'}>
      <FormGroup label="Exercise Name *">
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Chin Tucks" />
      </FormGroup>
      <FormRow>
        <FormGroup label="Category">
          <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
            {['neck','shoulder','back','knee','hip','ankle','other'].map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup label="Sets × Reps">
          <Input value={form.reps} onChange={(e) => set('reps', e.target.value)} placeholder="3 × 10" />
        </FormGroup>
      </FormRow>
      <FormGroup label="Instructions">
        <Textarea value={form.instructions} onChange={(e) => set('instructions', e.target.value)} placeholder="Step-by-step instructions for patient..." />
      </FormGroup>
      <FormGroup label="Video/Image URL (optional)">
        <Input type="url" value={form.media} onChange={(e) => set('media', e.target.value)} placeholder="https://youtube.com/... or image URL" />
      </FormGroup>
      <div className="flex gap-2.5 mt-2">
        <Button variant="outline" full onClick={onClose}>Cancel</Button>
        <Button full onClick={handleSave}>{exercise ? 'Update' : 'Save'} Exercise</Button>
      </div>
    </Modal>
  )
}
