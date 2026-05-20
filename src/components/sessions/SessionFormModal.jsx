import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button, Select, Input, Textarea, FormGroup, FormRow } from '../ui'
import { useAppStore } from '../../store/appStore'
import { today } from '../../lib/utils'

export function SessionFormModal({ prePatientId, open, onClose }) {
  const patients = useAppStore((s) => s.patients)
  const sessions = useAppStore((s) => s.sessions)
  const exercises = useAppStore((s) => s.exercises)
  const addSession = useAppStore((s) => s.addSession)

  const [patientId, setPatientId] = useState('')
  const [date, setDate] = useState(today())
  const [sessionNum, setSessionNum] = useState('')
  const [pain, setPain] = useState(null)
  const [exerciseTags, setExerciseTags] = useState([])
  const [exerciseInput, setExerciseInput] = useState('')
  const [currentTreatment, setCurrentTreatment] = useState('')
  const [progress, setProgress] = useState('')
  const [nextPlan, setNextPlan] = useState('')
  const [homeExercises, setHomeExercises] = useState('')
  const [stars, setStars] = useState(0)
  const [privateNotes, setPrivateNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(today())
    setPain(null)
    setExerciseTags([])
    setExerciseInput('')
    setCurrentTreatment('')
    setProgress('')
    setNextPlan('')
    setHomeExercises('')
    setStars(0)
    setPrivateNotes('')
    const pid = prePatientId || ''
    setPatientId(pid)
    if (pid) {
      const count = sessions.filter((s) => s.patient_id === pid).length
      setSessionNum(String(count + 1))
    } else {
      setSessionNum('')
    }
  }, [open, prePatientId])

  const activePatients = patients.filter((p) => p.active !== false)

  const addExerciseTag = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = exerciseInput.trim()
      if (val && !exerciseTags.includes(val)) {
        setExerciseTags([...exerciseTags, val])
      }
      setExerciseInput('')
    }
  }

  const addFromLibrary = (name) => {
    if (!exerciseTags.includes(name)) {
      setExerciseTags([...exerciseTags, name])
    }
  }

  const removeTag = (name) => setExerciseTags(exerciseTags.filter((t) => t !== name))

  const handleSave = async () => {
    if (!patientId) { alert('Please select a patient'); return }
    const patient = patients.find((p) => p.id === patientId)
    const data = {
      patient_id: patientId,
      patient_name: patient?.name || 'Unknown',
      date,
      session_num: sessionNum || null,
      pain,
      exercises: exerciseTags,
      current_treatment: currentTreatment.trim() || null,
      progress: progress.trim() || null,
      next_plan: nextPlan.trim() || null,
      home_exercises: homeExercises.trim() || null,
      rating: stars || null,
      private_notes: privateNotes.trim() || null,
    }
    const ok = await addSession(data)
    if (ok) onClose()
  }

  const libraryExercises = exercises.slice(0, 8)

  return (
    <Modal open={open} onClose={onClose} title="Log Session">
      <FormGroup label="Patient *">
        <Select value={patientId} onChange={(e) => {
          setPatientId(e.target.value)
          const count = sessions.filter((s) => s.patient_id === e.target.value).length
          setSessionNum(String(count + 1))
        }}>
          <option value="">Select patient...</option>
          {activePatients.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </FormGroup>
      <FormRow>
        <FormGroup label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="Session #">
          <Input type="number" value={sessionNum} onChange={(e) => setSessionNum(e.target.value)} placeholder="1" min="1" />
        </FormGroup>
      </FormRow>

      {/* Pain Scale */}
      <FormGroup label="Pain Level (0 = No pain, 10 = Severe)">
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`pain-btn ${pain === i ? 'selected' : ''} ${i >= 8 ? 'high' : ''}`}
              onClick={() => setPain(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </FormGroup>

      {/* Exercise Tags */}
      <FormGroup label="Exercises Done This Session">
        <Input
          value={exerciseInput}
          onChange={(e) => setExerciseInput(e.target.value)}
          onKeyDown={addExerciseTag}
          placeholder="Type exercise name and press Enter"
        />
        {exerciseTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {exerciseTags.map((t) => (
              <span key={t} className="exercise-tag selected">
                {t}
                <span className="text-[14px] font-bold cursor-pointer" onClick={() => removeTag(t)}>×</span>
              </span>
            ))}
          </div>
        )}
      </FormGroup>

      {/* Library Quick Add */}
      {libraryExercises.length > 0 && (
        <FormGroup label="Quick Add from Library">
          <div className="flex flex-wrap gap-1.5">
            {libraryExercises.map((e) => (
              <span
                key={e.id}
                className="exercise-tag"
                onClick={() => addFromLibrary(e.name)}
              >
                {e.name}
              </span>
            ))}
          </div>
        </FormGroup>
      )}

      <FormGroup label="What Was Done This Session">
        <Textarea value={currentTreatment} onChange={(e) => setCurrentTreatment(e.target.value)} placeholder="Techniques used, areas treated, observations..." />
      </FormGroup>
      <FormGroup label="Progress / Improvement Noted">
        <Textarea value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="Range of motion improved, pain reduced, patient feedback..." />
      </FormGroup>
      <FormGroup label="Plan for Next Session">
        <Textarea value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} placeholder="What to focus on next time..." />
      </FormGroup>
      <FormGroup label="Home Exercises Assigned">
        <Textarea value={homeExercises} onChange={(e) => setHomeExercises(e.target.value)} placeholder="Exercises patient should do at home..." />
      </FormGroup>

      {/* Star Rating */}
      <FormGroup label="Patient Feedback / Rating">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`star-btn ${n <= stars ? 'lit' : ''}`}
              onClick={() => setStars(n)}
            >
              ★
            </span>
          ))}
        </div>
      </FormGroup>

      <FormGroup label="Therapist Private Notes">
        <Textarea value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} placeholder="Internal notes (not shared with patient)..." />
      </FormGroup>

      <div className="flex gap-2.5 mt-2">
        <Button variant="outline" full onClick={onClose}>Cancel</Button>
        <Button full onClick={handleSave}>Save Session</Button>
      </div>
    </Modal>
  )
}
