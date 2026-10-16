import { check, PERMISSIONS, RESULTS, request, type PermissionStatus } from 'react-native-permissions'
import { setPermission, setPermissionError } from '../Store/Actions/setPermissions.actions'

import { Platform } from 'react-native'
import { store } from '../Store/store'

const resolveAudioPermission = () => {
    if (Platform.OS === 'ios') return PERMISSIONS.IOS.MEDIA_LIBRARY
    return Number(Platform.Version) >= 33
        ? PERMISSIONS.ANDROID.READ_MEDIA_AUDIO
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
}

// Checking never prompts. Ask for access only after the user taps Scan.
export async function checkPermissions(): Promise<PermissionStatus> {
    try {
        const result = await check(resolveAudioPermission())
        store.dispatch(setPermission(result))
        return result
    } catch (error) {
        store.dispatch(setPermissionError(error))
        throw error
    }
}

export async function requestAudioPermission(): Promise<PermissionStatus> {
    const current = await checkPermissions()
    if (current !== RESULTS.DENIED) return current

    try {
        const permissionId = resolveAudioPermission()
        const result = Platform.OS === 'ios'
            ? await request(permissionId)
            : await request(permissionId, {
                title: 'Oozwave Music Permission',
                message: 'Oozwave needs access to read your music files',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            })
        store.dispatch(setPermission(result))
        return result
    } catch (error) {
        store.dispatch(setPermissionError(error))
        throw error
    }
}
