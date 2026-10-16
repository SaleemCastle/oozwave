import { beforeEach, expect, it, jest } from '@jest/globals'
import { Platform } from 'react-native'
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'
import { store } from '../../Store/store'
import { checkPermissions, requestAudioPermission } from '../../services/requestPermissions'

jest.mock('react-native-permissions', () => ({
    check: jest.fn(),
    request: jest.fn(),
    PERMISSIONS: {
        IOS: { MEDIA_LIBRARY: 'ios.permission.MEDIA_LIBRARY' },
        ANDROID: { READ_MEDIA_AUDIO: 'android.permission.READ_MEDIA_AUDIO', READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE' },
    },
    RESULTS: { DENIED: 'denied', GRANTED: 'granted', BLOCKED: 'blocked', UNAVAILABLE: 'unavailable' },
}))
jest.mock('../../Store/store', () => ({ store: { dispatch: jest.fn() } }))

const mockCheck = jest.mocked(check)
const mockRequest = jest.mocked(request)

beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' })
})

it('checks iOS music access without prompting on startup', async () => {
    mockCheck.mockResolvedValue(RESULTS.DENIED)
    await expect(checkPermissions()).resolves.toBe(RESULTS.DENIED)
    expect(check).toHaveBeenCalledWith(PERMISSIONS.IOS.MEDIA_LIBRARY)
    expect(request).not.toHaveBeenCalled()
})

it('awaits the iOS prompt and returns approval so scanning can continue', async () => {
    mockCheck.mockResolvedValue(RESULTS.DENIED)
    mockRequest.mockResolvedValue(RESULTS.GRANTED)
    await expect(requestAudioPermission()).resolves.toBe(RESULTS.GRANTED)
    expect(request).toHaveBeenCalledWith(PERMISSIONS.IOS.MEDIA_LIBRARY)
    expect(store.dispatch).toHaveBeenLastCalledWith({ type: 'SET_PERMISSIONS', payload: RESULTS.GRANTED })
})

it.each([RESULTS.GRANTED, RESULTS.BLOCKED, RESULTS.UNAVAILABLE])('does not prompt when access is %s', async (status) => {
    mockCheck.mockResolvedValue(status)
    await expect(requestAudioPermission()).resolves.toBe(status)
    expect(request).not.toHaveBeenCalled()
})

it('returns denial rather than starting a scan', async () => {
    mockCheck.mockResolvedValue(RESULTS.DENIED)
    mockRequest.mockResolvedValue(RESULTS.BLOCKED)
    await expect(requestAudioPermission()).resolves.toBe(RESULTS.BLOCKED)
})

it.each([[32, 'READ_EXTERNAL_STORAGE'], [33, 'READ_MEDIA_AUDIO']])('preserves Android %s audio permission selection', async (version, permission) => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' })
    Object.defineProperty(Platform, 'Version', { configurable: true, value: version })
    mockCheck.mockResolvedValue(RESULTS.DENIED)
    mockRequest.mockResolvedValue(RESULTS.GRANTED)
    await expect(requestAudioPermission()).resolves.toBe(RESULTS.GRANTED)
    expect(request).toHaveBeenCalledWith(PERMISSIONS.ANDROID[permission as keyof typeof PERMISSIONS.ANDROID], expect.any(Object))
})

it('reports native failures and rejects instead of allowing a scan', async () => {
    mockCheck.mockResolvedValue(RESULTS.DENIED)
    mockRequest.mockRejectedValue(new Error('Native permission failure'))
    await expect(requestAudioPermission()).rejects.toThrow('Native permission failure')
    expect(store.dispatch).toHaveBeenLastCalledWith({ type: 'SET_PERMISSIONS_ERROR', payload: 'Native permission failure' })
})
