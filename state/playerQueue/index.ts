import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import { Platform } from 'react-native'
import TrackPlayer, { RepeatMode, State as TrackPlayerState } from 'react-native-track-player'

import { ITrack } from '../../Store/Actions/currentTrack.actions'
import type { RootState } from '../../Store/store'
import {
    appendQueueItem,
    insertQueueItem,
    markInitialized,
    setCurrentIndex,
    setOriginalQueue,
    setPosition,
    setQueue,
    setRepeatMode,
    setRestoring,
    setShuffle,
} from './playerQueueSlice'
import {
    PlayerQueueState,
    QueueItem,
    RepeatSetting,
    StartPlaylistPayload,
} from './playerQueueTypes'
import {
    buildQueueFromTrackIds,
    normalizeTrackId,
    queueItemToTrackPlayer,
    refreshQueueWithLibrary,
    trackToQueueItem,
} from './utils'
import { selectPlaylistById } from '../playlists'

export { default as playerQueueReducer } from './playerQueueSlice'
export {
    resetQueueState,
    setQueue,
    setOriginalQueue,
    setCurrentIndex,
    setShuffle,
    setRepeatMode,
    setPosition,
} from './playerQueueSlice'
export type { QueueItem, PlayerQueueState, RepeatSetting }

const STORAGE_KEY_QUEUE_STATE = '@app/player-queue:v1'

const repeatSettingToMode: Record<RepeatSetting, RepeatMode> = {
    off: RepeatMode.Off,
    queue: RepeatMode.Queue,
    track: RepeatMode.Track,
}

const shuffleQueue = (queue: QueueItem[], currentIndex: number): { queue: QueueItem[]; currentIndex: number } => {
    if (queue.length <= 1) {
        return { queue: queue.slice(), currentIndex }
    }
    const safeIndex = currentIndex >= 0 && currentIndex < queue.length ? currentIndex : 0
    const current = queue[safeIndex]
    const rest = queue.filter((_, index) => index !== safeIndex)
    for (let i = rest.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = rest[i]
        rest[i] = rest[j]
        rest[j] = temp
    }
    return { queue: [current, ...rest], currentIndex: 0 }
}

const serializeQueue = (queue: QueueItem[]): QueueItem[] => queue.map((item) => ({ ...item }))

const getAdaptiveChunkSize = (length: number): number => {
    const base = Platform.OS === 'android' ? 100 : 200
    if (length > 2000) return Math.min(base, 100)
    if (length > 1000) return Math.min(base, 150)
    return base
}

const ensureTrackPlayerReady = async () => {
    try {
        const queue = await TrackPlayer.getQueue()
        if (!Array.isArray(queue)) {
            await TrackPlayer.setupPlayer()
        }
    } catch (error) {
        await TrackPlayer.setupPlayer()
    }
}

export const loadQueueFromStorage = createAsyncThunk<void, void, { state: RootState }>(
    'playerQueue/loadFromStorage',
    async (_, { dispatch, getState }) => {
        dispatch(setRestoring(true))
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY_QUEUE_STATE)
            if (!raw) {
                dispatch(markInitialized())
                return
            }
            const parsed = JSON.parse(raw)
            const queue = Array.isArray(parsed?.queue) ? (parsed.queue as QueueItem[]) : []
            const originalQueue = Array.isArray(parsed?.originalQueue) ? (parsed.originalQueue as QueueItem[]) : queue
            const currentIndex = typeof parsed?.currentIndex === 'number' ? parsed.currentIndex : 0
            const playlistId = typeof parsed?.playlistId === 'string' ? parsed.playlistId : undefined
            const isShuffle = Boolean(parsed?.isShuffle)
            const repeatModePersisted = typeof parsed?.repeatMode === 'string' ? (parsed.repeatMode as RepeatSetting) : 'off'
            const position = typeof parsed?.position === 'number' ? parsed.position : 0

            const state = getState()
            const libraryTracks = (state.tracks as unknown as ITrack[]) ?? []
            const refreshedOriginal = refreshQueueWithLibrary(originalQueue, libraryTracks)
            const refreshedQueue = isShuffle
                ? refreshQueueWithLibrary(queue, libraryTracks)
                : refreshQueueWithLibrary(queue, libraryTracks)

            const boundedIndex = refreshedQueue.length === 0 ? -1 : Math.min(Math.max(currentIndex, 0), refreshedQueue.length - 1)

            if (refreshedOriginal.length === 0 && refreshedQueue.length > 0) {
                dispatch(setOriginalQueue(refreshedQueue))
            } else {
                dispatch(setOriginalQueue(refreshedOriginal))
            }
            dispatch(setQueue({ queue: refreshedQueue, playlistId, currentIndex: boundedIndex, preserveOriginal: true }))
            dispatch(setShuffle(isShuffle))
            dispatch(setRepeatMode(repeatModePersisted))
            dispatch(setPosition(position))

            await ensureTrackPlayerReady()
            await TrackPlayer.reset()
            if (refreshedQueue.length > 0) {
                await TrackPlayer.add(refreshedQueue.map(queueItemToTrackPlayer))
                if (boundedIndex > 0) {
                    await TrackPlayer.skip(+refreshedQueue[boundedIndex].id)
                }
                if (position > 0) {
                    await TrackPlayer.seekTo(position)
                }
                const repeatMode = repeatSettingToMode[repeatModePersisted]
                await TrackPlayer.setRepeatMode(repeatMode)
            }
        } catch (error) {
            console.warn('Failed to restore player queue', error)
        } finally {
            dispatch(markInitialized())
            dispatch(setRestoring(false))
        }
    },
)

export const persistQueueToStorage = createAsyncThunk<void, void, { state: RootState }>(
    'playerQueue/persistToStorage',
    async (_, { getState }) => {
        const state = getState()
        const queueState = state.playerQueue
        const payload = {
            playlistId: queueState.playlistId,
            queue: serializeQueue(queueState.queue),
            originalQueue: serializeQueue(queueState.originalQueue),
            currentIndex: queueState.currentIndex,
            isShuffle: queueState.isShuffle,
            repeatMode: queueState.repeatMode,
            position: queueState.position,
            lastUpdatedAt: Date.now(),
        }
        try {
            await AsyncStorage.setItem(STORAGE_KEY_QUEUE_STATE, JSON.stringify(payload))
        } catch (error) {
            console.warn('Failed to persist player queue', error)
        }
    },
)

const applyRepeatMode = async (repeatMode: RepeatSetting) => {
    try {
        await TrackPlayer.setRepeatMode(repeatSettingToMode[repeatMode])
    } catch (error) {
        console.warn('Failed to set repeat mode', error)
    }
}

export const startPlaylistPlayback = createAsyncThunk<void, StartPlaylistPayload, { state: RootState }>(
    'playerQueue/startPlaylistPlayback',
    async ({ playlistId, startTrackId, startPosition }, { dispatch, getState }) => {
        const state = getState()
        const playlistSelector = selectPlaylistById(playlistId)
        const playlist = playlistSelector(state as any)
        if (!playlist) {
            console.warn('Playlist not found', playlistId)
            return
        }
        const libraryTracks = (state.tracks as unknown as ITrack[]) ?? []
        const baseQueue = buildQueueFromTrackIds(playlist.trackIds, libraryTracks)
        if (baseQueue.length === 0) {
            console.warn('Playlist has no playable tracks')
            return
        }
        const targetId = normalizeTrackId(startTrackId) ?? baseQueue[0].id
        let baseIndex = baseQueue.findIndex((item) => item.id === targetId)
        if (baseIndex < 0) {
            baseIndex = 0
        }
        const { isShuffle, repeatMode } = state.playerQueue
        let effectiveQueue = baseQueue
        let effectiveIndex = baseIndex
        if (isShuffle) {
            const shuffled = shuffleQueue(baseQueue, baseIndex)
            effectiveQueue = shuffled.queue
            effectiveIndex = shuffled.currentIndex
        }

        const parsedStartPosition =
            typeof startPosition === 'number'
                ? startPosition
                : startPosition != null
                    ? Number(startPosition)
                    : 0
        const safeStartPosition = Number.isFinite(parsedStartPosition) && parsedStartPosition > 0 ? parsedStartPosition : 0

        await ensureTrackPlayerReady()
        await TrackPlayer.reset()
        const CHUNK_SIZE = getAdaptiveChunkSize(effectiveQueue.length)
        const firstChunkSize = Math.min(effectiveQueue.length, Math.max(CHUNK_SIZE, effectiveIndex + 1))
        const firstChunk = effectiveQueue.slice(0, firstChunkSize)
        await TrackPlayer.add(firstChunk.map(queueItemToTrackPlayer))
        if (effectiveIndex > 0) {
            await TrackPlayer.skip(+effectiveQueue[effectiveIndex].id)
        }
        if (safeStartPosition > 0) {
            await TrackPlayer.seekTo(safeStartPosition)
        }
        await applyRepeatMode(repeatMode)
        await TrackPlayer.play()

        dispatch(setOriginalQueue(baseQueue))
        dispatch(setQueue({ queue: effectiveQueue, playlistId, currentIndex: effectiveIndex, preserveOriginal: true }))
        dispatch(setPosition(safeStartPosition))
        dispatch(persistQueueToStorage())

        for (let i = firstChunkSize; i < effectiveQueue.length; i += CHUNK_SIZE) {
            const batch = effectiveQueue.slice(i, i + CHUNK_SIZE)
            try {
                await TrackPlayer.add(batch.map(queueItemToTrackPlayer))
            } catch (error) {
                console.warn('Failed to add playlist batch', { index: i, size: batch.length, error })
                break
            }
        }
    },
)

export const playTracksNow = createAsyncThunk<void, QueueItem[], { state: RootState }>(
    'playerQueue/playTracksNow',
    async (queueItems, { dispatch, getState }) => {
        if (!Array.isArray(queueItems) || queueItems.length === 0) {
            return
        }

        const { repeatMode } = getState().playerQueue
        const CHUNK_SIZE = getAdaptiveChunkSize(queueItems.length)
        const firstChunkSize = Math.min(queueItems.length, CHUNK_SIZE)
        const firstChunk = queueItems.slice(0, firstChunkSize)

        await ensureTrackPlayerReady()
        await TrackPlayer.reset()
        await TrackPlayer.add(firstChunk.map(queueItemToTrackPlayer))
        await applyRepeatMode(repeatMode)
        await TrackPlayer.play()

        // Reflect intended full queue in Redux immediately to keep UI consistent
        dispatch(setOriginalQueue(queueItems))
        dispatch(setQueue({ queue: queueItems, currentIndex: 0 }))
        dispatch(setPosition(0))
        dispatch(persistQueueToStorage())

        // Add remaining items in background-friendly chunks to avoid large bridge payloads
        for (let i = firstChunkSize; i < queueItems.length; i += CHUNK_SIZE) {
            const batch = queueItems.slice(i, i + CHUNK_SIZE)
            try {
                await TrackPlayer.add(batch.map(queueItemToTrackPlayer))
            } catch (error) {
                console.warn('Failed to add queue batch', { index: i, size: batch.length, error })
                break
            }
        }
    },
)

export const enqueuePlayNext = createAsyncThunk<void, { trackId: string }, { state: RootState }>(
    'playerQueue/enqueuePlayNext',
    async ({ trackId }, { dispatch, getState }) => {
        const state = getState()
        const libraryTracks = (state.tracks as unknown as ITrack[]) ?? []
        const targetTrack = libraryTracks.find((track) => normalizeTrackId(track.id) === trackId)
        const queueItem = trackToQueueItem(targetTrack)
        if (!queueItem) {
            console.warn('Track not found for play next', trackId)
            return
        }
        await ensureTrackPlayerReady()
        const currentIndex = state.playerQueue.currentIndex
        const insertIndex = currentIndex < 0 ? 0 : currentIndex + 1
        await TrackPlayer.add(queueItemToTrackPlayer(queueItem), insertIndex)
        dispatch(insertQueueItem({ index: insertIndex, item: queueItem }))
        if (state.playerQueue.queue.length === 0) {
            dispatch(setCurrentIndex(0))
            await TrackPlayer.play()
        }
        dispatch(persistQueueToStorage())
    },
)

export const enqueueToQueue = createAsyncThunk<void, { trackId: string }, { state: RootState }>(
    'playerQueue/enqueueToQueue',
    async ({ trackId }, { dispatch, getState }) => {
        const state = getState()
        const libraryTracks = (state.tracks as unknown as ITrack[]) ?? []
        const targetTrack = libraryTracks.find((track) => normalizeTrackId(track.id) === trackId)
        const queueItem = trackToQueueItem(targetTrack)
        if (!queueItem) {
            console.warn('Track not found for queue', trackId)
            return
        }
        await ensureTrackPlayerReady()
        await TrackPlayer.add(queueItemToTrackPlayer(queueItem))
        dispatch(appendQueueItem({ item: queueItem }))
        if (state.playerQueue.currentIndex === -1) {
            dispatch(setCurrentIndex(0))
            await TrackPlayer.play()
        }
        dispatch(persistQueueToStorage())
    },
)

export const skipToNext = createAsyncThunk<void, void, { state: RootState }>(
    'playerQueue/skipToNext',
    async (_, { dispatch, getState }) => {
        const state = getState()
        if (state.playerQueue.queue.length === 0) {
            return
        }

        // Optimistically update UI index to feel instant
        const { currentIndex, queue, repeatMode } = state.playerQueue
        const optimisticNext = currentIndex < queue.length - 1 ? currentIndex + 1 : (repeatMode === 'queue' ? 0 : currentIndex)
        if (optimisticNext !== currentIndex) {
            dispatch(setCurrentIndex(optimisticNext))
            dispatch(setPosition(0))
        }

        await ensureTrackPlayerReady()
        const playbackState = await TrackPlayer.getState()
        const wasPlaying = playbackState === TrackPlayerState.Playing

        try {
            await TrackPlayer.skipToNext()
        } catch (error) {
            if (repeatMode === 'queue' && queue.length > 0) {
                const firstId = queue[0]?.id
                if (firstId) {
                    await TrackPlayer.skip(+firstId)
                }
            } else {
                console.warn('Unable to skip to next track', error)
                return
            }
        }

        if (!wasPlaying) {
            await TrackPlayer.pause()
        }

        dispatch(persistQueueToStorage())
    },
)

export const skipToPrevious = createAsyncThunk<void, void, { state: RootState }>(
    'playerQueue/skipToPrevious',
    async (_, { dispatch, getState }) => {
        const state = getState()
        if (state.playerQueue.queue.length === 0) {
            return
        }

        await ensureTrackPlayerReady()
        const playbackState = await TrackPlayer.getState()
        const wasPlaying = playbackState === TrackPlayerState.Playing
        const progress = await TrackPlayer.getPosition()
        const threshold = 3
        if (progress > threshold) {
            await TrackPlayer.seekTo(0)
            dispatch(setPosition(0))
            if (!wasPlaying) {
                await TrackPlayer.pause()
            }
            return
        }

        // Optimistically update UI index to feel instant
        const { currentIndex, queue, repeatMode } = state.playerQueue
        const optimisticPrev = currentIndex > 0 ? currentIndex - 1 : (repeatMode === 'queue' ? Math.max(0, queue.length - 1) : currentIndex)
        if (optimisticPrev !== currentIndex) {
            dispatch(setCurrentIndex(optimisticPrev))
            dispatch(setPosition(0))
        }

        try {
            await TrackPlayer.skipToPrevious()
        } catch (error) {
            if (repeatMode === 'queue' && queue.length > 0) {
                const lastId = queue[queue.length - 1]?.id
                if (lastId) {
                    await TrackPlayer.skip(+lastId)
                }
            } else {
                console.warn('Unable to skip to previous track', error)
                return
            }
        }

        if (!wasPlaying) {
            await TrackPlayer.pause()
        }

        dispatch(persistQueueToStorage())
    },
)

export const toggleShuffle = createAsyncThunk<void, void, { state: RootState }>(
    'playerQueue/toggleShuffle',
    async (_, { dispatch, getState }) => {
        const state = getState()
        const { queue, originalQueue, currentIndex, isShuffle } = state.playerQueue
        if (queue.length === 0) {
            dispatch(setShuffle(!isShuffle))
            return
        }

        await ensureTrackPlayerReady()
        const playbackState = await TrackPlayer.getState()
        const wasPlaying = playbackState === TrackPlayerState.Playing
        const position = await TrackPlayer.getPosition()

        if (!isShuffle) {
            const sourceQueue = originalQueue.length ? originalQueue : queue
            const shuffled = shuffleQueue(sourceQueue, currentIndex >= 0 ? currentIndex : 0)
            await TrackPlayer.reset()
            const CHUNK_SIZE = getAdaptiveChunkSize(shuffled.queue.length)
            const firstChunkSize = Math.min(shuffled.queue.length, Math.max(CHUNK_SIZE, shuffled.currentIndex + 1))
            const firstChunk = shuffled.queue.slice(0, firstChunkSize)
            await TrackPlayer.add(firstChunk.map(queueItemToTrackPlayer))
            const currentItem = shuffled.queue[shuffled.currentIndex]
            if (currentItem) {
                await TrackPlayer.skip(+currentItem.id)
            }
            if (position > 0) {
                await TrackPlayer.seekTo(position)
            }
            dispatch(setQueue({ queue: shuffled.queue, currentIndex: shuffled.currentIndex, preserveOriginal: true }))
            dispatch(setShuffle(true))
            for (let i = firstChunkSize; i < shuffled.queue.length; i += CHUNK_SIZE) {
                const batch = shuffled.queue.slice(i, i + CHUNK_SIZE)
                try {
                    await TrackPlayer.add(batch.map(queueItemToTrackPlayer))
                } catch (error) {
                    console.warn('Failed to add shuffled batch', { index: i, size: batch.length, error })
                    break
                }
            }
        } else {
            const activeIndex = currentIndex >= 0 ? currentIndex : 0
            const activeId = queue[activeIndex]?.id
            await TrackPlayer.reset()
            const CHUNK_SIZE = getAdaptiveChunkSize(originalQueue.length)
            let nextIndex = 0
            const firstChunkSize = Math.min(originalQueue.length, CHUNK_SIZE)
            const firstChunk = originalQueue.slice(0, firstChunkSize)
            await TrackPlayer.add(firstChunk.map(queueItemToTrackPlayer))
            if (activeId) {
                const originalIndex = originalQueue.findIndex((item) => item.id === activeId)
                if (originalIndex >= 0) {
                    nextIndex = originalIndex
                    await TrackPlayer.skip(+originalQueue[originalIndex].id)
                }
            }
            if (position > 0) {
                await TrackPlayer.seekTo(position)
            }
            dispatch(setQueue({ queue: originalQueue, currentIndex: nextIndex }))
            dispatch(setShuffle(false))
            for (let i = firstChunkSize; i < originalQueue.length; i += CHUNK_SIZE) {
                const batch = originalQueue.slice(i, i + CHUNK_SIZE)
                try {
                    await TrackPlayer.add(batch.map(queueItemToTrackPlayer))
                } catch (error) {
                    console.warn('Failed to add original batch', { index: i, size: batch.length, error })
                    break
                }
            }
        }

        dispatch(setPosition(position))
        if (wasPlaying) {
            await TrackPlayer.play()
        }
        dispatch(persistQueueToStorage())
    },
)

export const cycleRepeatMode = createAsyncThunk<void, void, { state: RootState }>(
    'playerQueue/cycleRepeatMode',
    async (_, { dispatch, getState }) => {
        const { repeatMode } = getState().playerQueue
        const nextMode: RepeatSetting = repeatMode === 'off' ? 'queue' : repeatMode === 'queue' ? 'track' : 'off'
        dispatch(setRepeatMode(nextMode))
        await applyRepeatMode(nextMode)
        dispatch(persistQueueToStorage())
    },
)

export const selectPlayerQueueState = (state: RootState) => state.playerQueue

export const selectCurrentQueueItem = createSelector(selectPlayerQueueState, (queueState) => {
    if (queueState.currentIndex < 0 || queueState.currentIndex >= queueState.queue.length) {
        return undefined
    }
    return queueState.queue[queueState.currentIndex]
})

export const selectIsPlayerReady = createSelector(selectPlayerQueueState, (queueState) => queueState.isInitialized)

export const selectPlaybackMeta = createSelector(selectPlayerQueueState, (queueState) => ({
    playlistId: queueState.playlistId,
    isShuffle: queueState.isShuffle,
    repeatMode: queueState.repeatMode,
    position: queueState.position,
    currentIndex: queueState.currentIndex,
    queueSize: queueState.queue.length,
}))






