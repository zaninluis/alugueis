import { useState } from 'react'
import type { Apartment, Building, Data } from '../lib/types'
import { apartmentsOf, sortedBuildings } from '../lib/types'
import { newId } from '../lib/storage'

type Props = {
  data: Data
  onSaveBuilding: (b: Building) => void
  onDeleteBuilding: (id: string) => void
  onSaveApartment: (a: Apartment) => void
  onDeleteApartment: (id: string) => void
}

export default function ManageView({ data, onSaveBuilding, onDeleteBuilding, onSaveApartment, onDeleteApartment }: Props) {
  const buildings = sortedBuildings(data)
  const [newBuilding, setNewBuilding] = useState('')

  const addBuilding = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newBuilding.trim()
    if (!name) return
    onSaveBuilding({ id: newId(), name, order: buildings.length })
    setNewBuilding('')
  }

  return (
    <div className="p-3 sm:p-4 max-w-3xl mx-auto space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        <h2 className="font-black text-lg mb-1">Prédios e apartamentos</h2>
        <p className="text-sm text-slate-500 mb-3">
          Cadastre cada prédio e, dentro dele, os apartamentos. Os nomes são livres.
        </p>
        <form onSubmit={addBuilding} className="flex gap-2">
          <input value={newBuilding} onChange={e => setNewBuilding(e.target.value)} placeholder="Nome do prédio"
            className="flex-1 h-12 rounded-xl border border-slate-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <button type="submit" disabled={!newBuilding.trim()}
            className="h-12 px-4 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-40 whitespace-nowrap">+ Prédio</button>
        </form>
      </div>

      {buildings.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-6">Nenhum prédio ainda. Comece criando um acima. 👆</p>
      )}

      {buildings.map(b => (
        <BuildingCard key={b.id} building={b} apartments={apartmentsOf(data, b.id)}
          reservationsCount={id => data.reservations.filter(r => r.aptId === id).length}
          onSave={onSaveBuilding} onDelete={onDeleteBuilding}
          onSaveApartment={onSaveApartment} onDeleteApartment={onDeleteApartment} />
      ))}
    </div>
  )
}

function BuildingCard({ building, apartments, reservationsCount, onSave, onDelete, onSaveApartment, onDeleteApartment }: {
  building: Building
  apartments: Apartment[]
  reservationsCount: (aptId: string) => number
  onSave: (b: Building) => void
  onDelete: (id: string) => void
  onSaveApartment: (a: Apartment) => void
  onDeleteApartment: (id: string) => void
}) {
  const [newApt, setNewApt] = useState('')
  const [confirm, setConfirm] = useState(false)
  const totalRes = apartments.reduce((s, a) => s + reservationsCount(a.id), 0)

  const addApt = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newApt.trim()
    if (!name) return
    onSaveApartment({ id: newId(), buildingId: building.id, name, order: apartments.length })
    setNewApt('')
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🏢</span>
        <InlineName value={building.name} onChange={name => onSave({ ...building, name })} className="text-lg font-black" />
        <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">{apartments.length} apto{apartments.length === 1 ? '' : 's'}</span>
        {confirm ? (
          <span className="flex gap-1">
            <button onClick={() => onDelete(building.id)} className="h-8 px-2 rounded-lg bg-rose-600 text-white text-xs font-bold">Confirmar</button>
            <button onClick={() => setConfirm(false)} className="h-8 px-2 rounded-lg bg-slate-100 text-xs font-bold">Cancelar</button>
          </span>
        ) : (
          <button onClick={() => setConfirm(true)} disabled={totalRes > 0}
            title={totalRes > 0 ? 'Exclua as reservas antes' : 'Excluir prédio'}
            className="h-8 px-2 rounded-lg text-rose-600 text-xs font-bold disabled:opacity-30">Excluir</button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {apartments.map(a => (
          <ApartmentChip key={a.id} apt={a} locked={reservationsCount(a.id) > 0}
            onRename={name => onSaveApartment({ ...a, name })} onDelete={() => onDeleteApartment(a.id)} />
        ))}
        {apartments.length === 0 && <span className="text-sm text-slate-400">Nenhum apartamento ainda.</span>}
      </div>

      <form onSubmit={addApt} className="flex gap-2">
        <input value={newApt} onChange={e => setNewApt(e.target.value)} placeholder="Número ou nome do apartamento"
          className="flex-1 h-11 rounded-xl border border-slate-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-sky-500" />
        <button type="submit" disabled={!newApt.trim()}
          className="h-11 px-4 rounded-xl bg-emerald-500 text-white font-bold disabled:opacity-40 whitespace-nowrap">+ Apto</button>
      </form>
    </div>
  )
}

function ApartmentChip({ apt, locked, onRename, onDelete }: {
  apt: Apartment; locked: boolean; onRename: (n: string) => void; onDelete: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  return (
    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 pl-3 pr-1 h-10">
      <InlineName value={apt.name} onChange={onRename} className="font-bold" />
      {confirm ? (
        <>
          <button onClick={onDelete} className="h-7 px-2 rounded-lg bg-rose-600 text-white text-xs font-bold">Sim</button>
          <button onClick={() => setConfirm(false)} className="h-7 px-2 rounded-lg bg-white text-xs font-bold">Não</button>
        </>
      ) : (
        <button onClick={() => setConfirm(true)} disabled={locked} aria-label={`Excluir ${apt.name}`}
          title={locked ? 'Tem reservas; exclua-as antes' : 'Excluir apartamento'}
          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white font-bold disabled:opacity-30">✕</button>
      )}
    </span>
  )
}

/** Nome editável: toque pra editar, Enter/blur salva, Esc cancela. */
function InlineName({ value, onChange, className = '' }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const commit = () => {
    setEditing(false)
    const v = draft.trim()
    if (v && v !== value) onChange(v)
    else setDraft(value)
  }
  if (!editing) {
    return (
      <button onClick={() => { setDraft(value); setEditing(true) }} title="Toque pra renomear"
        className={`${className} text-left hover:underline decoration-dotted underline-offset-4`}>{value}</button>
    )
  }
  return (
    <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
      className={`${className} h-8 rounded-lg border border-sky-400 px-2 bg-white w-36 focus:outline-none`} />
  )
}
