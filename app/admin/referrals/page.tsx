'use client'
// app/admin/referrals/page.tsx
// Panel de gestión de referidos — integrar en tu layout admin existente

import { useEffect, useState, useCallback } from 'react'

type Referral = {
  id: string
  referrer_email: string
  referred_email: string
  amount_paid: number
  credit_amount: number
  status: string
  is_suspicious: boolean
  suspicious_reason: string | null
  notes: string | null
  created_at: string
  available_at: string | null
  applied_at: string | null
}

type Stats = {
  pendiente_validacion: { count: number; total: number }
  disponible: { count: number; total: number }
  aplicado: { count: number; total: number }
  invalido: { count: number }
  suspicious: { count: number }
}

const LABELS: Record<string, string> = {
  pendiente_validacion: 'Pendiente',
  disponible: 'Disponible',
  aplicado: 'Aplicado',
  invalido: 'Inválido',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
  registrado: 'Registrado',
}

const BADGE: Record<string, string> = {
  pendiente_validacion: 'bg-yellow-100 text-yellow-800',
  disponible: 'bg-green-100 text-green-800',
  aplicado: 'bg-blue-100 text-blue-800',
  invalido: 'bg-red-100 text-red-800',
  cancelado: 'bg-gray-100 text-gray-500',
  reembolsado: 'bg-orange-100 text-orange-700',
}

// Ajusta según tu auth — puede ser un cookie, header, etc.
const TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? ''

async function api(path: string, opts?: RequestInit) {
  return fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'x-admin-token': TOKEN, ...(opts?.headers ?? {}) },
  })
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ referral: Referral; action: string } | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (status?: string) => {
    setLoading(true)
    const qs = status ? `?status=${status}` : ''
    const res = await api(`/api/admin/referrals${qs}`)
    const data = await res.json()
    setReferrals(data.referrals ?? [])
    setStats(data.stats ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { load(filter || undefined) }, [filter, load])

  async function runAction() {
    if (!modal) return
    if (['apply_credit', 'invalidate'].includes(modal.action) && !note.trim()) {
      alert('La nota es obligatoria')
      return
    }
    setSaving(true)
    const res = await api('/api/admin/referrals', {
      method: 'POST',
      body: JSON.stringify({ action: modal.action, referralId: modal.referral.id, notes: note }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { alert(data.error ?? 'Error'); return }
    setModal(null)
    setNote('')
    load(filter || undefined)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Referidos de clientes</h1>
      <p className="text-sm text-gray-500 mb-6">Crédito interno: 20% del primer pago del referido</p>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <Card label="Pendientes" count={stats.pendiente_validacion.count} amount={stats.pendiente_validacion.total} color="yellow" />
          <Card label="Disponibles" count={stats.disponible.count} amount={stats.disponible.total} color="green" />
          <Card label="Aplicados" count={stats.aplicado.count} amount={stats.aplicado.total} color="blue" />
          <Card label="Inválidos" count={stats.invalido.count} color="red" />
          <Card label="Sospechosos" count={stats.suspicious.count} color="orange" />
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['', 'pendiente_validacion', 'disponible', 'aplicado', 'invalido', 'reembolsado'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              filter === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {s ? LABELS[s] : 'Todos'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-gray-400 py-12 text-center">Cargando...</p>
      ) : referrals.length === 0 ? (
        <p className="text-gray-400 py-12 text-center">Sin referidos con este filtro.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Referrer</th>
                <th className="px-4 py-3">Referido</th>
                <th className="px-4 py-3">Pagado</th>
                <th className="px-4 py-3">Crédito</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.referrer_email}</div>
                    {r.is_suspicious && (
                      <div className="text-xs text-red-500 mt-0.5">⚠️ {r.suspicious_reason}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.referred_email}</td>
                  <td className="px-4 py-3">{r.amount_paid?.toFixed(2)}€</td>
                  <td className="px-4 py-3 font-semibold">{r.credit_amount?.toFixed(2)}€</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(r.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {r.status === 'pendiente_validacion' && !r.is_suspicious && (
                        <Btn label="Liberar" color="green" onClick={() => setModal({ referral: r, action: 'release_credit' })} />
                      )}
                      {r.status === 'disponible' && (
                        <Btn label="Aplicar" color="blue" onClick={() => setModal({ referral: r, action: 'apply_credit' })} />
                      )}
                      {!['invalido', 'aplicado', 'cancelado', 'reembolsado'].includes(r.status) && (
                        <Btn label="Invalidar" color="red" onClick={() => setModal({ referral: r, action: 'invalidate' })} />
                      )}
                    </div>
                    {r.notes && (
                      <div className="text-xs text-gray-400 mt-1 max-w-xs truncate" title={r.notes}>{r.notes}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de acción */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-1">
              {modal.action === 'release_credit' && '¿Liberar crédito?'}
              {modal.action === 'apply_credit' && '¿Marcar como aplicado?'}
              {modal.action === 'invalidate' && '¿Invalidar crédito?'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {modal.referral.referrer_email} → {modal.referral.referred_email}
              {' · '}
              <strong>{modal.referral.credit_amount?.toFixed(2)}€</strong>
            </p>
            <textarea
              className="w-full border rounded-lg p-2.5 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder={modal.action === 'invalidate' ? 'Motivo de invalidación (obligatorio)' : 'Nota interna (recomendada)'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => { setModal(null); setNote('') }}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={runAction}
                disabled={saving}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ label, count, amount, color }: { label: string; count: number; amount?: number; color: string }) {
  const bg: Record<string, string> = {
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    red: 'bg-red-50 border-red-200',
    orange: 'bg-orange-50 border-orange-200',
  }
  return (
    <div className={`border rounded-xl p-4 ${bg[color] ?? ''}`}>
      <div className="text-xs text-gray-500 mb-1 font-medium">{label}</div>
      <div className="text-2xl font-bold">{count}</div>
      {amount !== undefined && <div className="text-sm text-gray-600">{amount.toFixed(2)}€</div>}
    </div>
  )
}

function Btn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const cls: Record<string, string> = {
    green: 'text-green-700 border-green-300 hover:bg-green-50',
    blue: 'text-blue-700 border-blue-300 hover:bg-blue-50',
    red: 'text-red-700 border-red-300 hover:bg-red-50',
  }
  return (
    <button onClick={onClick} className={`px-2 py-0.5 border rounded text-xs transition-colors ${cls[color] ?? ''}`}>
      {label}
    </button>
  )
}
