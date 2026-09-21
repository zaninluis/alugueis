import { useEffect, useState } from 'react'
import type { Data, Reservation } from '../lib/types'
import { allApartments, apartmentsOf, aptFullLabel, sortedBuildings } from '../lib/types'
import { addDaysISO, fmtLong, nights, overlaps, todayISO } from '../lib/dates'
import { newId } from '../lib/storage'

type Props = {
  initial: Partial<Reservation>     // com id => edição; sem id => nova
  data: Data
  onSave: (r: Reservation) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function ReservationModal({ initial, data, onSave, onDelete, onClose }: Props) {
  const editing = Boolean(initial.id)
  const buildings = sortedBuildings(data)
  const [aptId, setAptId] = useState(initial.aptId ?? allApartments(data)[0]?.id ?? '')
  const [guest, setGuest] = useState(initial.guest ?? '')
  const [people, setPeople] = useState(initial.people ?? 2)
  const [checkIn, setCheckIn] = useState(initial.checkIn ?? todayISO())
  const [checkOut, setCheckOut] = useState(initial.checkOut ?? addDaysISO(initial.checkIn ?? todayISO(), 3))
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [bookedBy, setBookedBy] = useState(initial.bookedBy ?? (editing ? '' : lastBookedBy()))
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const n = nights(checkIn, checkOut)
  const conflict = data.reservations.find(r =>
    r.id !== initial.id && r.aptId === aptId && overlaps(checkIn, checkOut, r.checkIn, r.checkOut))

  const errors: string[] = []
  if (!aptId) errors.push('Escolha um apartamento.')
  if (!guest.trim()) errors.push('Informe o nome do hóspede.')
  if (n < 1) errors.push('A saída precisa ser depois da entrada.')
  if (people < 1) errors.push('Informe quantas pessoas.')
  if (conflict) errors.push(`Conflito: ${conflict.guest} já está em ${aptFullLabel(data, aptId)} nesse período.`)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (errors.length) return
    onSave({
      id: initial.id ?? newId(), aptId, guest: guest.trim(), people, checkIn, checkOut,
      phone: phone.trim() || undefined, notes: notes.trim() || undefined,
      bookedBy: bookedBy.trim() || undefined,
    })
    if (bookedBy.trim()) rememberBookedBy(bookedBy.trim())
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">{editing ? 'Reserva' : 'Nova reserva'}</h2>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold">✕</button>
        </div>

        <div className="space-y-3">
          <Field label="Apartamento">
            <div className="space-y-2">
              {buildings.filter(b => apartmentsOf(data, b.id).length > 0).map(b => (
                <div key={b.id}>
                  <div className="text-xs font-bold text-slate-500 mb-1">🏢 {b.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {apartmentsOf(data, b.id).map(a => (
                      <button type="button" key={a.id} onClick={() => setAptId(a.id)}
                        className={`h-10 px-3 rounded-xl font-bold text-sm ${a.id === aptId ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {a.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Field>

          <Field label="Hóspede">
            <input autoFocus value={guest} onChange={e => setGuest(e.target.value)} placeholder="Nome do hóspede"
              className="w-full h-12 rounded-xl border border-slate-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </Field>

          <Field label="Pessoas">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPeople(p => Math.max(1, p - 1))} className="w-12 h-12 rounded-xl bg-slate-100 text-2xl font-bold">−</button>
              <div className="flex-1 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl font-black">{people}</div>
              <button type="button" onClick={() => setPeople(p => Math.min(30, p + 1))} className="w-12 h-12 rounded-xl bg-slate-100 text-2xl font-bold">+</button>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Entrada">
              <input type="date" value={checkIn} onChange={e => {
                const v = e.target.value
                setCheckIn(v)
                if (v >= checkOut) setCheckOut(addDaysISO(v, 1))
              }} className="w-full h-12 rounded-xl border border-slate-300 px-3 text-base" />
            </Field>
            <Field label="Saída">
              <input type="date" value={checkOut} min={addDaysISO(checkIn, 1)} onChange={e => setCheckOut(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-300 px-3 text-base" />
            </Field>
          </div>
          {n >= 1 && (
            <p className="text-sm text-slate-500 -mt-1">
              {n} {n === 1 ? 'noite' : 'noites'} · {fmtLong(checkIn)} → {fmtLong(checkOut)}
            </p>
          )}

          <Field label="Reservado por">
            <input value={bookedBy} onChange={e => setBookedBy(e.target.value)} placeholder="Quem fez a reserva?"
              className="w-full h-12 rounded-xl border border-slate-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </Field>

          <Field label="Telefone (opcional)">
            <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder="Telefone do hóspede"
              className="w-full h-12 rounded-xl border border-slate-300 px-3 text-base" />
          </Field>
          <Field label="Observações (opcional)">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Anotações sobre a reserva"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base" />
          </Field>
        </div>

        {errors.length > 0 && (
          <ul className="mt-3 text-sm text-rose-600 font-medium space-y-0.5">
            {errors.map(e => <li key={e}>• {e}</li>)}
          </ul>
        )}

        <div className="mt-5 flex gap-2">
          {editing && (
            confirmDelete ? (
              <button type="button" onClick={() => onDelete(initial.id!)}
                className="h-12 px-4 rounded-xl bg-rose-600 text-white font-bold">Confirmar exclusão</button>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)}
                className="h-12 px-4 rounded-xl bg-rose-50 text-rose-600 font-bold">Excluir</button>
            )
          )}
          <button type="submit" disabled={errors.length > 0}
            className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-40">
            {editing ? 'Salvar' : 'Criar reserva'}
          </button>
        </div>
      </form>
    </div>
  )
}

// lembra neste aparelho quem costuma fazer as reservas
const BOOKER_KEY = 'alugueis.reservadoPor'
const lastBookedBy = () => { try { return localStorage.getItem(BOOKER_KEY) ?? '' } catch { return '' } }
const rememberBookedBy = (v: string) => { try { localStorage.setItem(BOOKER_KEY, v) } catch { /* ignora */ } }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  )
}
