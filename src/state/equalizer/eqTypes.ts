import type { EQPresetName } from '../../audio/equalizer/EqualizerNative'

export const EQ_CENTER_FREQS = [31,62,125,250,500,1000,2000,4000,8000,16000] as const
export type DeviceProfile = 'headphones' | 'speakers'

export type EQState = {
  bypass: boolean
  preamp: number
  bands: number[]
  preset: EQPresetName
  deviceProfile: DeviceProfile
  available: boolean
  lastAppliedAt?: number
  bassBoost?: number
}
