jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
}))

import { playlistReducer, playlistActions, selectSortedAndFilteredPlaylists, selectPlaylistTracks } from '../../../state/playlists'
import { PlaylistsState } from '../../../state/playlists/playlistTypes'

describe('playlist reducer', () => {
    const nowSpy = jest.spyOn(Date, 'now')

    beforeEach(() => {
        nowSpy.mockReturnValue(1_700_000_000_000)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('creates playlist with provided metadata', () => {
        const state = playlistReducer(undefined, playlistActions.createPlaylist({ id: 'p1', name: 'Neon Dreams', color: '#FF00C8', description: 'Glow hour' }))

        expect(state.allIds).toContain('p1')
        expect(state.byId.p1).toMatchObject({
            id: 'p1',
            name: 'Neon Dreams',
            color: '#FF00C8',
            description: 'Glow hour',
            trackIds: [],
        })
        expect(state.selectedId).toBe('p1')
    })

    it('renames playlist and prevents duplicates', () => {
        const initial = playlistReducer(undefined, playlistActions.createPlaylist({ id: 'p1', name: 'Vibes' }))
        const withSecond = playlistReducer(initial, playlistActions.createPlaylist({ id: 'p2', name: 'Sunset' }))
        const result = playlistReducer(withSecond, playlistActions.renamePlaylist({ id: 'p2', name: 'Vibes' }))

        expect(result.byId.p2?.name).toBe('Vibes (2)')
    })

    it('duplicates playlist with tracks', () => {
        const base: PlaylistsState = {
            byId: {
                original: {
                    id: 'original',
                    name: 'Source',
                    description: undefined,
                    color: undefined,
                    emoji: undefined,
                    isPublic: false,
                    trackIds: ['t1', 't2'],
                    createdAt: 100,
                    updatedAt: 100,
                },
            },
            allIds: ['original'],
            selectedId: 'original',
            sortBy: 'recent',
            searchQuery: '',
        }

        const state = playlistReducer(base, playlistActions.duplicatePlaylist({ sourceId: 'original', id: 'copy' }))
        expect(state.byId.copy?.trackIds).toEqual(['t1', 't2'])
        expect(state.byId.copy?.name).toBe('Source (copy)')
        expect(state.selectedId).toBe('copy')
    })

    it('adds and removes tracks', () => {
        const base = playlistReducer(undefined, playlistActions.createPlaylist({ id: 'mix', name: 'Mix' }))
        const added = playlistReducer(base, playlistActions.addTracks({ playlistId: 'mix', trackIds: ['a', 'b'] }))
        const removed = playlistReducer(added, playlistActions.removeTrack({ playlistId: 'mix', trackId: 'a' }))

        expect(removed.byId.mix?.trackIds).toEqual(['b'])
    })

    it('moves track within playlist', () => {
        const start: PlaylistsState = {
            byId: {
                mix: {
                    id: 'mix',
                    name: 'Mix',
                    description: undefined,
                    color: undefined,
                    emoji: undefined,
                    isPublic: false,
                    trackIds: ['a', 'b', 'c'],
                    createdAt: 0,
                    updatedAt: 0,
                },
            },
            allIds: ['mix'],
            selectedId: 'mix',
            sortBy: 'recent',
            searchQuery: '',
        }

        const moved = playlistReducer(start, playlistActions.moveTrack({ playlistId: 'mix', fromIndex: 0, toIndex: 2 }))
        expect(moved.byId.mix?.trackIds).toEqual(['b', 'c', 'a'])
    })

    it('deletes playlist', () => {
        const base = playlistReducer(undefined, playlistActions.createPlaylist({ id: 'mix', name: 'Mix' }))
        const state = playlistReducer(base, playlistActions.deletePlaylist({ id: 'mix' }))
        expect(state.byId.mix).toBeUndefined()
        expect(state.allIds).not.toContain('mix')
    })
})

describe('playlist selectors', () => {
    const buildState = (overrides?: Partial<PlaylistsState>) => ({
        playlists: {
            byId: {
                a: {
                    id: 'a',
                    name: 'Alpha',
                    description: undefined,
                    color: undefined,
                    emoji: undefined,
                    isPublic: false,
                    trackIds: ['1'],
                    createdAt: 1,
                    updatedAt: 100,
                },
                b: {
                    id: 'b',
                    name: 'Bravo',
                    description: undefined,
                    color: undefined,
                    emoji: undefined,
                    isPublic: false,
                    trackIds: ['1', '2', '3'],
                    createdAt: 2,
                    updatedAt: 10,
                },
            },
            allIds: ['a', 'b'],
            selectedId: undefined,
            sortBy: 'recent',
            searchQuery: '',
            ...overrides,
        },
        tracks: [
            { id: '1', title: 'Track one', artist: 'Artist' },
            { id: '2', title: 'Track two', artist: 'Artist' },
            { id: '3', title: 'Track three', artist: 'Artist' },
        ],
    })

    it('sorts playlists by size', () => {
        const state = buildState({ sortBy: 'size' })
        const result = selectSortedAndFilteredPlaylists(state)
        expect(result.map((playlist) => playlist.id)).toEqual(['b', 'a'])
    })

    it('filters playlists by search query (case insensitive)', () => {
        const state = buildState({ searchQuery: 'alp' })
        const result = selectSortedAndFilteredPlaylists(state)
        expect(result).toHaveLength(1)
        expect(result[0]?.id).toBe('a')
    })

    it('selects playlist tracks with metadata', () => {
        const state = buildState()
        const selector = selectPlaylistTracks('b')
        const tracks = selector(state)
        expect(tracks).toHaveLength(3)
        expect(tracks[0]).toMatchObject({ id: '1', title: 'Track one' })
    })
})
