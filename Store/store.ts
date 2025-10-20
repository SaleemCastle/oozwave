import { configureStore } from '@reduxjs/toolkit'

import addTracksReducer from './Reducers/tracks.reducer'
import currentTrackReducer from './Reducers/currentTrack.reducer'
import currentPlayerStateReducer from './Reducers/playerState.reducer'
import setPermissionsReducer from './Reducers/setPermissions.reducer'
import {
    playlistReducer,
    playlistListenerMiddleware,
    loadPlaylistsFromStorage,
} from '../state/playlists'

export const store = configureStore({
    reducer: {
        tracks: addTracksReducer,
        currentTrack: currentTrackReducer,
        currentPlayerState: currentPlayerStateReducer,
        permission: setPermissionsReducer,
        playlists: playlistReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(playlistListenerMiddleware.middleware),
})

store.dispatch(loadPlaylistsFromStorage())

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
