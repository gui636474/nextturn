import { formatDistanceToNow, format, isAfter, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString)
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
  } catch {
    return 'recentemente'
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = parseISO(dateString)
    return format(date, "dd 'de' MMMM, HH:mm", { locale: ptBR })
  } catch {
    return dateString
  }
}

export function formatTime(dateString: string): string {
  try {
    const date = parseISO(dateString)
    return format(date, 'HH:mm')
  } catch {
    return '--:--'
  }
}

export function formatExpiryCountdown(expiresAt: string): { text: string; isExpired: boolean; isImminent: boolean } {
  try {
    const now = new Date()
    const expiry = parseISO(expiresAt)
    
    if (isAfter(now, expiry)) {
      return { text: 'Expirada', isExpired: true, isImminent: false }
    }

    const diffMs = expiry.getTime() - now.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return {
        text: `${hours}h ${minutes}m restantes`,
        isExpired: false,
        isImminent: hours < 2,
      }
    }

    return {
      text: `${minutes}m restantes`,
      isExpired: false,
      isImminent: true,
    }
  } catch {
    return { text: 'Indeterminado', isExpired: false, isImminent: false }
  }
}

export function formatNumberCompact(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50)
}
