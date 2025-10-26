import EQ, { EQPresetName } from './EqualizerNative'
import { Platform } from 'react-native'
import TrackPlayer from 'react-native-track-player'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const debounce = <T extends (...args: any[]) => Promise<any>>(fn: T, ms: number) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  return (...args: Parameters<T>) => {
    lastArgs = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      const callArgs = lastArgs as Parameters<T>
      lastArgs = null
      fn(...callArgs).catch(() => {})
    }, ms)
  }
}

let isInitialized = false
let lastIOSPreampDb = 0
let lastBypass = false

export const equalizerService = {
  async init(sessionId?: number) {
    if (Platform.OS === 'android') {
      const ok = await EQ.initEQ(sessionId)
      isInitialized = ok
      return ok
    } else {
      isInitialized = true
      return true
    }
  },
  applyBand: debounce(async (index: number, gainDb: number) => {
    if (!isInitialized) return
    if (Platform.OS === 'android') {
      const safeGain = clamp(gainDb, -12, 12)
      await EQ.setBandGain(index, safeGain)
    } else {
      // iOS v1: no-op for per-band until native EQ is available
    }
  }, 20),
  applyPreamp: debounce(async (gainDb: number) => {
    if (!isInitialized) return
    const safeGain = clamp(gainDb, -12, 12)
    lastIOSPreampDb = safeGain
    if (Platform.OS === 'android') {
      await EQ.setPreamp(safeGain)
    } else {
      const linear = Math.max(0, Math.min(1.5, Math.pow(10, safeGain / 20)))
      if (!lastBypass) {
        try { await TrackPlayer.setVolume(linear) } catch {}
      }
    }
  }, 20),
  async applyBypass(enabled: boolean) {
    if (!isInitialized) return
    lastBypass = enabled
    if (Platform.OS === 'android') {
      await EQ.setBypass(enabled)
    } else {
      try {
        if (enabled) {
          await TrackPlayer.setVolume(1.0)
        } else {
          const linear = Math.max(0, Math.min(1.5, Math.pow(10, lastIOSPreampDb / 20)))
          await TrackPlayer.setVolume(linear)
        }
      } catch {}
    }
  },
  async applyPreset(presetName: EQPresetName, gains: number[]) {
    if (!isInitialized) return
    if (Platform.OS === 'android') {
      await EQ.applyPreset(presetName, gains)
    } else {
      // no-op for iOS per-band
    }
  },
  async syncAll(bands: number[], preamp: number, bypass: boolean) {
    if (!isInitialized) return
    if (Platform.OS === 'android') {
      const clampedBands = bands.map((g) => clamp(g, -12, 12))
      await EQ.applyPreset('Custom', clampedBands)
      await EQ.setPreamp(clamp(preamp, -12, 12))
      await EQ.setBypass(bypass)
    } else {
      lastIOSPreampDb = clamp(preamp, -12, 12)
      lastBypass = bypass
      try {
        await TrackPlayer.setVolume(bypass ? 1.0 : Math.max(0, Math.min(1.5, Math.pow(10, lastIOSPreampDb / 20))))
      } catch {}
    }
  },
  async teardown() {
    await EQ.teardown()
    isInitialized = false
  },
}

export default equalizerService

