import { Alert, Platform, ToastAndroid } from 'react-native'
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'

import {
    importPlaylistsFromJson,
    persistPlaylistsToStorage,
    playlistActions,
} from './playlistSlice'
import { PlaylistsState } from './playlistTypes'

type RootWithPlaylists = {
    playlists: PlaylistsState
}

const notifyPersistenceFailure = (message?: string) => {
    const fallback = message ? `Playlist changes not saved: ${message}` : 'Playlist changes not saved'
    if (Platform.OS === 'android') {
        ToastAndroid.show(fallback, ToastAndroid.LONG)
    } else {
        Alert.alert('Save failed', fallback)
    }
}

const cloneState = (state: PlaylistsState): PlaylistsState => JSON.parse(JSON.stringify(state))

export const playlistListenerMiddleware = createListenerMiddleware<RootWithPlaylists>()

playlistListenerMiddleware.startListening({
    matcher: isAnyOf(
        playlistActions.createPlaylist,
        playlistActions.duplicatePlaylist,
        playlistActions.renamePlaylist,
        playlistActions.updatePlaylistMeta,
        playlistActions.deletePlaylist,
        playlistActions.addTrack,
        playlistActions.addTracks,
        playlistActions.removeTrack,
        playlistActions.moveTrack,
        playlistActions.setSelectedPlaylist,
        playlistActions.setSearchQuery,
        playlistActions.setSortBy,
        importPlaylistsFromJson.fulfilled,
    ),
    effect: async (action, listenerApi) => {
        const originalState = listenerApi.getOriginalState() as RootWithPlaylists
        const snapshot = cloneState(originalState.playlists)
        listenerApi.cancelActiveListeners()
        await listenerApi.delay(300)
        const result = await listenerApi.dispatch(persistPlaylistsToStorage())
        if (persistPlaylistsToStorage.rejected.match(result)) {
            listenerApi.dispatch(playlistActions.restoreState(snapshot))
            const message = typeof result.payload === 'string' ? result.payload : undefined
            notifyPersistenceFailure(message)
        }
    },
})

export default playlistListenerMiddleware
