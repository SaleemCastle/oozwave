import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { PlayerQueueState, QueueItem, RepeatSetting } from './playerQueueTypes'

const initialState: PlayerQueueState = {
    playlistId: undefined,
    queue: [],
    originalQueue: [],
    currentIndex: -1,
    isShuffle: false,
    repeatMode: 'off',
    position: 0,
    isInitialized: false,
    isRestoring: false,
    lastUpdatedAt: undefined,
}

const cloneQueue = (queue: QueueItem[]) => queue.map((item) => ({ ...item }))

const playerQueueSlice = createSlice({
    name: 'playerQueue',
    initialState,
    reducers: {
        resetQueueState: () => initialState,
        setQueue(
            state,
            action: PayloadAction<{
                queue: QueueItem[]
                playlistId?: string
                currentIndex?: number
                preserveOriginal?: boolean
            }>,
        ) {
            const { queue, playlistId, currentIndex = 0, preserveOriginal = false } = action.payload
            state.queue = cloneQueue(queue)
            if (preserveOriginal) {
                const originalMap = new Map(state.originalQueue.map((item) => [item.id, item]))
                state.originalQueue = cloneQueue(
                    queue.map((item) => originalMap.get(item.id) ?? item),
                )
            } else {
                state.originalQueue = cloneQueue(queue)
            }
            state.playlistId = playlistId
            const boundedIndex = queue.length === 0 ? -1 : Math.min(Math.max(currentIndex, 0), queue.length - 1)
            state.currentIndex = boundedIndex
            state.lastUpdatedAt = Date.now()
            state.isInitialized = true
            state.isRestoring = false
        },
        setOriginalQueue(state, action: PayloadAction<QueueItem[]>) {
            state.originalQueue = cloneQueue(action.payload)
            state.lastUpdatedAt = Date.now()
        },
        setCurrentIndex(state, action: PayloadAction<number>) {
            const nextIndex = action.payload
            if (state.queue.length === 0) {
                state.currentIndex = -1
                return
            }
            state.currentIndex = nextIndex < 0 ? 0 : nextIndex >= state.queue.length ? state.queue.length - 1 : nextIndex
            state.lastUpdatedAt = Date.now()
        },
        setShuffle(state, action: PayloadAction<boolean>) {
            state.isShuffle = action.payload
            state.lastUpdatedAt = Date.now()
        },
        setRepeatMode(state, action: PayloadAction<RepeatSetting>) {
            state.repeatMode = action.payload
            state.lastUpdatedAt = Date.now()
        },
        setPosition(state, action: PayloadAction<number>) {
            state.position = action.payload
        },
        setRestoring(state, action: PayloadAction<boolean>) {
            state.isRestoring = action.payload
        },
        markInitialized(state) {
            state.isInitialized = true
            state.isRestoring = false
        },
        insertQueueItem(
            state,
            action: PayloadAction<{ index: number; item: QueueItem; updateOriginal?: boolean }>,
        ) {
            const { index, item, updateOriginal = true } = action.payload
            const safeIndex = Math.min(Math.max(index, 0), state.queue.length)
            state.queue.splice(safeIndex, 0, { ...item })
            if (updateOriginal) {
                const originalIndex = Math.min(Math.max(index, 0), state.originalQueue.length)
                state.originalQueue.splice(originalIndex, 0, { ...item })
            }
            if (safeIndex <= state.currentIndex) {
                state.currentIndex += 1
            }
            state.lastUpdatedAt = Date.now()
        },
        appendQueueItem(state, action: PayloadAction<{ item: QueueItem; updateOriginal?: boolean }>) {
            const { item, updateOriginal = true } = action.payload
            state.queue.push({ ...item })
            if (updateOriginal) {
                state.originalQueue.push({ ...item })
            }
            state.lastUpdatedAt = Date.now()
        },
        removeQueueItem(state, action: PayloadAction<string>) {
            const trackId = action.payload
            const queueIndex = state.queue.findIndex((item) => item.id === trackId)
            if (queueIndex >= 0) {
                state.queue.splice(queueIndex, 1)
                if (queueIndex < state.currentIndex) {
                    state.currentIndex -= 1
                } else if (queueIndex === state.currentIndex) {
                    state.currentIndex = Math.min(state.currentIndex, state.queue.length - 1)
                }
            }
            const originalIndex = state.originalQueue.findIndex((item) => item.id === trackId)
            if (originalIndex >= 0) {
                state.originalQueue.splice(originalIndex, 1)
            }
            if (state.queue.length === 0) {
                state.currentIndex = -1
            }
            state.lastUpdatedAt = Date.now()
        },
    },
})

export const {
    resetQueueState,
    setQueue,
    setOriginalQueue,
    setCurrentIndex,
    setShuffle,
    setRepeatMode,
    setPosition,
    setRestoring,
    markInitialized,
    insertQueueItem,
    appendQueueItem,
    removeQueueItem,
} = playerQueueSlice.actions

export default playerQueueSlice.reducer
