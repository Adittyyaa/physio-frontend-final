import { createClient } from '@supabase/supabase-js'

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  }
}

function getBearerToken(headers) {
  const raw = headers?.authorization || headers?.Authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(raw)
  return match?.[1] || null
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !serviceRoleKey || !anonKey) {
    return json(500, { error: 'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY' })
  }

  const token = getBearerToken(event.headers || {})
  if (!token) return json(401, { error: 'Missing Authorization bearer token' })

  let payload = null
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const patientId = String(payload?.patientId || '').trim()
  const email = String(payload?.email || '').trim().toLowerCase()
  const password = String(payload?.password || '')

  if (!patientId || !email || !password) return json(400, { error: 'patientId, email, password are required' })
  if (password.length < 6) return json(400, { error: 'Password must be at least 6 characters' })

  const supabaseAnon = createClient(url, anonKey, { auth: { persistSession: false } })
  const supabaseAdmin = createClient(url, serviceRoleKey, { auth: { persistSession: false } })

  const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token)
  if (userError || !userData?.user) return json(401, { error: 'Invalid session' })

  const caller = userData.user
  const callerRole = caller?.user_metadata?.role || 'therapist'
  if (callerRole === 'patient') return json(403, { error: 'Patients cannot create users' })

  // Confirm the caller owns this patient row.
  const { data: patientRow, error: patientError } = await supabaseAdmin
    .from('tbl_patients')
    .select('id,user_id,patient_auth_id,patient_email')
    .eq('id', patientId)
    .maybeSingle()

  if (patientError) return json(500, { error: patientError.message || 'Failed to load patient' })
  if (!patientRow) return json(404, { error: 'Patient not found' })
  if (String(patientRow.user_id) !== String(caller.id)) return json(403, { error: 'Not allowed for this patient' })
  if (patientRow.patient_auth_id) return json(409, { error: 'Patient login already linked' })

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'patient', patient_id: patientId },
  })
  if (createError) return json(400, { error: createError.message || 'Failed to create user' })

  const newUserId = created?.user?.id
  if (!newUserId) return json(500, { error: 'User created but missing id' })

  const { error: linkError } = await supabaseAdmin
    .from('tbl_patients')
    .update({ patient_auth_id: newUserId, patient_email: email })
    .eq('id', patientId)
    .eq('user_id', caller.id)

  if (linkError) return json(500, { error: linkError.message || 'Failed to link patient user' })

  return json(200, { ok: true, patientId, userId: newUserId })
}

