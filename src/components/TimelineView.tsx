import { useEffect, useMemo, useRef } from 'react'
import { addDays, isWeekend } from 'date-fns'
import type { Data, Reservation } from '../lib/types'
import { apartmentsOf, sortedBuildings } from '../lib/types'
import { fmtDayNum, fmtWeekday, fromISO, nights, today, toISO } from '../lib/dates'
import { colorFor } from '../lib/colors'

type Props = {
  data: Data
  start: Date         // primeiro dia visível
  days: number        // quantidade de dias visíveis
  onOpen: (r: Reservation) => void
  onNew: (aptId: string, day: string) => void
}

const COL = 56       // largura de cada dia (px)
const INSET = Math.round(COL * 0.35)  // recuo nas pontas (entrada/saída ao meio-dia)
const ROW = 52       // altura de cada linha (px)
const GROUP = 30     // altura do cabeçalho de prédio (px)
const LABEL = 88     // largura da coluna de apartamentos (px)

export default function TimelineView({ data, start, days, onOpen, onNew }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const startISO = toISO(start)
  const endISO = toISO(addDays(start, days))
  const t = toISO(today())
  const buildings = sortedBuildings(data)

  const cols = useMemo(() => Array.from({ length: days }, (_, i) => addDays(start, i)), [start, days])

  // ao carregar / mudar mês, rola pra deixar "hoje" visível perto do começo
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const idx = cols.findIndex(d => toISO(d) === t)
    el.scrollLeft = idx > 1 ? (idx - 1) * COL : 0
  }, [cols, t])

  const dayIndex = (iso: string) =>
    Math.round((fromISO(iso).getTime() - start.getTime()) / 86_400_000)

  return (
    <div className="p-3 sm:p-4">
      <div ref={scroller} className="scroll-thin overflow-x-auto rounded-2xl bg-white shadow-sm border border-slate-200">
        <div style={{ width: LABEL + days * COL, minWidth: '100%' }}>
          {/* cabeçalho de dias */}
          <div className="flex sticky top-0 z-20 bg-white border-b border-slate-200">
            <div className="sticky left-0 z-30 bg-white border-r border-slate-200 shrink-0" style={{ width: LABEL }} />
            {cols.map(d => {
              const iso = toISO(d)
              const isToday = iso === t
              const we = isWeekend(d)
              return (
                <div key={iso} style={{ width: COL }}
                  className={`shrink-0 text-center py-1.5 leading-tight ${we ? 'bg-slate-50' : ''}`}>
                  <div className={`text-[10px] font-semibold ${isToday ? 'text-sky-600' : 'text-slate-400'}`}>{fmtWeekday(d)}</div>
                  <div className={`text-sm font-bold mx-auto w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-600 text-white' : 'text-slate-700'}`}>{fmtDayNum(d)}</div>
                </div>
              )
            })}
          </div>

          {buildings.map(b => (
            <div key={b.id}>
              {/* cabeçalho do prédio */}
              <div className="flex bg-slate-100 border-b border-slate-200" style={{ height: GROUP }}>
                <div className="sticky left-0 z-10 flex items-center px-2 font-black text-xs uppercase tracking-wide text-slate-600 whitespace-nowrap">
                  🏢 {b.name}
                </div>
              </div>

              {/* linhas por apartamento */}
              {apartmentsOf(data, b.id).map(apt => {
                const mine = data.reservations.filter(r =>
                  r.aptId === apt.id && r.checkIn < endISO && r.checkOut > startISO)
                return (
                  <div key={apt.id} className="flex relative border-b border-slate-100" style={{ height: ROW }}>
                    <div className="sticky left-0 z-10 bg-white border-r border-slate-200 shrink-0 flex items-center px-2 font-black text-slate-800 text-sm truncate"
                      style={{ width: LABEL }} title={apt.name}>
                      {apt.name}
                    </div>
                    {/* células clicáveis do fundo */}
                    {cols.map(d => {
                      const iso = toISO(d)
                      return (
                        <button key={iso} onClick={() => onNew(apt.id, iso)} aria-label={`Nova reserva ${apt.name} ${iso}`}
                          style={{ width: COL }}
                          className={`shrink-0 border-r border-slate-100 hover:bg-emerald-50 ${isWeekend(d) ? 'bg-slate-50/70' : ''} ${iso === t ? 'bg-sky-50' : ''}`} />
                      )
                    })}
                    {/* barras de reserva */}
                    {mine.map(r => {
                      const from = Math.max(dayIndex(r.checkIn), 0)
                      const to = Math.min(dayIndex(r.checkOut), days)
                      const c = colorFor(r.guest)
                      const clippedStart = dayIndex(r.checkIn) < 0
                      const clippedEnd = dayIndex(r.checkOut) > days
                      const span = to - from
                      return (
                        <button key={r.id} onClick={() => onOpen(r)}
                          title={`${r.guest} · ${r.people} pessoas · ${nights(r.checkIn, r.checkOut)} noites${r.bookedBy ? ` · reservado por ${r.bookedBy}` : ''}`}
                          style={{
                            left: LABEL + from * COL + (clippedStart ? 0 : INSET),
                            width: span * COL - (clippedStart ? 0 : INSET) - (clippedEnd ? 0 : INSET),
                            top: 7, height: ROW - 14,
                          }}
                          className={`absolute z-[5] ${c.bg} ${c.text} ${clippedStart ? '' : 'rounded-l-full'} ${clippedEnd ? '' : 'rounded-r-full'} shadow-sm px-2.5 flex items-center gap-1.5 hover:brightness-110 text-left`}>
                          {/* sticky: o nome acompanha a rolagem e continua visível mesmo com o início da barra fora da tela */}
                          <span className={`sticky font-bold truncate ${span < 3 ? 'text-xs' : 'text-sm'}`} style={{ left: LABEL + 10 }}>
                            {r.guest}{span < 5 && <span className="font-black opacity-90"> · {r.people}</span>}
                          </span>
                          {span >= 5 && (
                            <span className="ml-auto shrink-0 text-xs font-black bg-white/25 rounded-full px-1.5 py-0.5">{r.people} 👤</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2 text-center">Toque num espaço vazio pra criar uma reserva · toque numa barra pra ver detalhes</p>
    </div>
  )
}
