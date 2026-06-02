import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button, Input, Select, Textarea, FormGroup, FormRow, ToggleRow } from '../ui'
import { useAppStore } from '../../store/appStore'
import { patientCode4 } from '../../lib/utils'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

const EMPTY = {
  name: '', age: '', gender: '', phone: '',
  diagnosis: '', treatment_area: '', referred_by: '',
  notes: '', allow_reschedule: true, active: true,
}

// Creates a patient auth user via Supabase Admin REST API (requires service role key)
async function createPatientAuthUser(email, password, patientId) {
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  if (!serviceRoleKey) {
    throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY is not set in .env')
  }

  // Create the auth user with email already confirmed
  const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'patient', patient_id: patientId },
    }),
  })

  const createBody = await createRes.json()
  if (!createRes.ok) {
    throw new Error(createBody?.msg || createBody?.message || 'Failed to create patient user')
  }

  const newUserId = createBody?.id
  if (!newUserId) throw new Error('User created but missing id')

  // Link the auth user to the patient row
  const { error: linkError } = await supabase
    .from('tbl_patients')
    .update({ patient_auth_id: newUserId, patient_email: email })
    .eq('id', patientId)

  if (linkError) throw new Error(linkError.message || 'Failed to link patient user')

  return newUserId
}

export function PatientFormModal({ patient, open, onClose }) {
  const patients = useAppStore((s) => s.patients)
  const addPatient = useAppStore((s) => s.addPatient)
  const updatePatient = useAppStore((s) => s.updatePatient)
  const [form, setForm] = useState(EMPTY)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [creatingLogin, setCreatingLogin] = useState(false)

  useEffect(() => {
    if (!open) return
    if (patient) {
      setLoginEmail(patient.patient_email || '')
      setLoginPassword('')
      setForm({
        name: patient.name || '',
        age: patient.age || '',
        gender: patient.gender || '',
        phone: patient.phone || '',
        diagnosis: patient.diagnosis || '',
        treatment_area: patient.treatment_area || '',
        referred_by: patient.referred_by || '',
        notes: patient.notes || '',
        allow_reschedule: patient.allow_reschedule !== false,
        active: patient.active !== false,
      })
    } else {
      setLoginEmail('')
      setLoginPassword('')
      setForm(EMPTY)
    }
  }, [patient, open, patients])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const generatePassword = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?'
    let out = ''
    for (let i = 0; i < 12; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)]
    setLoginPassword(out)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Please enter patient name'); return }

    // Validate login fields if either is filled
    const wantsLogin = !patient && (loginEmail.trim() || loginPassword)
    if (wantsLogin) {
      if (!loginEmail.trim()) { alert('Please enter the patient email'); return }
      if (!loginPassword) { alert('Please enter a password for the patient'); return }
      if (loginPassword.length < 6) { alert('Password must be at least 6 characters'); return }
    }

    let codeToUse = patient ? patient.id : null
    if (!patient) {
      const used = new Set((patients || []).map((p) => String(p.id)))
      let code = patientCode4()
      let tries = 0
      while (used.has(code) && tries < 25) { code = patientCode4(); tries += 1 }
      codeToUse = code
    }

    const data = {
      id: codeToUse,
      patient_email: loginEmail.trim() || null,
      name: form.name.trim(),
      age: form.age || null,
      gender: form.gender || null,
      phone: form.phone.trim() || null,
      diagnosis: form.diagnosis.trim() || null,
      treatment_area: form.treatment_area || null,
      referred_by: form.referred_by.trim() || null,
      notes: form.notes.trim() || null,
      allow_reschedule: form.allow_reschedule,
      active: form.active,
    }

    const ok = patient ? await updatePatient(patient.id, data) : await addPatient(data)
    if (!ok) return

    // Auto-create patient portal login (no email confirmation required)
    if (wantsLogin) {
      try {
        setCreatingLogin(true)
        await createPatientAuthUser(loginEmail.trim(), loginPassword, codeToUse)
        toast.success('Patient login created — patient can log in immediately')
      } catch (e) {
        toast.error(e?.message || 'Patient login creation failed')
      } finally {
        setCreatingLogin(false)
      }
    }

    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={patient ? 'Edit Patient' : 'Add Patient'}>
      <FormGroup label="Full Name *">
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Rajesh Sharma" />
      </FormGroup>
      <FormRow>
        <FormGroup label="Age">
          <Input type="number" value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="35" />
        </FormGroup>
        <FormGroup label="Gender">
          <Select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </Select>
        </FormGroup>
      </FormRow>
      <FormGroup label="Mobile Number">
        <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" />
      </FormGroup>
      <FormGroup label="Diagnosis / Condition">
        <Input value={form.diagnosis} onChange={(e) => set('diagnosis', e.target.value)} placeholder="e.g. Lumbar spondylosis" />
      </FormGroup>
      <FormGroup label="Treatment Area">
        <Select value={form.treatment_area} onChange={(e) => set('treatment_area', e.target.value)}>
          <option value="">Select area</option>
          {['Neck','Shoulder','Upper Back','Lower Back','Hip','Knee','Ankle/Foot','Wrist/Hand','Elbow','Full Body','Other'].map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Select>
      </FormGroup>
      <FormGroup label="Referred By">
        <Input value={form.referred_by} onChange={(e) => set('referred_by', e.target.value)} placeholder="Doctor name or self" />
      </FormGroup>
      <FormGroup label="Notes">
        <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any special notes, allergies, precautions..." />
      </FormGroup>
      <ToggleRow
        label="Allow Self Rescheduling"
        sub="Patient can reschedule their own appointments"
        checked={form.allow_reschedule}
        onChange={(v) => set('allow_reschedule', v)}
      />

      {/* Patient Portal Login */}
      <div className="pt-4 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Patient Portal Login</div>
        {patient && patient.patient_auth_id ? (
          <div className="text-sm px-3 py-2 rounded-lg mb-2" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
            ✓ Patient login already linked ({patient.patient_email || 'email on file'})
          </div>
        ) : (
          <>
            <FormGroup label="Email">
              <Input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="patient@example.com"
              />
              {!patient && (
                <div className="text-xs text-[#64748b] mt-1">
                  Fill email &amp; password to create a portal login. No email confirmation needed.
                </div>
              )}
              {patient && (
                <div className="text-xs text-[#64748b] mt-1">
                  For reference only. To change the auth email, reset from Supabase dashboard.
                </div>
              )}
            </FormGroup>
            {!patient && (
              <FormGroup label="Password">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    Generate
                  </button>
                </div>
                <div className="text-xs text-[#64748b] mt-1">
                  Share these credentials with the patient. Passwords are not stored in PhysioTrack.
                </div>
              </FormGroup>
            )}
          </>
        )}
      </div>

      <ToggleRow
        label="Active Patient"
        sub="Uncheck to mark as discharged"
        checked={form.active}
        onChange={(v) => set('active', v)}
      />
      <div className="flex gap-2.5 mt-2">
        <Button variant="outline" full onClick={onClose}>Cancel</Button>
        <Button full onClick={handleSave} disabled={creatingLogin}>
          {creatingLogin ? 'Creating Login...' : 'Save Patient'}
        </Button>
      </div>
    </Modal>
  )
}
