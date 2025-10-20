export interface TrackRef {
    id: string
    title: string
    artist?: string
    duration?: number
    artworkUrl?: string
}

export interface Playlist {
    id: string
    name: string
    description?: string
    color?: string
    emoji?: string
    isPublic: boolean
    trackIds: string[]
    createdAt: number
    updatedAt: number
}

export type SortBy = 'recent' | 'name' | 'size'

export interface PlaylistsState {
    byId: Record<string, Playlist>
    allIds: string[]
    selectedId?: string
    sortBy: SortBy
    searchQuery: string
}
