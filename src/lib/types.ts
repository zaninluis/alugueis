export type Building = {
  id: string
  name: string
  order: number
}

export type Apartment = {
  id: string
  buildingId: string
  name: string       // ex: "101", "Cobertura", "Fundos"
  order: number
}

export type Reservation = {
  id: string
  aptId: string
  guest: string
  people: number
  checkIn: string      // 'yyyy-MM-dd'
  checkOut: string     // 'yyyy-MM-dd' (dia da saída, exclusivo)
  phone?: string
  notes?: string
  bookedBy?: string   // quem fez a reserva (Lu, Pai, Mãe...)
}

export type Data = {
  buildings: Building[]
  apartments: Apartment[]
  reservations: Reservation[]
}

export const EMPTY: Data = { buildings: [], apartments: [], reservations: [] }

const byOrder = <T extends { order: number; name: string }>(a: T, b: T) =>
  a.order - b.order || a.name.localeCompare(b.name, 'pt-BR', { numeric: true })

export const sortedBuildings = (d: Data) => [...d.buildings].sort(byOrder)
export const apartmentsOf = (d: Data, buildingId: string) =>
  d.apartments.filter(a => a.buildingId === buildingId).sort(byOrder)

/** lista plana de apartamentos na ordem de exibição (prédio > apto) */
export const allApartments = (d: Data) =>
  sortedBuildings(d).flatMap(b => apartmentsOf(d, b.id))

export const buildingOf = (d: Data, apt: Apartment) =>
  d.buildings.find(b => b.id === apt.buildingId)

export const aptFullLabel = (d: Data, aptId: string) => {
  const apt = d.apartments.find(a => a.id === aptId)
  if (!apt) return '?'
  const b = buildingOf(d, apt)
  return b ? `${b.name} · ${apt.name}` : apt.name
}
