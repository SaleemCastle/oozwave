import { Track } from 'react-native-track-player'

import { ITrack } from '../../Store/Actions/currentTrack.actions'
import { QueueItem } from './playerQueueTypes'

export const normalizeTrackId = (id: string | number | null | undefined): string | null => {
    if (id === null || id === undefined) {
        return null
    }
    const str = String(id).trim()
    return str.length > 0 ? str : null
}

export const ensureFileUrl = (path: string): string => {
    if (!path) {
        return ''
    }
    if (path.startsWith('file://')) {
        return path
    }
    const sanitized = path.replace(/^file:\/\//, '')
    return `file://${sanitized}`
}

export const trackToQueueItem = (track: ITrack | undefined | null): QueueItem | null => {
    if (!track) {
        return null
    }
    const id = normalizeTrackId(track.id)
    if (!id) {
        return null
    }
    const path = track.path?.trim()
    if (!path) {
        return null
    }
    return {
        id,
        title: track.title ?? 'Unknown track',
        artist: track.artist ?? undefined,
        album: track.album ?? undefined,
        duration: typeof track.duration === 'number' ? track.duration : undefined,
        path,
        artwork: (track as any).cover ?? undefined,
    }
}

export const queueItemToTrackPlayer = (item: QueueItem): Track => ({
    id: item.id,
    url: ensureFileUrl(item.path),
    title: item.title,
    artist: item.artist,
    album: item.album,
    duration: item.duration ? item.duration / 1000 : undefined,
    artwork: item.artwork,
})

export const buildQueueFromTrackIds = (trackIds: string[], libraryTracks: ITrack[]): QueueItem[] => {
    const map = new Map<string, ITrack>()
    libraryTracks.forEach((track) => {
        const id = normalizeTrackId(track.id)
        if (id) {
            map.set(id, track)
        }
    })
    return trackIds
        .map((id) => {
            const track = map.get(id)
            return trackToQueueItem(track)
        })
        .filter((item): item is QueueItem => Boolean(item))
}

export const refreshQueueWithLibrary = (queue: QueueItem[], libraryTracks: ITrack[]): QueueItem[] => {
    if (!Array.isArray(queue) || queue.length === 0) {
        return []
    }
    const map = new Map<string, ITrack>()
    libraryTracks.forEach((track) => {
        const id = normalizeTrackId(track.id)
        if (id) {
            map.set(id, track)
        }
    })
    return queue
        .map((item) => {
            const match = map.get(item.id)
            if (!match) {
                return item
            }
            return trackToQueueItem(match) ?? item
        })
        .filter((item): item is QueueItem => Boolean(item))
}

export const queueItemToITrack = (item: QueueItem): ITrack => {
    const numericId = Number(item.id)
    return {
        id: Number.isNaN(numericId) ? 0 : numericId,
        title: item.title,
        artist: item.artist ?? '',
        album: item.album ?? '',
        duration: item.duration ?? 0,
        path: item.path,
        cover: item.artwork,
    }
}
