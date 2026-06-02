import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { Chip, SearchBar, EmptyState } from '../ui'
import { PatientItem } from './PatientItem'
import { PatientDetailModal } from './PatientDetailModal'
import { PatientFormModal } from './PatientFormModal'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'new', label: 'New This Month' },
]

export function PatientsSection({ onLogSession, onBookAppt, onAssignExercises }) {
  const patients = useAppStore((s) => s.patients)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [editPatient, setEditPatient] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const filtered = patients.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'active') return p.active !== false
    if (filter === 'inactive') return p.active === false
    if (filter === 'new') return p.created_at >= monthStart
    return true
  })

  const openDetail = (patient) => {
    setSelectedPatient(patient)
    setShowDetail(true)
  }

  const openEdit = (patient) => {
    setEditPatient(patient)
    setShowForm(true)
  }

  const openAdd = () => {
    setEditPatient(null)
    setShowForm(true)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-display text-xl">Patients</h2>
        <button
          onClick={openAdd}
          className="px-3 py-1.5 bg-[#0f766e] text-white text-xs font-semibold rounded-lg"
        >
          + Add
        </button>
      </div>

      {/* Filters */}
      <div className="chip-scroll">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} placeholder="Search patients..." />

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon="👤" title="No patients found" sub="Tap + Add to add your first patient" />
      ) : (
        filtered.map((p) => (
          <PatientItem key={p.id} patient={p} onClick={() => openDetail(p)} />
        ))
      )}

      {/* Detail Modal */}
      <PatientDetailModal
        patient={selectedPatient}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        onEdit={(p) => { setShowDetail(false); openEdit(p) }}
        onLogSession={(id) => { setShowDetail(false); onLogSession(id) }}
        onBookAppt={(id) => { setShowDetail(false); onBookAppt(id) }}
        onAssignExercises={(id) => { setShowDetail(false); onAssignExercises && onAssignExercises(id) }}
      />

      {/* Form Modal */}
      <PatientFormModal
        patient={editPatient}
        open={showForm}
        onClose={() => setShowForm(false)}
      />
    </div>
  )
}

// Export the openAdd trigger so FAB can use it
export function usePatientsActions() {
  const [showForm, setShowForm] = useState(false)
  return { showForm, openAdd: () => setShowForm(true), closeForm: () => setShowForm(false) }
}
