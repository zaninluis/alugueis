import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const toISO = (d: Date) => format(d, 'yyyy-MM-dd')
export const fromISO = (s: string) => startOfDay(parseISO(s))
export const today = () => startOfDay(new Date())
export const todayISO = () => toISO(today())

export const fmtShort = (s: string) => format(fromISO(s), 'dd/MM', { locale: ptBR })
export const fmtLong = (s: string) => format(fromISO(s), "EEE, d 'de' MMM", { locale: ptBR })
export const fmtDayNum = (d: Date) => format(d, 'd')
export const fmtWeekday = (d: Date) => format(d, 'EEEEE', { locale: ptBR }).toUpperCase()
export const fmtMonthYear = (d: Date) => format(d, 'MMMM yyyy', { locale: ptBR })

export const nights = (checkIn: string, checkOut: string) =>
  differenceInCalendarDays(fromISO(checkOut), fromISO(checkIn))

export const daysUntil = (s: string) => differenceInCalendarDays(fromISO(s), today())

export const addDaysISO = (s: string, n: number) => toISO(addDays(fromISO(s), n))

/** verdadeiro se o dia `day` está dentro de [checkIn, checkOut) */
export const covers = (checkIn: string, checkOut: string, day: string) =>
  checkIn <= day && day < checkOut

/** dois períodos [a1,a2) e [b1,b2) se sobrepõem? */
export const overlaps = (a1: string, a2: string, b1: string, b2: string) =>
  a1 < b2 && b1 < a2
