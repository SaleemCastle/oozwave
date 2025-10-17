import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StatusBar, View } from 'react-native'
import MusicFiles, { Constants, ResponseShape, ITrack as DeviceTrack } from 'react-native-get-music-files-v3dev-test'
import styled from 'styled-components/native'

import { Colors, Images } from '../../Constants'
import { McText, McImage, PlayButton } from '../../Components'
import TrackPlayer, { AppKilledPlaybackBehavior, Capability } from 'react-native-track-player'
import { checkPermissions } from '../../services/requestPermissions'
import { OnboardingProps, PermissionStatus } from '../../types'
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { addTracks, addTracksError } from '../../Store/Actions/tracks.actions'
import { ADD_TRACKS_ERROR } from '../../Store/ReduxConstants'
import { RootState } from '../../Store/store'

const SCAN_REQUEST_DELAY_MS = 100
 
const Onboarding = ({ navigation }: OnboardingProps) => {
    const dispatch = useAppDispatch()
    const permission = useAppSelector((state: RootState) => state.permission)

    const [isScanning, setIsScanning] = useState(false)
    const [scanProgress, setScanProgress] = useState(0)
    const [statusMessage, setStatusMessage] = useState('')
    const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null)

    const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const scanRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        TrackPlayer.updateOptions({
            android: {
                appKilledPlaybackBehavior:
                AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
            },
            capabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
                Capability.SkipToPrevious,
                Capability.SeekTo,
            ],
            compactCapabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
            ],
            progressUpdateEventInterval: 1,
        })
    }, [])
    
    useEffect(() => {
        checkPermissions()
    }, [])

    const clearProgressTimer = useCallback(() => {
        if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current)
            progressTimerRef.current = null
        }
    }, [])

    const clearNavigateTimer = useCallback(() => {
        if (navigateTimeoutRef.current) {
            clearTimeout(navigateTimeoutRef.current)
            navigateTimeoutRef.current = null
        }
    }, [])

    const clearScanRequestTimer = useCallback(() => {
        if (scanRequestTimeoutRef.current) {
            clearTimeout(scanRequestTimeoutRef.current)
            scanRequestTimeoutRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => {
            clearProgressTimer()
            clearNavigateTimer()
            clearScanRequestTimer()
        }
    }, [clearProgressTimer, clearNavigateTimer, clearScanRequestTimer])

    const beginProgressLoop = useCallback(() => {
        clearProgressTimer()

        progressTimerRef.current = setInterval(() => {
            setScanProgress((current) => {
                if (current >= 90) {
                    return current
                }

                const increment = Math.max(1, Math.round(Math.random() * 6))
                return Math.min(current + increment, 90)
            })
        }, 250)
    }, [clearProgressTimer])

    const finishScan = useCallback((isSuccessful: boolean, message: string) => {
        clearProgressTimer()
        clearScanRequestTimer()
        setScanProgress(100)
        setIsScanning(false)
        setStatusMessage(message)
        setScanResult(isSuccessful ? 'success' : 'error')

        clearNavigateTimer()

        if (isSuccessful) {
            navigateTimeoutRef.current = setTimeout(() => {
                navigation.navigate('Library')
            }, 1800)
        }
    }, [clearNavigateTimer, clearProgressTimer, clearScanRequestTimer, navigation])

    const handleScanError = useCallback((error: unknown) => {
        console.warn(error)
        dispatch(addTracks([]))

        const err = error as Error
        const message = err?.message ?? 'Unable to complete the scan.'

        const errorPayload: Error = { name: ADD_TRACKS_ERROR, message }
        dispatch(addTracksError(errorPayload))

        finishScan(false, 'Something went wrong while scanning. Please try again.')
    }, [dispatch, finishScan])

    const handleScanSuccess = useCallback((tracks: ResponseShape<DeviceTrack>) => {
        const totalResults = tracks.results.length
        console.log('Music scan results (raw):', tracks.length, totalResults)
        console.log('Sample track paths:', tracks.results.slice(0, 5).map((track) => track.path))

        const filteredTracks = tracks.results.filter((track) => {
            const title = (track.title ?? '').trim().toUpperCase()
            const album = (track.album ?? '').trim().toLowerCase()
            const rawPath = track.path ?? ''
            const normalisedPath = rawPath.replace(/\//g, '/').toLowerCase();

            let decodedPath = normalisedPath
            try {
                decodedPath = decodeURIComponent(normalisedPath)
            } catch (error) {
                // ignore malformed URI sequences
            }

            const isInMusicFolder = normalisedPath.includes('/music/') || decodedPath.includes('/music/')
            const matchesWhatsAppAlbum = album === 'whatsapp audio'
            const matchesWhatsAppTitle = title.startsWith('AUD-') || title.startsWith('PTT-')
            const whatsappIndicators = [
                '/whatsapp audio/',
                '/whatsapp voice notes/',
                '/whatsapp documents/',
                '/whatsapp/',
                'com.whatsapp',
            ]
            const matchesWhatsAppPath = whatsappIndicators.some((indicator) => normalisedPath.includes(indicator) || decodedPath.includes(indicator))

            if (isInMusicFolder) {
                return true
            }

            return !(matchesWhatsAppPath || (matchesWhatsAppAlbum && matchesWhatsAppTitle))
        })

        console.log('Tracks returned by scan:', filteredTracks.length)
        dispatch(addTracks(filteredTracks))

        if (filteredTracks.length === 0) {
            finishScan(false, 'No matching tracks found. Make sure your music is at least 60 seconds long and stored in the Music folder.')
            return
        }

        finishScan(true, `${filteredTracks.length} tracks ready. Launching your library...`)
    }, [dispatch, finishScan])

    const handleScanPress = useCallback(() => {
        if (isScanning) {
            return
        }

        if (permission.permission !== PermissionStatus.GRANTED) {
            setStatusMessage('We need storage access to scan for music. Please grant permission when prompted.')
            checkPermissions()
            return
        }

        setScanResult(null)
        setStatusMessage('Scanning your device for music...')
        setScanProgress(0)
        setIsScanning(true)

        beginProgressLoop()
        clearScanRequestTimer()

        scanRequestTimeoutRef.current = setTimeout(() => {
            MusicFiles.getAll({
                batchSize: 5000,
                batchNumber: 0,
                minimumSongDuration: 60 * 1000,
                sortBy: Constants.SortBy.Title.toString(),
                sortOrder: Constants.SortOrder.Ascending.toString(),
            })
                .then(handleScanSuccess)
                .catch(handleScanError)
        }, SCAN_REQUEST_DELAY_MS)
    }, [beginProgressLoop, clearScanRequestTimer, handleScanError, handleScanSuccess, isScanning, permission.permission])

    return (
        <Container>
            <StatusBar hidden />

            <McImage source={ Images.logo } />
            <McText color={ Colors.primary } size={ 24 } black style={{ marginTop: 28 }}>The sound of life</McText>

            <McText color={ Colors.grey4 } size={ 14 } medium align='center' style={{ marginHorizontal: 51, marginTop: 8 }}>
                Music is not an entertainment, but also it is our life
            </McText>

            <McText color={ Colors.grey4 } size={ 14 } align='center' style={{ marginHorizontal: 40, marginTop: 32 }}>
                Tap the button below to grant access and let Oozwave scan your device for music files.
            </McText>

            <View style={{ marginTop: 48, alignItems: 'center' }}>
                {
                    isScanning
                        ? (
                            <ScanStatusContainer>
                                <McText medium size={ 16 } color={ Colors.primary } align='center'>
                                    { statusMessage }
                                </McText>
                                <ProgressBar>
                                    <ProgressFill style={{ width: `${scanProgress}%` }} />
                                </ProgressBar>
                                <McText size={ 12 } color={ Colors.grey4 }>{ `${scanProgress}% complete` }</McText>
                            </ScanStatusContainer>
                        )
                        : (
                            <PlayButton
                                size={ 78 }
                                circle={ 70 }
                                icon={ Images.arrowRight }
                                onPress={ handleScanPress }
                            />
                        )
                }
            </View>

            {
                !isScanning && statusMessage.length > 0 && (
                    <ResultMessage>
                        <McText
                            medium
                            size={ 14 }
                            color={ scanResult === null ? Colors.grey4 : scanResult === 'success' ? Colors.accent : Colors.error }
                            align='center'
                        >
                            { statusMessage }
                        </McText>
                    </ResultMessage>
                )
            }
        </Container>
    )
}

const Container = styled.SafeAreaView`
    flex: 1;
    background-color: ${ Colors.background };
    justify-content: center;
    align-items: center;
`

const ProgressBar = styled.View`
    width: 220px;
    height: 8px;
    background-color: ${ Colors.grey1 };
    border-radius: 4px;
    margin: 16px 0 8px;
    overflow: hidden;
`

const ProgressFill = styled.View`
    height: 100%;
    background-color: ${ Colors.primary };
`

const ScanStatusContainer = styled.View`
    align-items: center;
    justify-content: center;
    width: 260px;
`

const ResultMessage = styled.View`
    margin-top: 24px;
    padding: 12px 24px;
    background-color: rgba(255, 255, 255, 0.08);
    border-radius: 24px;
`

export default Onboarding








