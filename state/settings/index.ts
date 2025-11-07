import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../Store/store'

export type MiniPlayerPlacement = 'aboveTabBar' | 'mergeWithTabBar' | 'replaceTabBar'
export type MiniPlayerTabSlot = 'currentTab' | 'homeTab'

export type HomeTracksSort = 'mostPlayed' | 'recentlyAdded' | 'favorites' | 'duration'

type SettingsState = {
  isInitialized: boolean
  miniPlayerPlacement: MiniPlayerPlacement
  miniPlayerTabSlot: MiniPlayerTabSlot
  autoplayNext: boolean
  wifiOnlyDownloads: boolean
  audioQuality: 'auto' | 'low' | 'normal' | 'high'
  crossfadeSeconds: number
  gapless: boolean
  haptics: boolean
  showLyrics: boolean
  explicitContentFilter: boolean
  theme: 'system' | 'light' | 'dark'
  normalizeVolume: boolean
  homeTracksSort: HomeTracksSort
}

const STORAGE_KEY = '@app/settings:v1'

const initialState: SettingsState = {
  isInitialized: false,
  miniPlayerPlacement: 'aboveTabBar',
  miniPlayerTabSlot: 'currentTab',
  autoplayNext: true,
  wifiOnlyDownloads: true,
  audioQuality: 'auto',
  crossfadeSeconds: 0,
  gapless: true,
  haptics: true,
  showLyrics: true,
  explicitContentFilter: false,
  theme: 'system',
  normalizeVolume: true,
  homeTracksSort: 'mostPlayed',
}

export const loadSettingsFromStorage = createAsyncThunk<void, void, { state: RootState }>(
  'settings/loadFromStorage',
  async (_, { dispatch }) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        dispatch(hydrate(parsed))
      }
    } catch {
      // ignore
    } finally {
      dispatch(markInitialized())
    }
  },
)

const persist = createAsyncThunk<void, void, { state: RootState }>(
  'settings/persist',
  async (_, { getState }) => {
    try {
      const { settings } = getState()
      // Do not persist internal flags
      const { isInitialized, ...persistable } = settings
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
    } catch {
      // ignore
    }
  },
)

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    markInitialized(state) {
      state.isInitialized = true
    },
    hydrate(state, action: PayloadAction<Partial<SettingsState>>) {
      return { ...state, ...action.payload, isInitialized: true }
    },
    setMiniPlayerPlacement(state, action: PayloadAction<MiniPlayerPlacement>) {
      state.miniPlayerPlacement = action.payload
    },
    setMiniPlayerTabSlot(state, action: PayloadAction<MiniPlayerTabSlot>) {
      state.miniPlayerTabSlot = action.payload
    },
    setAutoplayNext(state, action: PayloadAction<boolean>) {
      state.autoplayNext = action.payload
    },
    setWifiOnlyDownloads(state, action: PayloadAction<boolean>) {
      state.wifiOnlyDownloads = action.payload
    },
    setAudioQuality(state, action: PayloadAction<'auto' | 'low' | 'normal' | 'high'>) {
      state.audioQuality = action.payload
    },
    setCrossfadeSeconds(state, action: PayloadAction<number>) {
      state.crossfadeSeconds = Math.max(0, Math.min(12, Math.round(action.payload)))
    },
    setGapless(state, action: PayloadAction<boolean>) {
      state.gapless = action.payload
    },
    setHaptics(state, action: PayloadAction<boolean>) {
      state.haptics = action.payload
    },
    setShowLyrics(state, action: PayloadAction<boolean>) {
      state.showLyrics = action.payload
    },
    setExplicitContentFilter(state, action: PayloadAction<boolean>) {
      state.explicitContentFilter = action.payload
    },
    setTheme(state, action: PayloadAction<'system' | 'light' | 'dark'>) {
      state.theme = action.payload
    },
    setNormalizeVolume(state, action: PayloadAction<boolean>) {
      state.normalizeVolume = action.payload
    },
    setHomeTracksSort(state, action: PayloadAction<HomeTracksSort>) {
      state.homeTracksSort = action.payload
    },
  },
})

export const {
  markInitialized,
  hydrate,
  setMiniPlayerPlacement,
  setMiniPlayerTabSlot,
  setAutoplayNext,
  setWifiOnlyDownloads,
  setAudioQuality,
  setCrossfadeSeconds,
  setGapless,
  setHaptics,
  setShowLyrics,
  setExplicitContentFilter,
  setTheme,
  setNormalizeVolume,
  setHomeTracksSort,
} = settingsSlice.actions

export const settingsReducer = settingsSlice.reducer
export const persistSettingsToStorage = persist

// selectors
export const selectSettings = (state: RootState) => state.settings
export const selectMiniPlayerPlacement = (state: RootState) => state.settings.miniPlayerPlacement
