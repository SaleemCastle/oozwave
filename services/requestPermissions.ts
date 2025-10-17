import { check, PERMISSIONS, RESULTS, request } from 'react-native-permissions'
import { setPermission, setPermissionError } from '../Store/Actions/setPermissions.actions'

import { Platform } from 'react-native'
import { store } from '../Store/store'

const resolveAudioPermission = () => {
    if (Platform.OS !== 'android') {
        return PERMISSIONS.ANDROID.READ_MEDIA_AUDIO
    }

    if (Platform.Version >= 33) {
        return PERMISSIONS.ANDROID.READ_MEDIA_AUDIO
    }

    return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
}

export function checkPermissions () {
    const permissionId = resolveAudioPermission()

    check(permissionId)
        .then((result) => {
            switch (result) {
            case RESULTS.UNAVAILABLE:
                store.dispatch(setPermission(RESULTS.UNAVAILABLE))
                break
            case RESULTS.DENIED:
                requestAudioPermission()
                break
            case RESULTS.LIMITED:
                store.dispatch(setPermission(RESULTS.LIMITED))
                break
            case RESULTS.GRANTED:
                store.dispatch(setPermission(RESULTS.GRANTED))
                break
            case RESULTS.BLOCKED:
                store.dispatch(setPermission(RESULTS.BLOCKED))
                break
            default:
                store.dispatch(setPermission(result))
                break
            }
        })
        .catch((error) => {
            store.dispatch(setPermissionError(error))
        })
}

export function requestAudioPermission () {
    const permissionId = resolveAudioPermission()

    const rationale = {
        title: 'Oozwave Storage Permission',
        message: 'Oozwave needs your permission to read music files',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
    }

    request(permissionId, rationale)
        .then((result) => {
            console.log('Permission result from request ', result)
            if (result === RESULTS.GRANTED || result === 'granted') {
                store.dispatch(setPermission(RESULTS.GRANTED))
            } else {
                store.dispatch(setPermission(result))
            }
        })
        .catch((error) => {
            store.dispatch(setPermissionError(error))
        })
}
