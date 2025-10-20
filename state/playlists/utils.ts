import uuid from 'react-native-uuid'

export const generateId = () => String(uuid.v4())

export const formatRelativeUpdatedAt = (timestamp: number, now: number = Date.now()): string => {
    const diff = Math.max(0, now - timestamp)
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) {
        return 'Updated just now'
    }
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
        return `Updated ${minutes}m ago`
    }
    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
        return `Updated ${hours}h ago`
    }
    const days = Math.floor(hours / 24)
    if (days < 7) {
        return `Updated ${days}d ago`
    }
    const weeks = Math.floor(days / 7)
    if (weeks < 4) {
        return `Updated ${weeks}w ago`
    }
    const months = Math.floor(days / 30)
    if (months < 12) {
        return `Updated ${months}mo ago`
    }
    const years = Math.floor(days / 365)
    return `Updated ${years}y ago`
}

export const isNonEmpty = (value: string | undefined | null): value is string => !!value && value.trim().length > 0

