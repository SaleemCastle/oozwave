import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'

import { persistQueueToStorage } from './index'
import {
    appendQueueItem,
    insertQueueItem,
    removeQueueItem,
    setCurrentIndex,
    setOriginalQueue,
    setQueue,
    setRepeatMode,
    setShuffle,
} from './playerQueueSlice'
import type { PlayerQueueState } from './playerQueueTypes'

interface RootWithPlayerQueue {
    playerQueue: PlayerQueueState
}

export const playerQueueListenerMiddleware = createListenerMiddleware<RootWithPlayerQueue>()

playerQueueListenerMiddleware.startListening({
    matcher: isAnyOf(
        setQueue,
        setOriginalQueue,
        setCurrentIndex,
        setShuffle,
        setRepeatMode,
        insertQueueItem,
        appendQueueItem,
        removeQueueItem,
    ),
    effect: async (_, listenerApi) => {
        listenerApi.cancelActiveListeners()
        await listenerApi.delay(250)
        listenerApi.dispatch(persistQueueToStorage())
    },
})

export default playerQueueListenerMiddleware

