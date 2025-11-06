import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncThunk, createListenerMiddleware } from '@reduxjs/toolkit'

import { ADD_TRACKS } from '../../Store/ReduxConstants'
import type { RootState } from '../../Store/store'
import type { ITrack } from '../../Store/Actions/currentTrack.actions'
import { addTracks } from '../../Store/Actions/tracks.actions'

const STORAGE_KEY_TRACKS = '@app/tracks:v1'

// Narrow state type for thunks/middleware that only need tracks
type RootWithTracks = { tracks: ITrack[] }

export const loadTracksFromStorage = createAsyncThunk<void, void, { state: RootState }>(
  'tracks/loadFromStorage',
  async (_, { dispatch }) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_TRACKS)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const sanitized: ITrack[] = parsed
          .filter((t) => t && typeof t === 'object')
          .map((t: any) => ({
            album: String(t.album ?? ''),
            artist: String(t.artist ?? ''),
            cover: typeof t.cover === 'string' ? t.cover : undefined,
            duration: Number(t.duration ?? 0),
            id: Number(t.id ?? 0),
            path: String(t.path ?? ''),
            title: String(t.title ?? ''),
          }))
        if (sanitized.length > 0) {
          // Prime vendor cover cache so CoverImage can render on cold start
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const MusicFiles: any = require('../../vendor/react-native-get-music-files-v3dev-test')
            if (typeof MusicFiles?.primeCoverCache === 'function') {
              MusicFiles.primeCoverCache(sanitized)
            }
          } catch {}
          dispatch(addTracks(sanitized))
        }
      }
    } catch {
      // ignore
    }
  },
)

export const persistTracksToStorage = createAsyncThunk<void, void, { state: RootWithTracks }>(
  'tracks/persistToStorage',
  async (_, { getState }) => {
    try {
      const state = getState()
      const tracks = (state.tracks as unknown as ITrack[]) ?? []
      // Also prime the vendor cache each time tracks update
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const MusicFiles: any = require('../../vendor/react-native-get-music-files-v3dev-test')
        if (typeof MusicFiles?.primeCoverCache === 'function') {
          MusicFiles.primeCoverCache(tracks)
        }
      } catch {}
      // Persist a slimmed array to avoid AsyncStorage size limits (omit base64 covers)
      const slim = tracks.map((t) => ({
        id: t.id,
        path: t.path,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
      }))
      await AsyncStorage.setItem(STORAGE_KEY_TRACKS, JSON.stringify(slim))
    } catch {
      // ignore
    }
  },
)

// (moved above)

export const tracksListenerMiddleware = createListenerMiddleware<RootWithTracks>()

tracksListenerMiddleware.startListening({
  predicate: (action) => action?.type === ADD_TRACKS,
  effect: async (action, api) => {
    try {
      const payload = (action as any)?.payload
      if (Array.isArray(payload)) {
        // Prime cache immediately with new covers
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const MusicFiles: any = require('../../vendor/react-native-get-music-files-v3dev-test')
        if (typeof MusicFiles?.primeCoverCache === 'function') {
          MusicFiles.primeCoverCache(payload)
        }
      }
    } catch {}
    await api.dispatch(persistTracksToStorage())
  },
})

export default tracksListenerMiddleware
