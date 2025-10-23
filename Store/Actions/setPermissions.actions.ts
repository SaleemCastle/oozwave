import { PermissionStatus } from 'react-native';
import { SET_PERMISSIONS, SET_PERMISSIONS_ERROR } from '../ReduxConstants';

export function setPermission(permission: string) {
    return {
        type: SET_PERMISSIONS,
        payload: permission
    }
}

export function setPermissionError(error: unknown) {
    const message =
        error && typeof error === 'object' && 'message' in (error as any)
            ? String((error as any).message)
            : String(error)
    return {
        type: SET_PERMISSIONS_ERROR,
        payload: message,
    }
}
