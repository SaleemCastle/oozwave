export type RepeatSetting = 'off' | 'queue' | 'track'

export interface QueueItem {
    id: string
    title: string
    artist?: string
    album?: string
    /**
     * Duration in milliseconds.
     */
    duration?: number
    path: string
    artwork?: string
}

export interface PlayerQueueState {
    playlistId?: string
    queue: QueueItem[]
    originalQueue: QueueItem[]
    currentIndex: number
    isShuffle: boolean
    repeatMode: RepeatSetting
    position: number
    isInitialized: boolean
    isRestoring: boolean
    lastUpdatedAt?: number
}

export interface StartPlaylistPayload {
    playlistId: string
    startTrackId?: string
    startPosition?: number
}

export interface QueueInsertPayload {
    trackId: string
    afterCurrent?: boolean
}
