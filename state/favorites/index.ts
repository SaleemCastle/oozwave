import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'

import type { RootState } from '../../Store/store'
import type { ITrack } from '../../Store/Actions/currentTrack.actions'

type FavoritesState = {
  ids: string[]
  isInitialized: boolean
}

const STORAGE_KEY = '@app/favorites:v1'

const initialState: FavoritesState = {
  ids: [],
  isInitialized: false,
}

export const loadFavoritesFromStorage = createAsyncThunk<void, void, { state: RootState }>(
  'favorites/loadFromStorage',
  async (_, { dispatch }) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      const ids = raw ? (JSON.parse(raw) as string[]) : []
      dispatch(setAll(ids))
    } catch (error) {
      // ignore
    } finally {
      dispatch(markInitialized())
    }
  },
)

const persist = createAsyncThunk<void, void, { state: RootState }>(
  'favorites/persist',
  async (_, { getState }) => {
    try {
      const { favorites } = getState()
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.ids))
    } catch (error) {
      // ignore
    }
  },
)

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    markInitialized(state) {
      state.isInitialized = true
    },
    setAll(state, action: PayloadAction<string[]>) {
      // ensure unique and stable order (most recent last)
      const seen = new Set<string>()
      const next: string[] = []
      action.payload.forEach((id) => {
        const key = String(id)
        if (!seen.has(key)) {
          seen.add(key)
          next.push(key)
        }
      })
      state.ids = next
    },
    toggle(state, action: PayloadAction<string>) {
      const id = String(action.payload)
      const idx = state.ids.indexOf(id)
      if (idx >= 0) {
        state.ids.splice(idx, 1)
      } else {
        state.ids.push(id)
      }
    },
    remove(state, action: PayloadAction<string>) {
      const id = String(action.payload)
      const idx = state.ids.indexOf(id)
      if (idx >= 0) state.ids.splice(idx, 1)
    },
    clear(state) {
      state.ids = []
    },
  },
})

export const { toggle: toggleFavorite, remove: removeFavorite, clear: clearFavorites, setAll, markInitialized } = favoritesSlice.actions

export const favoritesReducer = favoritesSlice.reducer

export const persistFavoritesToStorage = persist

// Selectors
export const selectFavoritesState = (state: RootState) => state.favorites
export const selectFavoriteIds = createSelector(selectFavoritesState, (s) => s.ids)
export const selectIsFavoriteById = (id?: string | number | null) => (state: RootState) => {
  if (id === null || id === undefined) return false
  const key = String(id)
  return state.favorites.ids.includes(key)
}

export const selectFavoriteTracks = createSelector(
  (state: RootState) => state.tracks as unknown as ITrack[],
  selectFavoriteIds,
  (tracks, ids) => {
    if (!Array.isArray(tracks) || tracks.length === 0 || ids.length === 0) return []
    const map = new Map<string, ITrack>()
    tracks.forEach((t) => map.set(String(t.id), t))
    // keep order by most recent liked at the end; reverse for recent first
    const ordered = ids
      .map((id) => map.get(String(id)))
      .filter((t): t is ITrack => Boolean(t))
      .slice()
      .reverse()
    return ordered
  },
)

export { favoritesListenerMiddleware } from './listener'
