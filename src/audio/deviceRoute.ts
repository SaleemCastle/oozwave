import { NativeEventEmitter, Platform } from 'react-native'
import type { DeviceProfile } from '../state/equalizer/eqTypes'

type RouteListener = (profile: DeviceProfile) => void

// Create an event emitter without binding to a specific native module to avoid
// requiring addListener/removeListeners on the native side (RN 0.65+ throws otherwise)
let emitter: NativeEventEmitter | null = null

let subscription: { remove: () => void } | null = null

export const startRouteListener = (cb: RouteListener) => {
  if (subscription) return
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    if (!emitter) emitter = new NativeEventEmitter()
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
