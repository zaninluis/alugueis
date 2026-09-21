import type { Apartment, Data, Reservation } from '../lib/types'
import { apartmentsOf, sortedBuildings } from '../lib/types'
import { covers, daysUntil, fmtLong, fmtShort, todayISO } from '../lib/dates'
import { colorFor } from '../lib/colors'

type Props = {
  data: Data
  onOpen: (r: Reservation) => void
  onNew: (aptId: string) => void
  onManage: () => void
}

export default function TodayView({ data, onOpen, onNew, onManage }: Props) {
  const t = todayISO()
  const buildings = sortedBuildings(data)
  const current = data.reservations.filter(r => covers(r.checkIn, r.checkOut, t))
  const occupiedIds = new Set(current.map(r => r.aptId))
  const people = current.reduce((s, r) => s + r.people, 0)
  const total = data.apartments.length

  if (total === 0) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="text-5xl mb-3">🏢</div>
        <h2 className="text-xl font-black mb-2">Vamos começar</h2>
        <p className="text-slate-500 mb-4">Cadastre os prédios e os apartamentos de cada um. Depois é só ir marcando as reservas.</p>
        <button onClick={onManage} className="h-12 px-5 rounded-xl bg-slate-900 text-white font-bold">Cadastrar prédios e aptos</button>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Ocupados" value={occupiedIds.size} tone="bg-slate-900 text-white" />
        <Stat label="Livres" value={total - occupiedIds.size} tone="bg-emerald-500 text-white" />
        <Stat label="Pessoas" value={people} tone="bg-sky-500 text-white" />
      </div>

      {buildings.map(b => {
        const apts = apartmentsOf(data, b.id)
        const occ = apts.filter(a => occupiedIds.has(a.id)).length
        return (
          <section key={b.id}>
            <div className="flex items-baseline gap-2 mb-2 px-1">
              <h2 className="font-black text-lg">🏢 {b.name}</h2>
              <span className="text-sm text-slate-500">{occ}/{apts.length} ocupados</span>
            </div>
            {apts.length === 0 ? (
              <button onClick={onManage} className="text-sm text-slate-400 px-1 hover:underline">Nenhum apartamento — cadastrar</button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {apts.map(apt => {
                  const mine = data.reservations.filter(r => r.aptId === apt.id)
                  const cur = mine.find(r => covers(r.checkIn, r.checkOut, t))
                  const next = mine.filter(r => r.checkIn > t).sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0]
                  return <AptCard key={apt.id} apt={apt} current={cur} next={next} onOpen={onOpen} onNew={() => onNew(apt.id)} />
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 ${tone}`}>
      <div className="text-3xl sm:text-4xl font-black leading-none">{value}</div>
      <div className="text-xs sm:text-sm opacity-80 mt-1 font-medium">{label}</div>
    </div>
  )
}

function AptCard({ apt, current, next, onOpen, onNew }: {
  apt: Apartment
  current?: Reservation
  next?: Reservation
  onOpen: (r: Reservation) => void
  onNew: () => void
}) {
  if (!current) {
    const nextIn = next ? daysUntil(next.checkIn) : null
    return (
      <button onClick={next ? () => onOpen(next) : onNew}
        className="text-left rounded-2xl bg-white border-2 border-dashed border-emerald-300 p-4 hover:border-emerald-500 transition min-h-36 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-lg font-black text-slate-800">{apt.name}</span>
          <span className="text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Livre</span>
        </div>
        <div className="mt-auto pt-3 text-sm text-slate-500">
          {next ? (
            <>
              <div>Próxima: <span className="font-semibold text-slate-700">{next.guest}</span>{next.bookedBy && <span className="text-slate-400"> · por {next.bookedBy}</span>}</div>
              <div>{nextIn === 0 ? 'chega hoje' : nextIn === 1 ? 'chega amanhã' : `chega em ${nextIn} dias`} · {fmtShort(next.checkIn)}</div>
            </>
          ) : (
            <div className="text-emerald-700 font-medium">+ Adicionar reserva</div>
          )}
        </div>
      </button>
    )
  }

  const c = colorFor(current.guest)
  const leaves = daysUntil(current.checkOut)
  const leaveText = leaves === 0 ? 'Sai hoje' : leaves === 1 ? 'Sai amanhã' : `Sai em ${leaves} dias`
  const arrivedToday = current.checkIn === todayISO()

  return (
    <button onClick={() => onOpen(current)}
      className={`text-left rounded-2xl ${c.bg} ${c.text} p-4 shadow-md hover:brightness-105 transition min-h-36 flex flex-col relative overflow-hidden`}>
      <div className="flex items-center justify-between">
        <span className="text-lg font-black">{apt.name}</span>
        <span className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full ${leaves <= 1 ? 'bg-white text-slate-900' : 'bg-white/25'}`}>
          {arrivedToday ? 'Chegou hoje' : leaveText}
        </span>
      </div>
      <div className="mt-2 text-xl font-bold leading-tight truncate">{current.guest}</div>
      {current.bookedBy && <div className="text-xs opacity-80 mt-0.5">reservado por <span className="font-bold">{current.bookedBy}</span></div>}
      <div className="mt-auto pt-3 flex items-end justify-between">
        <div className="text-sm opacity-90">
          {fmtShort(current.checkIn)} → {fmtShort(current.checkOut)}
          <div className="text-xs opacity-80">até {fmtLong(current.checkOut)}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black leading-none">{current.people}</div>
          <div className="text-xs opacity-80">{current.people === 1 ? 'pessoa' : 'pessoas'}</div>
        </div>
      </div>
    </button>
  )
}
