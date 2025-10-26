import { NativeModules } from 'react-native'

export type EQPresetName =
  | 'Flat' | 'Pop' | 'Rock' | 'Jazz' | 'Classical' | 'Dance' | 'Hip-Hop'
  | 'Acoustic' | 'Vocal Boost' | 'Bass Boost' | 'Treble Boost' | 'Custom'

export interface EqualizerNative {
  initEQ(sessionId?: number): Promise<boolean>
  setBandGain(index: number, gainDb: number): Promise<void>
  setPreamp(gainDb: number): Promise<void>
  setBypass(enabled: boolean): Promise<void>
  applyPreset(name: EQPresetName, gains: number[]): Promise<void>
  getIsAvailable(): Promise<boolean>
  teardown(): Promise<void>
}

const Native: Partial<EqualizerNative> = (NativeModules as any).EqualizerModule || {}

const safe = <T extends unknown>(fn: (() => Promise<T>) | undefined, fallback: T) => {
  return fn ? fn : (async () => fallback)
}

const EQ: EqualizerNative = {
  initEQ: async (sessionId?: number) => (Native.initEQ ? Native.initEQ(sessionId) : false),
  setBandGain: async (index, gainDb) => { if (Native.setBandGain) await Native.setBandGain(index, gainDb) },
  setPreamp: async (gainDb) => { if (Native.setPreamp) await Native.setPreamp(gainDb) },
  setBypass: async (enabled) => { if (Native.setBypass) await Native.setBypass(enabled) },
  applyPreset: async (name, gains) => { if (Native.applyPreset) await Native.applyPreset(name, gains) },
  getIsAvailable: async () => (Native.getIsAvailable ? Native.getIsAvailable() : false),
  teardown: async () => { if (Native.teardown) await Native.teardown() },
}

export default EQ

