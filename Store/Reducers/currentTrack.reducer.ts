import { AnyAction } from '@reduxjs/toolkit'

import { CURRENT_TRACK } from '../ReduxConstants'
import { ITrack } from '../Actions/currentTrack.actions'

const initialState: ITrack = {
    album: '',
    artist: '',
    cover: '',
    duration: 0,
    id: 0,
    path: '',
    title: '',
}

const addTracksReducer = (state = initialState, action: AnyAction) => {
    switch(action.type) {
        case CURRENT_TRACK:
            return {
                ...state,
                ...action.payload
            }
        default:
        return state
    }
}

export default addTracksReducer