import { NativeEventEmitter, NativeModules, Platform } from 'react-native'
import type { DeviceProfile } from '../state/equalizer/eqTypes'

type RouteListener = (profile: DeviceProfile) => void

const emitter = new NativeEventEmitter((NativeModules as any).EqualizerModule)

let subscription: { remove: () => void } | null = null

export const startRouteListener = (cb: RouteListener) => {
  if (subscription) return
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    subscription = emitter.addListener('audioRouteChanged', (payload: { route: string }) => {
      const lower = (payload?.route || '').toLowerCase()
      const profile: DeviceProfile = lower.includes('head') || lower.includes('bluetooth') ? 'headphones' : 'speakers'
      cb(profile)
    })
  }
}

export const stopRouteListener = () => {
  subscription?.remove()
  subscription = null
}

