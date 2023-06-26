import { ADD_TRACKS, ADD_TRACKS_ERROR } from '../ReduxConstants'
import { ITrack } from '../Actions/currentTrack.actions'
import { AnyAction } from 'redux'

const initialState: ITrack[] = [
    {
        album: '',
        artist: '',
        cover: '',
        duration: 0,
        id: 0,
        path: '',
        title: '',
    },
]

const addTracksReducer = (state = initialState, action: AnyAction) => {
    switch(action.type) {
        case ADD_TRACKS:
            return [
                ...action.payload
            ]
        case ADD_TRACKS_ERROR: {
            return {
                ...[],
                error: true,
                errorMsg: action.payload
            }
        }
        default:
            return state
    }
}

export default addTracksReducer