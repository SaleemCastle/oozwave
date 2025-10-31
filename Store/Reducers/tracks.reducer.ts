import { ADD_TRACKS, ADD_TRACKS_ERROR } from '../ReduxConstants'
import { ITrack } from '../Actions/currentTrack.actions'
import { AnyAction } from 'redux'

const initialState: ITrack[] = []

const addTracksReducer = (state = initialState, action: AnyAction) => {
    switch(action.type) {
        case ADD_TRACKS:
            return [
                ...action.payload
            ]
        case ADD_TRACKS_ERROR: {
            // Keep state shape stable (array of tracks)
            // Optionally, log or handle error elsewhere
            return state
        }
        default:
            return state
    }
}

export default addTracksReducer
