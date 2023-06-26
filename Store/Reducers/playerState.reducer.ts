import { AnyAction } from 'redux'
import { PLAYER_STATE } from '../ReduxConstants'
import { PayloadAction } from '@reduxjs/toolkit'
import { IPlayerStateAction } from '../Actions/playerState.actions'

const initialState = {
    playerState: ''
}

const setPlayerStateReducer = (state = initialState, action: AnyAction) => {
    switch(action.type) {
        case PLAYER_STATE:
            return {
                ...state,
                playerState: action.payload
            }
        default:
            return state
    }
}

export default setPlayerStateReducer