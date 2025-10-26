import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncThunk, createListenerMiddleware, createSlice, PayloadAction } from '@reduxjs/toolkit'
import equalizerService from '../../audio/equalizer/equalizerService'
import type { EQPresetName } from '../../audio/equalizer/EqualizerNative'
import { EQ_PRESETS } from './eqPresets'
import type { DeviceProfile, EQState } from './eqTypes'

export type RootStateLike = { equalizer: EQState }

const STORAGE_KEY_LAST = '@eq:lastPreset'
const keyForProfile = (p: DeviceProfile) => `@eq:v1:${p}`

const initialState: EQState = {
  bypass: true,
  preamp: 0,
  bands: Array(10).fill(0),
  preset: 'Flat',
  deviceProfile: 'speakers',
  available: true,
  bassBoost: 0,
}

export const initEqualizerThunk = createAsyncThunk<boolean, number | undefined, { state: RootStateLike }>(
  'equalizer/init',
  async (sessionId, { dispatch }) => {
    try {
      const ok = await equalizerService.init(sessionId)
      dispatch(eqSlice.actions.setAvailable(ok))
      const lastPreset = (await AsyncStorage.getItem(STORAGE_KEY_LAST)) as EQPresetName | null
      if (lastPreset && EQ_PRESETS[lastPreset]) {
        const p = EQ_PRESETS[lastPreset]
        dispatch(eqSlice.actions.setAll({ bands: p.bands.slice(), preamp: p.preamp, bypass: false, preset: lastPreset }))
      }
      const profile: DeviceProfile = 'speakers'
      const raw = await AsyncStorage.getItem(keyForProfile(profile))
      if (raw) {
        const parsed = JSON.parse(raw)
        dispatch(eqSlice.actions.setAll({
          bands: Array.isArray(parsed?.bands) ? parsed.bands : initialState.bands,
          preamp: typeof parsed?.preamp === 'number' ? parsed.preamp : 0,
          bypass: typeof parsed?.bypass === 'boolean' ? parsed.bypass : true,
          preset: (parsed?.preset as EQPresetName) || 'Flat',
        }))
      }
      return ok
    } catch {
      dispatch(eqSlice.actions.setAvailable(false))
      return false
    }
  },
)

export const applyBandThunk = createAsyncThunk<void, { index: number; gainDb: number }, { state: RootStateLike }>(
  'equalizer/applyBand',
  async ({ index, gainDb }) => {
    await equalizerService.applyBand(index, gainDb)
  },
)

export const applyPreampThunk = createAsyncThunk<void, number, { state: RootStateLike }>(
  'equalizer/applyPreamp',
  async (gainDb) => {
    await equalizerService.applyPreamp(gainDb)
  },
)

export const applyBypassThunk = createAsyncThunk<void, boolean, { state: RootStateLike }>(
  'equalizer/applyBypass',
  async (enabled) => {
    await equalizerService.applyBypass(enabled)
  },
)

export const applyPresetThunk = createAsyncThunk<void, EQPresetName, { state: RootStateLike }>(
  'equalizer/applyPreset',
  async (name, { dispatch }) => {
    const preset = EQ_PRESETS[name]
    if (!preset) return
    await equalizerService.syncAll(preset.bands, preset.preamp, false)
    await AsyncStorage.setItem(STORAGE_KEY_LAST, name)
    dispatch(eqSlice.actions.setAll({ bands: preset.bands.slice(), preamp: preset.preamp, bypass: false, preset: name }))
  },
)

export const loadEQFromStorageThunk = createAsyncThunk<void, DeviceProfile>(
  'equalizer/loadProfile',
  async (profile, { dispatch }) => {
    const raw = await AsyncStorage.getItem(keyForProfile(profile))
    if (!raw) return
    const parsed = JSON.parse(raw)
    dispatch(eqSlice.actions.setAll({
      bands: Array.isArray(parsed?.bands) ? parsed.bands : initialState.bands,
      preamp: typeof parsed?.preamp === 'number' ? parsed.preamp : 0,
      bypass: typeof parsed?.bypass === 'boolean' ? parsed.bypass : true,
      preset: (parsed?.preset as EQPresetName) || 'Flat',
    }))
  },
)

export const persistEQToStorageThunk = createAsyncThunk<void, void, { state: RootStateLike }>(
  'equalizer/persist',
  async (_, { getState }) => {
    const eq = getState().equalizer
    const payload = { bands: eq.bands, preamp: eq.preamp, bypass: eq.bypass, preset: eq.preset, bassBoost: eq.bassBoost ?? 0 }
    await AsyncStorage.setItem(keyForProfile(eq.deviceProfile), JSON.stringify(payload))
  },
)

export const handleRouteChangeThunk = createAsyncThunk<void, DeviceProfile, { state: RootStateLike }>(
  'equalizer/routeChange',
  async (profile, { dispatch, getState }) => {
    dispatch(eqSlice.actions.setDeviceProfile(profile))
    await dispatch(loadEQFromStorageThunk(profile))
    const state = getState().equalizer
    await equalizerService.syncAll(state.bands, state.preamp, state.bypass)
  },
)

export const eqSlice = createSlice({
  name: 'equalizer',
  initialState,
  reducers: {
    setBypass(state, action: PayloadAction<boolean>) {
      state.bypass = action.payload
      state.lastAppliedAt = Date.now()
    },
    setPreamp(state, action: PayloadAction<number>) {
      state.preamp = action.payload
      state.lastAppliedAt = Date.now()
    },
    setBand(state, action: PayloadAction<{ index: number; gainDb: number }>) {
      const { index, gainDb } = action.payload
      if (index >= 0 && index < state.bands.length) state.bands[index] = gainDb
      state.lastAppliedAt = Date.now()
    },
    setPreset(state, action: PayloadAction<{ name: EQPresetName; gains: number[]; preamp?: number }>) {
      state.preset = action.payload.name
      if (Array.isArray(action.payload.gains) && action.payload.gains.length === 10) {
        state.bands = action.payload.gains.slice()
      }
      if (typeof action.payload.preamp === 'number') state.preamp = action.payload.preamp
      state.bypass = false
      state.lastAppliedAt = Date.now()
    },
    setDeviceProfile(state, action: PayloadAction<DeviceProfile>) {
      state.deviceProfile = action.payload
    },
    setBassBoost(state, action: PayloadAction<number>) {
      state.bassBoost = action.payload
      state.lastAppliedAt = Date.now()
    },
    setAvailable(state, action: PayloadAction<boolean>) {
      state.available = action.payload
    },
    setAll(state, action: PayloadAction<{ bands: number[]; preamp: number; bypass: boolean; preset: EQPresetName; bassBoost?: number }>) {
      state.bands = action.payload.bands.slice()
      state.preamp = action.payload.preamp
      state.bypass = action.payload.bypass
      state.preset = action.payload.preset
      if (typeof action.payload.bassBoost === 'number') state.bassBoost = action.payload.bassBoost
    },
  },
})

export const equalizerReducer = eqSlice.reducer
export const equalizerActions = eqSlice.actions

export const equalizerListenerMiddleware = createListenerMiddleware<{ equalizer: EQState }>()

equalizerListenerMiddleware.startListening({
  predicate: (action, currentState, previousState) => currentState?.equalizer?.lastAppliedAt !== previousState?.equalizer?.lastAppliedAt,
  effect: async (_, api) => {
    api.cancelActiveListeners()
    await api.delay(300)
    api.dispatch(persistEQToStorageThunk())
  },
})
