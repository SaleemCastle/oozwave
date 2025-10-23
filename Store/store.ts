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
import {
    playerQueueReducer,
    loadQueueFromStorage,
} from '../state/playerQueue'
import { playerQueueListenerMiddleware } from '../state/playerQueue/listener'

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production'

export const store = configureStore({
    reducer: {
        tracks: addTracksReducer,
        currentTrack: currentTrackReducer,
        currentPlayerState: currentPlayerStateReducer,
        permission: setPermissionsReducer,
        playlists: playlistReducer,
        playerQueue: playerQueueReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ immutableCheck: isDev ? { warnAfter: 64, ignoredPaths: ['tracks', 'playerQueue.queue'] } : false, serializableCheck: isDev ? { warnAfter: 64, ignoredPaths: ['tracks', 'playerQueue.queue'] } : false, }).prepend(
            playerQueueListenerMiddleware.middleware,
            playlistListenerMiddleware.middleware,
        ),
})

store.dispatch(loadPlaylistsFromStorage())
store.dispatch(loadQueueFromStorage())

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
