import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

import type { RootState } from '../../Store/store'

type PlaysState = {
  counts: Record<string, number>
  isInitialized: boolean
}

const STORAGE_KEY = '@app/playCounts:v1'

const initialState: PlaysState = {
  counts: {},
  isInitialized: false,
}

export const loadPlayCountsFromStorage = createAsyncThunk<void, void, { state: RootState }>(
  'plays/load',
  async (_, { dispatch }) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {}
      dispatch(hydrate(parsed))
    } catch {
      // ignore
    } finally {
      dispatch(markInitialized())
    }
  },
)

export const persistPlayCountsToStorage = createAsyncThunk<void, void, { state: RootState }>(
  'plays/persist',
  async (_, { getState }) => {
    try {
      const { plays } = getState()
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plays.counts))
    } catch {
      // ignore
    }
  },
)

const playsSlice = createSlice({
  name: 'plays',
  initialState,
  reducers: {
    markInitialized(state) {
      state.isInitialized = true
    },
    hydrate(state, action: PayloadAction<Record<string, number>>) {
      state.counts = { ...state.counts, ...action.payload }
    },
    increment(state, action: PayloadAction<string | number>) {
      const key = String(action.payload)
      state.counts[key] = (state.counts[key] || 0) + 1
    },
  },
})

export const { markInitialized, hydrate, increment } = playsSlice.actions

export const playsReducer = playsSlice.reducer

// selectors
export const selectPlayCounts = (state: RootState) => state.plays.counts

