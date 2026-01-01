import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Playlist, PlaylistsState, SortBy, TrackRef } from './playlistTypes'
import { generateId } from './utils'

export const STORAGE_KEY_PLAYLISTS = '@app/playlists:v1'
const DEFAULT_NAME = 'New Playlist'

const initialState: PlaylistsState = {
    byId: {},
    allIds: [],
    selectedId: undefined,
    sortBy: 'recent',
    searchQuery: '',
}

type WithPlaylistsState = {
    playlists: PlaylistsState
    tracks?: Array<{
        id: string | number
        title: string
        artist?: string
        duration?: number
        cover?: string
        artworkUrl?: string
    }>
}

const collectExistingNames = (state: PlaylistsState, excludeId?: string) => {
    const names = new Set<string>()
    state.allIds.forEach((id) => {
        if (excludeId && id === excludeId) {
            return
        }
        const playlist = state.byId[id]
        if (playlist) {
            names.add(playlist.name.trim().toLowerCase())
        }
    })
    return names
}

const makeUniqueName = (
    state: PlaylistsState,
    desiredName: string,
    options: { suffix?: string; excludeId?: string; fallback?: string } = {},
) => {
    const { suffix = '', excludeId, fallback = DEFAULT_NAME } = options
    const trimmed = desiredName.trim()
    const base = trimmed.length > 0 ? trimmed : fallback
    const candidates = collectExistingNames(state, excludeId)

    if (!suffix && !candidates.has(base.toLowerCase())) {
        return base
    }

    const initial = suffix ? `${base}${suffix}` : base
    if (!candidates.has(initial.toLowerCase())) {
        return initial
    }

    let counter = 2
    while (counter < 1000) {
        const candidate = suffix
            ? `${base}${suffix} ${counter}`
            : `${base} (${counter})`
        if (!candidates.has(candidate.toLowerCase())) {
            return candidate
        }
        counter += 1
    }

    return `${base}-${generateId().slice(0, 6)}`
}

const normalizeTrackIds = (trackIds: string[] | undefined | null) =>
    Array.isArray(trackIds) ? trackIds.filter((id) => typeof id === 'string') : []

const normalizePlaylist = (raw: Partial<Playlist> | undefined | null): Playlist | null => {
    if (!raw || typeof raw !== 'object') {
        return null
    }

    const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : generateId()
    const name = typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim() : DEFAULT_NAME
    const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : Date.now()
    const updatedAt = typeof raw.updatedAt === 'number' ? raw.updatedAt : createdAt

    return {
        id,
        name,
        description: typeof raw.description === 'string' ? raw.description : undefined,
        color: typeof raw.color === 'string' ? raw.color : undefined,
        emoji: typeof raw.emoji === 'string' ? raw.emoji : undefined,
        isPublic: typeof raw.isPublic === 'boolean' ? raw.isPublic : false,
        coverRes: typeof (raw as any).coverRes === 'number' ? (raw as any).coverRes : undefined,
        trackIds: normalizeTrackIds(raw.trackIds),
        createdAt,
        updatedAt,
    }
}

export const loadPlaylistsFromStorage = createAsyncThunk<PlaylistsState | undefined>(
    'playlists/loadFromStorage',
    async (_, { rejectWithValue }) => {
        try {
            const storedValue = await AsyncStorage.getItem(STORAGE_KEY_PLAYLISTS)
            if (!storedValue) {
                return undefined
            }
            const parsed = JSON.parse(storedValue)
            if (!parsed || typeof parsed !== 'object') {
                return undefined
            }

            const nextState: PlaylistsState = {
                byId: {},
                allIds: [],
                selectedId: undefined,
                sortBy: 'recent',
                searchQuery: '',
            }

            const source = parsed as Partial<PlaylistsState>
            nextState.sortBy = source.sortBy === 'name' || source.sortBy === 'size' ? source.sortBy : 'recent'
            nextState.searchQuery = typeof source.searchQuery === 'string' ? source.searchQuery : ''
            if (typeof source.selectedId === 'string') {
                nextState.selectedId = source.selectedId
            }

            const incoming = source.allIds?.filter((id): id is string => typeof id === 'string') ?? []
            incoming.forEach((id) => {
                const rawPlaylist = source.byId?.[id]
                const playlist = normalizePlaylist(rawPlaylist)
                if (playlist) {
                    nextState.byId[playlist.id] = playlist
                    nextState.allIds.push(playlist.id)
                }
            })

            return nextState
        } catch (error) {
            return rejectWithValue((error as Error).message)
        }
    },
)

export const persistPlaylistsToStorage = createAsyncThunk<void, void, { state: WithPlaylistsState }>(
    'playlists/persistToStorage',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { playlists } = getState()
            const payload = JSON.stringify(playlists)
            await AsyncStorage.setItem(STORAGE_KEY_PLAYLISTS, payload)
        } catch (error) {
            return rejectWithValue((error as Error).message)
        }
    },
)

type ImportResult = {
    playlists: Playlist[]
}

export const importPlaylistsFromJson = createAsyncThunk<ImportResult, string, { state: WithPlaylistsState }>(
    'playlists/importFromJson',
    async (jsonString, { getState, rejectWithValue }) => {
        try {
            const parsed = JSON.parse(jsonString)
            const payload = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed?.playlists)
                    ? parsed.playlists
                    : []

            if (!Array.isArray(payload) || payload.length === 0) {
                return { playlists: [] }
            }

            const state = getState().playlists
            const usedNames = collectExistingNames(state)
            const imported: Playlist[] = []

            payload.forEach((entry) => {
                const normalized = normalizePlaylist(entry)
                if (!normalized) {
                    return
                }
                const baseName = normalized.name.trim() || DEFAULT_NAME
                let finalName = baseName
                const baseKey = baseName.toLowerCase()
                if (usedNames.has(baseKey)) {
                    let attempt = 0
                    while (attempt < 1000) {
                        const suffix = attempt === 0 ? ' (imported)' : ` (imported ${attempt + 1})`
                        const candidate = `${baseName}${suffix}`
                        const key = candidate.toLowerCase()
                        if (!usedNames.has(key)) {
                            finalName = candidate
                            break
                        }
                        attempt += 1
                    }
                    if (attempt >= 1000) {
                        finalName = `${baseName}-${generateId().slice(0, 6)}`
                    }
                }
                usedNames.add(finalName.toLowerCase())
                const now = Date.now()
                const playlist: Playlist = {
                    ...normalized,
                    id: generateId(),
                    name: finalName,
                    createdAt: now,
                    updatedAt: now,
                }
                imported.push(playlist)
            })

            return { playlists: imported }
        } catch (error) {
            return rejectWithValue((error as Error).message)
        }
    },
)

export const exportPlaylistsToJson = createAsyncThunk<string, void, { state: WithPlaylistsState }>(
    'playlists/exportToJson',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { playlists } = getState()
            const payload = playlists.allIds.map((id) => playlists.byId[id]).filter(Boolean)
            return JSON.stringify(payload, null, 2)
        } catch (error) {
            return rejectWithValue((error as Error).message)
        }
    },
)

const slice = createSlice({
    name: 'playlists',
    initialState,
    reducers: {
        createPlaylist: (state, action: PayloadAction<{ id?: string; name: string; description?: string; color?: string; emoji?: string; isPublic?: boolean; coverRes?: number }>) => {
            const now = Date.now()
            const id = action.payload.id ?? generateId()
            const name = makeUniqueName(state, action.payload.name, {})
            const playlist: Playlist = {
                id,
                name,
                description: action.payload.description?.trim() || undefined,
                color: action.payload.color,
                emoji: action.payload.emoji,
                isPublic: action.payload.isPublic ?? false,
                coverRes: action.payload.coverRes,
                trackIds: [],
                createdAt: now,
                updatedAt: now,
            }
            state.byId[id] = playlist
            state.allIds.unshift(id)
            state.selectedId = id
        },
        duplicatePlaylist: (state, action: PayloadAction<{ sourceId: string; name?: string; id?: string }>) => {
            const source = state.byId[action.payload.sourceId]
            if (!source) {
                return
            }
            const now = Date.now()
            const id = action.payload.id ?? generateId()
            const desiredName = action.payload.name ?? source.name
            const suffix = action.payload.name ? '' : ' (copy)'
            const name = makeUniqueName(state, desiredName, { suffix })
            const playlist: Playlist = {
                ...source,
                id,
                name,
                trackIds: [...source.trackIds],
                createdAt: now,
                updatedAt: now,
            }
            state.byId[id] = playlist
            state.allIds.unshift(id)
            state.selectedId = id
        },
        renamePlaylist: (state, action: PayloadAction<{ id: string; name: string }>) => {
            const playlist = state.byId[action.payload.id]
            if (!playlist) {
                return
            }
            const name = makeUniqueName(state, action.payload.name, { excludeId: playlist.id })
            playlist.name = name
            playlist.updatedAt = Date.now()
        },
        updatePlaylistMeta: (
            state,
            action: PayloadAction<{ id: string; description?: string; color?: string; emoji?: string; isPublic?: boolean; coverRes?: number }>,
        ) => {
            const playlist = state.byId[action.payload.id]
            if (!playlist) {
                return
            }
            if (typeof action.payload.description !== 'undefined') {
                const trimmed = action.payload.description?.trim() ?? ''
                playlist.description = trimmed.length ? trimmed : undefined
            }
            if (typeof action.payload.color !== 'undefined') {
                const color = action.payload.color?.trim() ?? ''
                playlist.color = color.length ? color : undefined
            }
            if (typeof action.payload.emoji !== 'undefined') {
                const emoji = action.payload.emoji?.trim() ?? ''
                playlist.emoji = emoji.length ? emoji : undefined
            }
            if (typeof action.payload.isPublic !== 'undefined') {
                playlist.isPublic = action.payload.isPublic
            }
            if (typeof action.payload.coverRes !== 'undefined') {
                playlist.coverRes = action.payload.coverRes
            }
            playlist.updatedAt = Date.now()
        },
        deletePlaylist: (state, action: PayloadAction<{ id: string }>) => {
            if (!state.byId[action.payload.id]) {
                return
            }
            delete state.byId[action.payload.id]
            state.allIds = state.allIds.filter((id) => id !== action.payload.id)
            if (state.selectedId === action.payload.id) {
                state.selectedId = state.allIds[0]
            }
        },
        addTrack: (state, action: PayloadAction<{ playlistId: string; trackId: string }>) => {
            const playlist = state.byId[action.payload.playlistId]
            if (!playlist) {
                return
            }
            playlist.trackIds.push(action.payload.trackId)
            playlist.updatedAt = Date.now()
        },
        addTracks: (state, action: PayloadAction<{ playlistId: string; trackIds: string[] }>) => {
            const playlist = state.byId[action.payload.playlistId]
            if (!playlist || !Array.isArray(action.payload.trackIds)) {
                return
            }
            playlist.trackIds.push(...action.payload.trackIds)
            playlist.updatedAt = Date.now()
        },
        removeTrack: (state, action: PayloadAction<{ playlistId: string; trackId: string }>) => {
            const playlist = state.byId[action.payload.playlistId]
            if (!playlist) {
                return
            }
            const index = playlist.trackIds.findIndex((id) => id === action.payload.trackId)
            if (index === -1) {
                return
            }
            playlist.trackIds.splice(index, 1)
            playlist.updatedAt = Date.now()
        },
        moveTrack: (state, action: PayloadAction<{ playlistId: string; fromIndex: number; toIndex: number }>) => {
            const playlist = state.byId[action.payload.playlistId]
            if (!playlist) {
                return
            }
            const { fromIndex, toIndex } = action.payload
            if (fromIndex === toIndex) {
                return
            }
            const trackIds = playlist.trackIds
            if (
                fromIndex < 0 ||
                fromIndex >= trackIds.length ||
                toIndex < 0 ||
                toIndex >= trackIds.length
            ) {
                return
            }
            const [moved] = trackIds.splice(fromIndex, 1)
            trackIds.splice(toIndex, 0, moved)
            playlist.updatedAt = Date.now()
        },
        setSelectedPlaylist: (state, action: PayloadAction<{ id?: string }>) => {
            if (!action.payload.id) {
                state.selectedId = undefined
                return
            }
            if (state.byId[action.payload.id]) {
                state.selectedId = action.payload.id
            }
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload
        },
        setSortBy: (state, action: PayloadAction<SortBy>) => {
            state.sortBy = action.payload
        },
        restoreState: (state, action: PayloadAction<PlaylistsState>) => {
            state.byId = action.payload.byId
            state.allIds = action.payload.allIds
            state.selectedId = action.payload.selectedId
            state.sortBy = action.payload.sortBy
            state.searchQuery = action.payload.searchQuery
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadPlaylistsFromStorage.fulfilled, (state, action) => {
            if (action.payload) {
                state.byId = action.payload.byId
                state.allIds = action.payload.allIds
                state.selectedId = action.payload.selectedId
                state.sortBy = action.payload.sortBy
                state.searchQuery = action.payload.searchQuery
            }
        })
        builder.addCase(importPlaylistsFromJson.fulfilled, (state, action) => {
            if (!action.payload.playlists.length) {
                return
            }
            action.payload.playlists.forEach((playlist) => {
                state.byId[playlist.id] = playlist
                state.allIds.unshift(playlist.id)
            })
            state.selectedId = action.payload.playlists[0]?.id ?? state.selectedId
        })
    },
})

export const playlistReducer = slice.reducer
export const playlistActions = slice.actions

const selectFeature = (state: WithPlaylistsState) => state.playlists

export const selectAllPlaylists = createSelector(selectFeature, (playlists) =>
    playlists.allIds
        .map((id) => playlists.byId[id])
        .filter((playlist): playlist is Playlist => Boolean(playlist)),
)

export const selectPlaylistById = (id: string) =>
    createSelector(selectFeature, (playlists) => playlists.byId[id])

const selectSearchQuery = createSelector(selectFeature, (playlists) => playlists.searchQuery.trim().toLowerCase())
const selectSortMode = createSelector(selectFeature, (playlists) => playlists.sortBy)

const sorters: Record<SortBy, (a: Playlist, b: Playlist) => number> = {
    recent: (a, b) => b.updatedAt - a.updatedAt,
    name: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    size: (a, b) => b.trackIds.length - a.trackIds.length,
}

// Smart playlist: Most Played (derived from state.plays.counts)
const selectPlayCounts = (state: any) => {
    try { return (state?.plays?.counts) || {} } catch { return {} }
}

export const selectSortedAndFilteredPlaylists = createSelector(
    selectAllPlaylists,
    selectSearchQuery,
    selectSortMode,
    selectPlayCounts,
    (playlists, query, sortBy, counts) => {
        const filtered = query.length
            ? playlists.filter((playlist) => playlist.name.toLowerCase().includes(query))
            : playlists
        const sorter = sorters[sortBy]
        const base = [...filtered].sort(sorter)

        // Build synthetic "Most Played" only when not searching and there are counts
        if (!query.length && counts && typeof counts === 'object') {
            const topIds = Object.keys(counts)
                .filter((k) => Number.isFinite(Number(counts[k])))
                .sort((a, b) => (counts[b] - counts[a]))
                .slice(0, 200)
            if (topIds.length > 0) {
                const now = Date.now()
                const smart: Playlist = {
                    id: '__smart_most_played__',
                    name: 'Most Played',
                    description: 'Your top tracks by play count',
                    color: undefined,
                    emoji: '🔥',
                    isPublic: false,
                    trackIds: topIds,
                    createdAt: now,
                    updatedAt: now,
                }
                return [smart, ...base]
            }
        }
        return base
    },
)

export const selectPublicPlaylists = createSelector(selectAllPlaylists, (all) => all.filter((p) => p.isPublic))

export const selectSelectedPlaylist = createSelector(selectFeature, (playlists) => {
    const id = playlists.selectedId
    return id ? playlists.byId[id] : undefined
})

export const selectPlaylistTracks = (playlistId: string) =>
    createSelector(selectFeature, (state: WithPlaylistsState) => state.tracks ?? [], (playlists, tracksSource) => {
        const playlist = playlists.byId[playlistId]
        if (!playlist) {
            return []
        }
        const trackMap = new Map<string, TrackRef>()
        tracksSource.forEach((track) => {
            const id = String(track.id)
            trackMap.set(id, {
                id,
                title: track.title,
                artist: track.artist,
                duration: typeof track.duration === 'number' ? track.duration : undefined,
                artworkUrl: (track as any).artworkUrl ?? (track as any).cover,
            })
        })
        return playlist.trackIds.map((id) => trackMap.get(id) ?? { id, title: 'Unknown track' })
    })

export type { Playlist, PlaylistsState, SortBy, TrackRef }









