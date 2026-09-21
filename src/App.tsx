import { useCallback, useEffect, useMemo, useState } from 'react'
import { addMonths, endOfMonth, startOfMonth, differenceInCalendarDays, addDays } from 'date-fns'
import type { Apartment, Building, Data, Reservation } from './lib/types'
import { EMPTY } from './lib/types'
import {
  deleteApartment, deleteBuilding, deleteReservation, fetchAll,
  saveApartment, saveBuilding, saveLocal, saveReservation, subscribe,
} from './lib/storage'
import { isOnline } from './lib/supabase'
import { fmtMonthYear, today } from './lib/dates'
import TodayView from './components/TodayView'
import TimelineView from './components/TimelineView'
import ManageView from './components/ManageView'
import ReservationModal from './components/ReservationModal'
import HelpModal from './components/HelpModal'

type View = 'hoje' | 'calendario' | 'predios'

export default function App() {
  const [data, setData] = useState<Data>(EMPTY)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [toast, setToast] = useState<string | null>(null)
  const [view, setView] = useState<View>('hoje')
  const [month, setMonth] = useState(() => startOfMonth(today()))
  const [modal, setModal] = useState<Partial<Reservation> | null>(null)
  const [help, setHelp] = useState(false)

  const showError = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }, [])

  const reload = useCallback(async () => {
    setStatus('loading')
    try {
      setData(await fetchAll())
      setStatus('ready')
    } catch (e) {
      setStatus('error')
      showError((e as Error).message)
    }
  }, [showError])

  useEffect(() => { reload() }, [reload])
  useEffect(() => subscribe(apply => setData(apply)), [])

  // modo local: persiste no navegador a cada mudança
  useEffect(() => { if (!isOnline && status === 'ready') saveLocal(data) }, [data, status])

  /**
   * Aplica a mudança na tela na hora (otimista) e grava no banco;
   * se o banco recusar, desfaz e mostra o erro.
   */
  const mutate = useCallback(async (apply: (d: Data) => Data, persist: () => Promise<void>) => {
    let prev: Data = EMPTY
    setData(d => { prev = d; return apply(d) })
    try { await persist() } catch (e) { setData(prev); showError((e as Error).message) }
  }, [showError])

  const upsertIn = <T extends { id: string }>(list: T[], item: T) => {
    const i = list.findIndex(x => x.id === item.id)
    return i === -1 ? [...list, item] : list.map((x, j) => (j === i ? item : x))
  }

  const onSaveReservation = (r: Reservation) => {
    setModal(null)
    mutate(d => ({ ...d, reservations: upsertIn(d.reservations, r) }), () => saveReservation(r))
  }
  const onDeleteReservation = (id: string) => {
    setModal(null)
    mutate(d => ({ ...d, reservations: d.reservations.filter(x => x.id !== id) }), () => deleteReservation(id))
  }
  const onSaveBuilding = (b: Building) =>
    mutate(d => ({ ...d, buildings: upsertIn(d.buildings, b) }), () => saveBuilding(b))
  const onDeleteBuilding = (id: string) =>
    mutate(d => ({
      ...d,
      buildings: d.buildings.filter(x => x.id !== id),
      apartments: d.apartments.filter(x => x.buildingId !== id),
    }), () => deleteBuilding(id))
  const onSaveApartment = (a: Apartment) =>
    mutate(d => ({ ...d, apartments: upsertIn(d.apartments, a) }), () => saveApartment(a))
  const onDeleteApartment = (id: string) =>
    mutate(d => ({ ...d, apartments: d.apartments.filter(x => x.id !== id) }), () => deleteApartment(id))

  // calendário mostra o mês inteiro + alguns dias do mês seguinte
  const range = useMemo(() => {
    const start = addDays(startOfMonth(month), -2)
    const end = addDays(endOfMonth(month), 7)
    return { start, days: differenceInCalendarDays(end, start) + 1 }
  }, [month])

  const isCurrentMonth = startOfMonth(today()).getTime() === month.getTime()
  const hasApartments = data.apartments.length > 0

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2">
          <h1 className="font-black text-lg tracking-tight mr-auto whitespace-nowrap">🏖️<span className="hidden md:inline"> Apartamentos</span></h1>
          <div className="flex bg-white/10 rounded-xl p-1">
            <Tab active={view === 'hoje'} onClick={() => setView('hoje')}>Hoje</Tab>
            <Tab active={view === 'calendario'} onClick={() => setView('calendario')}>Calendário</Tab>
            <Tab active={view === 'predios'} onClick={() => setView('predios')}>Prédios</Tab>
          </div>
          <button onClick={() => setHelp(true)} aria-label="Como usar" title="Como usar"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 font-black text-base shrink-0">?</button>
          <button onClick={() => setModal({})} disabled={!hasApartments} aria-label="Nova reserva"
            className="h-9 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-sm whitespace-nowrap shrink-0 disabled:opacity-40">
            +<span className="hidden sm:inline"> Nova</span>
          </button>
        </div>
        {view === 'calendario' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-2 flex items-center gap-2">
            <button onClick={() => setMonth(m => addMonths(m, -1))} className="w-9 h-9 rounded-lg bg-white/10 font-bold">‹</button>
            <span className="font-bold capitalize flex-1 text-center">{fmtMonthYear(month)}</span>
            <button onClick={() => setMonth(m => addMonths(m, 1))} className="w-9 h-9 rounded-lg bg-white/10 font-bold">›</button>
            {!isCurrentMonth && (
              <button onClick={() => setMonth(startOfMonth(today()))} className="h-9 px-3 rounded-lg bg-white/10 text-sm font-bold">Hoje</button>
            )}
          </div>
        )}
      </header>

      {!isOnline && (
        <div className="bg-amber-100 text-amber-900 text-xs text-center py-1 px-3 font-medium">
          Modo demonstração: os dados ficam só neste navegador. Configure o Supabase (.env) pra compartilhar.
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto">
        {status === 'loading' ? (
          <div className="p-10 text-center text-slate-400 font-medium">Carregando…</div>
        ) : status === 'error' ? (
          <div className="p-10 text-center">
            <p className="text-slate-600 font-medium mb-3">Não foi possível carregar os dados.</p>
            <button onClick={reload} className="h-10 px-4 rounded-xl bg-slate-900 text-white font-bold">Tentar de novo</button>
          </div>
        ) : view === 'predios' ? (
          <ManageView data={data}
            onSaveBuilding={onSaveBuilding} onDeleteBuilding={onDeleteBuilding}
            onSaveApartment={onSaveApartment} onDeleteApartment={onDeleteApartment} />
        ) : view === 'hoje' || !hasApartments ? (
          <TodayView data={data} onOpen={r => setModal(r)} onNew={aptId => setModal({ aptId })} onManage={() => setView('predios')} />
        ) : (
          <TimelineView data={data} start={range.start} days={range.days}
            onOpen={r => setModal(r)} onNew={(aptId, day) => setModal({ aptId, checkIn: day })} />
        )}
      </main>

      {modal && (
        <ReservationModal initial={modal} data={data}
          onSave={onSaveReservation} onDelete={onDeleteReservation} onClose={() => setModal(null)} />
      )}

      {help && <HelpModal onClose={() => setHelp(false)} />}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white font-medium text-sm px-4 py-3 rounded-2xl shadow-xl max-w-[90vw]">
          {toast}
        </div>
      )}
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`h-8 px-2.5 sm:px-3 rounded-lg text-sm font-bold transition ${active ? 'bg-white text-slate-900' : 'text-white/80 hover:text-white'}`}>
      {children}
    </button>
  )
}
