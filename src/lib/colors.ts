// Paleta de cores fortes e distinguíveis para as barras de reserva.
// A cor é escolhida pelo nome do hóspede, então o mesmo hóspede sempre tem a mesma cor.
export const PALETTE = [
  { bg: 'bg-sky-500',     text: 'text-white', soft: 'bg-sky-100',     ring: 'ring-sky-500' },
  { bg: 'bg-emerald-500', text: 'text-white', soft: 'bg-emerald-100', ring: 'ring-emerald-500' },
  { bg: 'bg-amber-500',   text: 'text-white', soft: 'bg-amber-100',   ring: 'ring-amber-500' },
  { bg: 'bg-rose-500',    text: 'text-white', soft: 'bg-rose-100',    ring: 'ring-rose-500' },
  { bg: 'bg-violet-500',  text: 'text-white', soft: 'bg-violet-100',  ring: 'ring-violet-500' },
  { bg: 'bg-teal-500',    text: 'text-white', soft: 'bg-teal-100',    ring: 'ring-teal-500' },
  { bg: 'bg-orange-500',  text: 'text-white', soft: 'bg-orange-100',  ring: 'ring-orange-500' },
  { bg: 'bg-fuchsia-500', text: 'text-white', soft: 'bg-fuchsia-100', ring: 'ring-fuchsia-500' },
  { bg: 'bg-indigo-500',  text: 'text-white', soft: 'bg-indigo-100',  ring: 'ring-indigo-500' },
  { bg: 'bg-lime-600',    text: 'text-white', soft: 'bg-lime-100',    ring: 'ring-lime-600' },
]

export function colorFor(key: string) {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}
