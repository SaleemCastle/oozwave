import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Image, Pressable, StatusBar, TouchableOpacity, View } from 'react-native'
import Slider from '@react-native-community/slider'
import TrackPlayer, { State, usePlaybackState, useProgress } from 'react-native-track-player'
import Icon from 'react-native-vector-icons/Feather'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
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
import { useDoubleTap } from '../../hooks/useDoubleTap'
import { selectIsFavoriteById, toggleFavorite } from '../../state/favorites'

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
    const isFavorite = useAppSelector(selectIsFavoriteById(currentQueueItem?.id))

    const heartScale = useRef(new Animated.Value(0)).current
    const heartOpacity = useRef(new Animated.Value(0)).current

    const animateHeart = useCallback(() => {
        heartScale.setValue(0.6)
        heartOpacity.setValue(0.0)
        Animated.parallel([
            Animated.timing(heartScale, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
            Animated.timing(heartOpacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start(({ finished }) => {
            if (finished) {
                Animated.timing(heartOpacity, { toValue: 0, delay: 400, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }).start()
            }
        })
    }, [heartOpacity, heartScale])

    const handleToggleFavorite = useCallback(() => {
        if (!currentQueueItem) return
        dispatch(toggleFavorite(String(currentQueueItem.id)))
    }, [dispatch, currentQueueItem])

    const handleArtworkDoubleTap = useDoubleTap({
        onSingle: undefined,
        onDouble: () => {
            handleToggleFavorite()
            animateHeart()
        },
        delay: 250,
    })

    const [sliderValue, setSliderValue] = useState(0)
    const [isSeeking, setIsSeeking] = useState(false)

    const [requestedState, setRequestedState] = useState<null | 'playing' | 'paused'>(null)
    const isPlayingNative = playbackState === State.Playing
    const isPlaying = requestedState ? requestedState === 'playing' : isPlayingNative
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

    // PlayerStateSync already mirrors native playback state to Redux; avoid duplicate dispatches here

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
            setRequestedState('playing')
            await TrackPlayer.play()
        } catch (error) {
            console.warn('Unable to play track', error)
        }
    }, [])

    const handlePause = useCallback(async () => {
        try {
            setRequestedState('paused')
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

    // Clear optimistic state when native playback matches
    useEffect(() => {
        if (!requestedState) return
        if ((requestedState === 'playing' && isPlayingNative) || (requestedState === 'paused' && !isPlayingNative)) {
            setRequestedState(null)
        }
    }, [requestedState, isPlayingNative])

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
                    <Pressable onPress={ handleArtworkDoubleTap }>
                        { currentQueueItem ? (
                            currentQueueItem.artwork ? (
                                <Image
                                    source={{ uri: currentQueueItem.artwork as any }}
                                    style={{ width: 214, height: 214, borderRadius: 8 }}
                                    resizeMode='cover'
                                />
                            ) : (
                                <CoverImage
                                    // Pass device file path so vendor can resolve cached cover
                                    //@ts-ignore
                                    src={ currentQueueItem.path }
                                    placeHolder={ Images.DefaultMusicIcon }
                                    width={ 214 }
                                    height={ 214 }
                                    resizeMode='cover'
                                />
                            )
                        ) : (
                            <PlaceholderArtwork>
                                <Icon name='music' size={ 72 } color={ Colors.grey4 } />
                            </PlaceholderArtwork>
                        ) }
                        {/* Persistent like control at bottom-right */}
                        <View style={{ position: 'absolute', right: 8, bottom: 8 }}>
                            <TouchableOpacity onPress={ handleToggleFavorite } hitSlop={ 12 } accessibilityRole='button' accessibilityLabel={ isFavorite ? 'Remove from favorites' : 'Add to favorites' }>
                                {/* Filled heart with white outline, Airbnb-like */}
                                <View>
                                    <MCIcon name='heart' size={22} color={ isFavorite ? colors.neonMagenta : 'rgba(180,180,180,0.8)' } style={{ position: 'absolute' }} />
                                    <MCIcon name='heart-outline' size={22} color={ '#FFFFFF' } />
                                </View>
                            </TouchableOpacity>
                        </View>
                        {/* Airbnb-like animated heart overlay */}
                        <Animated.View
                            pointerEvents='none'
                            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', opacity: heartOpacity, transform: [{ scale: heartScale }] }}
                        >
                            <MCIcon name='heart' size={ 84 } color={ colors.neonMagenta } />
                        </Animated.View>
                    </Pressable>
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
                        <IconButton onPress={ handleSkipPrevious } disabled={ !currentQueueItem } style={{ marginLeft: 24 }}>
                            <Icon name='skip-back' size={ 16 } color={ Colors.grey4 } />
                        </IconButton>

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
                                icon={ isPlaying ? "pause" : "play" }
                                onPress={ currentQueueItem ? (isPlaying ? handlePause : handlePlay) : undefined }
                            />
                        </View>

                        <IconButton onPress={ handleSkipNext } disabled={ !currentQueueItem } style={{ marginRight: 24 }}>
                            <Icon name='skip-forward' size={ 16 } color={ Colors.grey4 } />
                        </IconButton>
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
