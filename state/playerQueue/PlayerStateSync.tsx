import React, { useEffect, useRef } from 'react'
import TrackPlayer, { Event, usePlaybackState, useProgress, useTrackPlayerEvents } from 'react-native-track-player'

import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { setCurrentPlayerState } from '../../Store/Actions/playerState.actions'
import { setCurrentTrack, ITrack } from '../../Store/Actions/currentTrack.actions'
import {
    selectPlayerQueueState,
    setCurrentIndex,
    setPosition as setQueuePosition,
} from './index'
import { normalizeTrackId, queueItemToITrack } from './utils'

const PlayerStateSync: React.FC = () => {
    const dispatch = useAppDispatch()
    const playbackState = usePlaybackState()
    const progress = useProgress(1)
    const queueState = useAppSelector(selectPlayerQueueState)
    const libraryTracks = useAppSelector((state) => state.tracks as ITrack[])

    const queueRef = useRef(queueState)
    const tracksRef = useRef(libraryTracks)

    useEffect(() => {
        queueRef.current = queueState
    }, [queueState])

    useEffect(() => {
        tracksRef.current = libraryTracks
    }, [libraryTracks])

    useEffect(() => {
        dispatch(setCurrentPlayerState(playbackState.toString()))
    }, [dispatch, playbackState])

    useEffect(() => {
        dispatch(setQueuePosition(progress.position))
    }, [dispatch, progress.position])

    useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
        if (event.type !== Event.PlaybackTrackChanged) {
            return
        }
        if (event.nextTrack == null) {
            return
        }

        const queue = queueRef.current.queue
        const library = tracksRef.current ?? []

        let targetIndex: number | null = null
        let trackId: string | null = null

        if (typeof event.nextTrack === 'number') {
            targetIndex = event.nextTrack
            try {
                const nativeTrack = await TrackPlayer.getTrack(event.nextTrack)
                trackId = normalizeTrackId((nativeTrack as any)?.id)
            } catch (error) {
                // ignore lookup failures
            }
        } else {
            trackId = normalizeTrackId(event.nextTrack)
        }

        if (targetIndex === null || targetIndex < 0 || targetIndex >= queue.length) {
            if (trackId) {
                const lookupIndex = queue.findIndex((item) => item.id === trackId)
                if (lookupIndex >= 0) {
                    targetIndex = lookupIndex
                }
            }
        }

        if (targetIndex !== null && targetIndex >= 0 && targetIndex < queue.length) {
            dispatch(setCurrentIndex(targetIndex))
        }

        if (!trackId && targetIndex !== null && targetIndex >= 0 && targetIndex < queue.length) {
            trackId = queue[targetIndex].id
        }

        if (trackId) {
            const libraryMatch = library.find((track) => String(track.id) === trackId)
            if (libraryMatch) {
                dispatch(setCurrentTrack(libraryMatch))
                return
            }
        }

        if (targetIndex !== null && targetIndex >= 0 && targetIndex < queue.length) {
            dispatch(setCurrentTrack(queueItemToITrack(queue[targetIndex])))
        } else if (trackId) {
            const queueItem = queue.find((item) => item.id === trackId)
            if (queueItem) {
                dispatch(setCurrentTrack(queueItemToITrack(queueItem)))
            }
        }
    })

    return null
}

export default PlayerStateSync



