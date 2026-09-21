import type { Apartment, Building, Data, Reservation } from './types'
import { EMPTY } from './types'
import { addDaysISO, todayISO } from './dates'
import { supabase } from './supabase'

/**
 * Camada de dados. Com Supabase configurado (.env) usa o banco compartilhado
 * e recebe mudanças em tempo real; sem configuração cai no localStorage
 * (modo demonstração, só neste navegador).
 */

const KEY = 'alugueis.dados.v2'

export const newId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))

// ---------- mapeamento linha <-> objeto ----------

type BuildingRow = { id: string; nome: string; ordem: number }
type ApartmentRow = { id: string; predio_id: string; nome: string; ordem: number }
type ReservationRow = {
  id: string; apartamento_id: string; guest: string; people: number
  check_in: string; check_out: string; phone: string | null; notes: string | null
  reservado_por: string | null
}

const bFrom = (r: BuildingRow): Building => ({ id: r.id, name: r.nome, order: r.ordem })
const bTo = (b: Building): BuildingRow => ({ id: b.id, nome: b.name, ordem: b.order })
const aFrom = (r: ApartmentRow): Apartment => ({ id: r.id, buildingId: r.predio_id, name: r.nome, order: r.ordem })
const aTo = (a: Apartment): ApartmentRow => ({ id: a.id, predio_id: a.buildingId, nome: a.name, ordem: a.order })
const rFrom = (r: ReservationRow): Reservation => ({
  id: r.id, aptId: r.apartamento_id, guest: r.guest, people: r.people,
  checkIn: r.check_in, checkOut: r.check_out,
  phone: r.phone ?? undefined, notes: r.notes ?? undefined,
  bookedBy: r.reservado_por ?? undefined,
})
const rTo = (r: Reservation): ReservationRow => ({
  id: r.id, apartamento_id: r.aptId, guest: r.guest, people: r.people,
  check_in: r.checkIn, check_out: r.checkOut,
  phone: r.phone ?? null, notes: r.notes ?? null,
  reservado_por: r.bookedBy ?? null,
})

type Table = 'predios' | 'apartamentos' | 'reservas'
const key: Record<Table, keyof Data> = { predios: 'buildings', apartamentos: 'apartments', reservas: 'reservations' }
const from: Record<Table, (r: never) => Building | Apartment | Reservation> = {
  predios: bFrom as never, apartamentos: aFrom as never, reservas: rFrom as never,
}

// ---------- leitura ----------

export async function fetchAll(): Promise<Data> {
  if (!supabase) return loadLocal()
  const [b, a, r] = await Promise.all([
    supabase.from('predios').select('*'),
    supabase.from('apartamentos').select('*'),
    supabase.from('reservas').select('*'),
  ])
  const err = b.error ?? a.error ?? r.error
  if (err) throw new Error(friendly(err.message))
  return {
    buildings: (b.data as BuildingRow[]).map(bFrom),
    apartments: (a.data as ApartmentRow[]).map(aFrom),
    reservations: (r.data as ReservationRow[]).map(rFrom),
  }
}

// ---------- escrita ----------

async function upsert(table: Table, row: object) {
  if (!supabase) return
  const { error } = await supabase.from(table).upsert(row)
  if (error) throw new Error(friendly(error.message))
}
async function remove(table: Table, id: string) {
  if (!supabase) return
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(friendly(error.message))
}

export const saveBuilding = (b: Building) => upsert('predios', bTo(b))
export const deleteBuilding = (id: string) => remove('predios', id)
export const saveApartment = (a: Apartment) => upsert('apartamentos', aTo(a))
export const deleteApartment = (id: string) => remove('apartamentos', id)
export const saveReservation = (r: Reservation) => upsert('reservas', rTo(r))
export const deleteReservation = (id: string) => remove('reservas', id)

// ---------- tempo real ----------

/** Assina mudanças vindas de outros dispositivos. Retorna função pra cancelar. */
export function subscribe(onChange: (apply: (d: Data) => Data) => void): () => void {
  if (!supabase) return () => {}
  const client = supabase
  const ch = client.channel('alugueis-realtime')
  for (const table of ['predios', 'apartamentos', 'reservas'] as Table[]) {
    ch.on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
      const k = key[table]
      if (payload.eventType === 'DELETE') {
        const id = (payload.old as { id?: string }).id
        onChange(d => ({ ...d, [k]: (d[k] as { id: string }[]).filter(x => x.id !== id) }))
      } else {
        const obj = from[table](payload.new as never)
        onChange(d => {
          const list = d[k] as { id: string }[]
          const i = list.findIndex(x => x.id === obj.id)
          const next = i === -1 ? [...list, obj] : list.map((x, j) => (j === i ? obj : x))
          return { ...d, [k]: next }
        })
      }
    })
  }
  ch.subscribe()
  return () => { client.removeChannel(ch) }
}

function friendly(msg: string) {
  if (msg.includes('reservas_sem_sobreposicao')) return 'Já existe uma reserva nesse apartamento nesse período.'
  if (msg.includes('reservas_apartamento_id_fkey')) return 'Esse apartamento tem reservas. Exclua as reservas antes.'
  if (msg.includes('reservado_por')) return 'Falta rodar a migração 003_reservado_por.sql no Supabase.'
  if (msg.includes('Failed to fetch')) return 'Sem conexão com a internet.'
  return msg
}

// ---------- localStorage (modo demonstração) ----------

export function loadLocal(): Data {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Data) }
  } catch { /* ignora */ }
  const seed = seedData()
  saveLocal(seed)
  return seed
}

export function saveLocal(d: Data) {
  try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignora */ }
}

// Dados de exemplo relativos a hoje, só pra demonstração inicial.
function seedData(): Data {
  const t = todayISO()
  const b1: Building = { id: newId(), name: 'Prédio A', order: 0 }
  const b2: Building = { id: newId(), name: 'Prédio B', order: 1 }
  const apts: Apartment[] = [
    ...['101', '102', '201', '202', '301', '302'].map((n, i) => ({ id: newId(), buildingId: b1.id, name: n, order: i })),
    ...['1', '2', '3', '4', 'Cobertura'].map((n, i) => ({ id: newId(), buildingId: b2.id, name: n, order: i })),
  ]
  const r = (i: number, guest: string, people: number, from: number, len: number, extra: Partial<Reservation> = {}): Reservation => ({
    id: newId(), aptId: apts[i].id, guest, people,
    checkIn: addDaysISO(t, from), checkOut: addDaysISO(t, from + len), ...extra,
  })
  return {
    buildings: [b1, b2],
    apartments: apts,
    reservations: [
      r(0, 'Família Souza', 4, -3, 7, { phone: '(11) 99999-1111', bookedBy: 'Lu' }),
      r(1, 'Carla e Pedro', 2, -1, 3, { bookedBy: 'Pai' }),
      r(1, 'Marcos Lima', 3, 4, 5),
      r(2, 'Turma do Rafael', 6, 1, 4, { notes: 'Chegam de madrugada', bookedBy: 'Mãe' }),
      r(4, 'Dona Helena', 2, -10, 14),
      r(5, 'João Batista', 5, 0, 2),
      r(6, 'Ana Paula', 1, 2, 10),
      r(7, 'Família Oliveira', 4, -2, 5),
      r(7, 'Beatriz', 2, 6, 3),
      r(9, 'Ricardo Alves', 3, 3, 4),
      r(10, 'Casal Ferreira', 2, -5, 9),
    ],
  }
}
