import { check, PERMISSIONS, RESULTS, request } from 'react-native-permissions'
import { setPermission, setPermissionError } from '../Store/Actions/setPermissions.actions'
import store from '../Store/store'

export function checkPermissions () {
    check(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO)
        .then((result) => {
            switch (result) {
            case RESULTS.UNAVAILABLE: store.dispatch(RESULTS.UNAVAILABLE)
                break
            case RESULTS.DENIED: requestAudioPermission()
                break
            case RESULTS.LIMITED: store.dispatch(RESULTS.LIMITED)
                break
            case RESULTS.GRANTED: store.dispatch(RESULTS.GRANTED)
                break
            case RESULTS.BLOCKED: store.dispatch(RESULTS.BLOCKED)
                break
            }
        })
        .catch((error) => {
            // …
        })
}

export function requestAudioPermission () {

    const rationale = {
        title: 'Oozwave Storage Permission',
        message: 'Oozwave needs your permission to read music files',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
    }
    request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO, rationale).then((result) => {
        // …
        if (result.includes('granted')) {
            store.dispatch(setPermission(RESULTS.GRANTED))
        }
       
    }).catch((error) => {
        store.dispatch(setPermissionError(error))
    })

}