import { AnyAction } from '@reduxjs/toolkit'

import { SET_PERMISSIONS, SET_PERMISSIONS_ERROR } from '../ReduxConstants'

const initialState = {
    permission: '',
    error: false
}

const setPermissionReducer = (state = initialState, action: AnyAction) => {
    switch(action.type) {
        case SET_PERMISSIONS:
            return {
                ...state,
                ...action.payload
            }
        case SET_PERMISSIONS_ERROR:
            return {
                ...state,
                error: true
            }
        default:
        return state
    }
}

export default setPermissionReducer