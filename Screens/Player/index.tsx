import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { StatusBar, TouchableOpacity, View } from 'react-native'
import Slider from '@react-native-community/slider'
import TrackPlayer, { State, usePlaybackState, useProgress } from 'react-native-track-player'
import Icon from 'react-native-vector-icons/Feather'
import styled from 'styled-components/native'

import { Colors, Images } from '../../Constants'
import { setCurrentTrack, ITrack } from '../../Store/Actions/currentTrack.actions'
import { setCurrentPlayerState } from '../../Store/Actions/playerState.actions'
import { McText, McImage, PlayButton } from '../../Components'
import { PlayerProps } from '../../types'
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'
import {
    selectCurrentQueueItem,
    selectPlaybackMeta,
    skipToNext,
    skipToPrevious,
    toggleShuffle,
    cycleRepeatMode,
    setPosition as setQueuePosition,
} from '../../state/playerQueue'
import { colors } from '../../theme/tokens'

const formatDuration = (ms: number) => {
    if (!ms || Number.isNaN(ms)) {
        return '0:00'
    }
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const paddedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`
    return `${minutes}:${paddedSeconds}`
}

const Player = ({ navigation }: PlayerProps) => {
    const dispatch = useAppDispatch()
    const playbackState = usePlaybackState()
    const progress = useProgress(0.5)
    const currentQueueItem = useAppSelector(selectCurrentQueueItem)
    const playbackMeta = useAppSelector(selectPlaybackMeta)
    const currentPlayerState = useAppSelector((state) => state.currentPlayerState.playerState)
    const libraryTracks = useAppSelector((state) => state.tracks as ITrack[])

    const [sliderValue, setSliderValue] = useState(0)
    const [isSeeking, setIsSeeking] = useState(false)

    const isPlaying = playbackState === State.Playing
    const totalDurationMs = currentQueueItem?.duration ?? 0
    const totalDurationSeconds = totalDurationMs / 1000
    const sliderMax = useMemo(() => {
        const duration = progress.duration > 0 ? progress.duration : totalDurationSeconds
        if (duration > 0) {
            return duration
        }
        return sliderValue > 0 ? sliderValue : 1
    }, [progress.duration, totalDurationSeconds, sliderValue])

    useEffect(() => {
        if (!isSeeking) {
            setSliderValue(progress.position)
        }
    }, [isSeeking, progress.position])

    useEffect(() => {
        if (!currentQueueItem) {
            setSliderValue(0)
        }
    }, [currentQueueItem])

    useEffect(() => {
        dispatch(setCurrentPlayerState(playbackState.toString()))
    }, [dispatch, playbackState])

    useEffect(() => {
        if (!currentQueueItem) {
            return
        }
        const libraryTrack = libraryTracks?.find((track) => String(track.id) === currentQueueItem.id)
        if (libraryTrack) {
            dispatch(setCurrentTrack(libraryTrack))
            return
        }
        const numericId = Number(currentQueueItem.id)
        dispatch(setCurrentTrack({
            id: Number.isNaN(numericId) ? 0 : numericId,
            title: currentQueueItem.title,
            artist: currentQueueItem.artist ?? '',
            album: currentQueueItem.album ?? '',
            duration: currentQueueItem.duration ?? 0,
            path: currentQueueItem.path,
            cover: currentQueueItem.artwork,
        }))
    }, [currentQueueItem, dispatch, libraryTracks])

    const handlePlay = useCallback(async () => {
        try {
            await TrackPlayer.play()
        } catch (error) {
            console.warn('Unable to play track', error)
        }
    }, [])

    const handlePause = useCallback(async () => {
        try {
            await TrackPlayer.pause()
        } catch (error) {
            console.warn('Unable to pause track', error)
        }
    }, [])

    const handleSkipNext = useCallback(() => {
        dispatch(skipToNext())
    }, [dispatch])

    const handleSkipPrevious = useCallback(() => {
        dispatch(skipToPrevious())
    }, [dispatch])

    const handleToggleShuffle = useCallback(() => {
        dispatch(toggleShuffle())
    }, [dispatch])

    const handleCycleRepeat = useCallback(() => {
        dispatch(cycleRepeatMode())
    }, [dispatch])

    const handleSliderValueChange = useCallback((value: number) => {
        setSliderValue(value)
    }, [])

    const handleSlidingStart = useCallback(() => {
        setIsSeeking(true)
    }, [])

    const handleSlidingComplete = useCallback(
        async (value: number) => {
            setIsSeeking(false)
            try {
                await TrackPlayer.seekTo(value)
                dispatch(setQueuePosition(value))
            } catch (error) {
                console.warn('Unable to seek', error)
            }
        },
        [dispatch],
    )

    useEffect(() => {
        return () => {
            if (currentPlayerState === 'stopped') {
                TrackPlayer.reset()
            }
        }
    }, [currentPlayerState])

    const shuffleActive = playbackMeta.isShuffle
    const repeatMode = playbackMeta.repeatMode
    const repeatIcon = repeatMode === 'track' ? 'repeat-1' : 'repeat'
    const repeatActive = repeatMode !== 'off'

    const leftMeta = currentQueueItem?.artist ?? 'Unknown artist'
    const playingTitle = currentQueueItem?.title ?? 'Nothing playing'

    return (
        <Container>
            <StatusBar hidden />

            <HeaderSection>
                <TouchableOpacity onPress={() => { navigation.goBack() }}>
                    <McImage source={ Images.chevronWhite } />
                </TouchableOpacity>

                <McImage source={ Images.more } />
            </HeaderSection>

            <MusicDetailSection>
                <View style={{ marginHorizontal: 81, marginVertical: 60, borderRadius: 214 }}>
                    { currentQueueItem ? (
                        <CoverImage
                            // @ts-ignore - library expects file path string
                            source={ currentQueueItem.path }
                            placeHolder={ Images.DefaultMusicIcon }
                            width={ 214 }
                            height={ 214 }
                        />
                    ) : (
                        <PlaceholderArtwork>
                            <Icon name='music' size={ 72 } color={ Colors.grey4 } />
                        </PlaceholderArtwork>
                    ) }
                </View>

                <View style={{ marginTop: 16, justifyContent: 'center', alignItems: 'center' }}>
                    <McText semi size={ 24 } color={ Colors.grey5 } align='center'>
                        { playingTitle }
                    </McText>
                    <McText medium size={ 14 } color={ Colors.grey3 } style={{ marginTop: 8 }} align='center'>
                        { leftMeta }
                    </McText>
                </View>
            </MusicDetailSection>

            <SliderSection>
                <Slider
                    minimumTrackTintColor={ Colors.primary }
                    maximumTrackTintColor={ Colors.grey3 }
                    maximumValue={ sliderMax }
                    thumbTintColor={ Colors.primary }
                    value={ sliderValue }
                    minimumValue={ 0 }
                    onValueChange={ handleSliderValueChange }
                    onSlidingStart={ handleSlidingStart }
                    onSlidingComplete={ handleSlidingComplete }
                    disabled={ !currentQueueItem }
                />
                
            </SliderSection>

            <TimeSection>
                <McText size={ 12 } medium color={ Colors.grey4 }>
                    { formatDuration(Math.floor(sliderValue * 1000)) }
                </McText>
                <McText size={ 12 } medium color={ Colors.grey4 }>
                    { formatDuration(totalDurationMs) }
                </McText>
            </TimeSection>

            <ControlSection>
                <IconButton onPress={ handleToggleShuffle } disabled={ !currentQueueItem }>
                    <Icon name='shuffle' size={ 16 } color={ shuffleActive ? Colors.primary : Colors.grey4 } />
                </IconButton>

                <View style={{ width: 231, height: 70, justifyContent: 'center', alignItems: 'center' }}>
                    <View
                        style={{
                            width: 231,
                            height: 54,
                            borderRadius: 54,
                            flexDirection: 'row',
                            backgroundColor: Colors.secondary,
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            opacity: currentQueueItem ? 1 : 0.5,
                        }}
                    >
                        <TouchableOpacity onPress={ handleSkipPrevious } disabled={ !currentQueueItem } style={{ marginLeft: 24 }}>
                            <McImage source={ Images.back } />
                        </TouchableOpacity>

                        <View
                            style={{
                                width: 88,
                                height: 88,
                                borderRadius: 88,
                                backgroundColor: Colors.background,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <PlayButton
                                size={ 70 }
                                circle={ 62.82 }
                                icon={ isPlaying ? Images.pause : Images.play }
                                onPress={ currentQueueItem ? (isPlaying ? handlePause : handlePlay) : undefined }
                            />
                        </View>

                        <TouchableOpacity onPress={ handleSkipNext } disabled={ !currentQueueItem } style={{ marginRight: 24 }}>
                            <McImage source={ Images.next } />
                        </TouchableOpacity>
                    </View>
                </View>

                <IconButton onPress={ handleCycleRepeat } disabled={ !currentQueueItem }>
                    <Icon name={ repeatIcon } size={ 16 } color={ repeatActive ? Colors.primary : Colors.grey4 } />
                </IconButton>
            </ControlSection>

            <LyricsSection>
                <McImage source={ Images.chevronBlueUp } />
                <McText size={ 14 } medium color={ Colors.accent }>Lyrics</McText>
            </LyricsSection>
        </Container>
    )
}

const Container = styled.SafeAreaView`
    flex: 1;
    background-color: ${Colors.background};
`

const HeaderSection = styled.View`
    margin: 12px 24px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`

const MusicDetailSection = styled.View`
    margin: 0px 24px;
    justify-content: center;
    align-items: center;
`

const TimeSection = styled.View`
    margin: 4px 36px;
    padding-right: 4px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`

const ControlSection = styled.View`
    margin: 32px 24px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`

const SliderSection = styled.View`
    margin: 0px 24px;
`

const LyricsSection = styled.View`
    margin: 14px 0px;
    align-items: center;
    justify-content: center;
`

const IconButton = styled(TouchableOpacity)`
    padding: 12px;
`

const PlaceholderArtwork = styled.View`
    width: 214px;
    height: 214px;
    border-radius: 214px;
    background-color: rgba(255, 255, 255, 0.08);
    justify-content: center;
    align-items: center;
`

export default Player
