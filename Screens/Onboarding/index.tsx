import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StatusBar, View, InteractionManager } from 'react-native'
import MusicFiles, { Constants, ResponseShape, ITrack as DeviceTrack } from 'react-native-get-music-files-v3dev-test'
import styled from 'styled-components/native'

import { Colors, Images } from '../../Constants'
import { McText, McImage, PlayButton } from '../../Components'
import WaveformLoader from '../../Components/shared/WaveformLoader'
// TrackPlayer options are configured globally; no direct import needed here
import { checkPermissions } from '../../services/requestPermissions'
import { OnboardingProps, PermissionStatus } from '../../types'
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { addTracks, addTracksError } from '../../Store/Actions/tracks.actions'
import { ADD_TRACKS_ERROR } from '../../Store/ReduxConstants'
import { RootState } from '../../Store/store'

const SCAN_REQUEST_DELAY_MS = 50
const PAGE_SIZE = 2000
const CHUNK = 500
const SLEEP = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
 
const Onboarding = ({ navigation }: OnboardingProps) => {
    const dispatch = useAppDispatch()
    const permission = useAppSelector((state: RootState) => state.permission)
    const storedTracks = useAppSelector((state: RootState) => state.tracks)
    const hasStoredTracks = useMemo(() => {
        if (!Array.isArray(storedTracks)) return false
        return storedTracks.some((track: any) => typeof track?.path === 'string' && track.path.length > 0)
    }, [storedTracks])

    const [isLoading, setIsLoading] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null)

    const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const scanRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const didAutoRedirectRef = useRef(false)

    // Player options configured globally in App.tsx
    
    useEffect(() => {
        checkPermissions()
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
            clearNavigateTimer()
            clearScanRequestTimer()
        }
    }, [clearNavigateTimer, clearScanRequestTimer])

    // Auto-skip onboarding when tracks already exist
    useEffect(() => {
        if (didAutoRedirectRef.current) return
        if (hasStoredTracks) {
            didAutoRedirectRef.current = true
            setStatusMessage('Launching your library...')
            setScanResult('success')
            // Defer until after interactions to ensure nav is ready
            InteractionManager.runAfterInteractions(() => {
                clearNavigateTimer()
                navigateTimeoutRef.current = setTimeout(() => {
                    try {
                        if (typeof navigation.replace === 'function') {
                            navigation.replace('Library')
                        } else {
                            navigation.reset({ index: 0, routes: [{ name: 'Library' as never }] })
                        }
                    } catch (e) {
                        // ignore navigation failures
                    }
                }, 200)
            })
        }
    }, [clearNavigateTimer, hasStoredTracks, navigation])

    const finishScan = useCallback(async (isSuccessful: boolean, message: string) => {
        clearScanRequestTimer()

        // Now show completion state/message and proceed
        setIsLoading(false)
        setStatusMessage(message)
        setScanResult(isSuccessful ? 'success' : 'error')

        clearNavigateTimer()

        if (isSuccessful) {
            navigateTimeoutRef.current = setTimeout(() => {
                // Replace the stack so Onboarding isn't on back stack
                if (typeof navigation.replace === 'function') {
                    navigation.replace('Library')
                } else {
                    navigation.reset({ index: 0, routes: [{ name: 'Library' as never }] })
                }
            }, 1200)
        }
    }, [clearNavigateTimer, clearScanRequestTimer, navigation])

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
        
        dispatch(addTracks(filteredTracks))

        if (filteredTracks.length === 0) {
            finishScan(false, 'No matching tracks found. Make sure your music is at least 60 seconds long and stored in the Music folder.')
            return
        }

        finishScan(true, `${filteredTracks.length} tracks ready. Launching your library...`)
    }, [dispatch, finishScan])

    const startScanAfterPaint = useCallback(() => new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            InteractionManager.runAfterInteractions(() => resolve())
        })
    }), [])

    const safeTrackFilter = useCallback((track: DeviceTrack) => {
        const title = (track.title ?? '').trim().toUpperCase()
        const album = (track.album ?? '').trim().toLowerCase()
        const rawPath = track.path ?? ''
        const normalizedPath = rawPath.replace(/\\/g, '/').toLowerCase()

        let decoded = normalizedPath
        try { decoded = decodeURIComponent(normalizedPath) } catch {}

        const isInMusicFolder = normalizedPath.includes('/music/') || decoded.includes('/music/')
        if (isInMusicFolder) return true

        const isWhatsAppAlbum = album === 'whatsapp audio'
        const isWhatsAppTitle = title.startsWith('AUD-') || title.startsWith('PTT-')
        const whatsappHints = [
            '/whatsapp audio/', '/whatsapp voice notes/', '/whatsapp documents/', '/whatsapp/', 'com.whatsapp',
        ]
        const isWhatsAppPath = whatsappHints.some((h) => normalizedPath.includes(h) || decoded.includes(h))

        return !(isWhatsAppPath || (isWhatsAppAlbum && isWhatsAppTitle))
    }, [])

    const scanInBatches = useCallback(async () => {
        const all: DeviceTrack[] = []
        const seen = new Set<number | string>()
        let page = 0
        let lastUiUpdate = 0

        while (true) {
            const resp = await MusicFiles.getAll({
                // Fetch embedded covers at higher quality to prevent pixelation in Player
                cover: true,
                coverQuality: 80,
                batchSize: PAGE_SIZE,
                batchNumber: page,
                minimumSongDuration: 60 * 1000,
                sortBy: Constants.SortBy.Title.toString(),
                sortOrder: Constants.SortOrder.Ascending.toString(),
            })
            const results = resp?.results ?? []
            if (!results.length) break

            let addedThisPage = 0
            for (let i = 0; i < results.length; i += CHUNK) {
                const slice = results.slice(i, i + CHUNK)
                const filtered = slice.filter((t) => {
                    const id = (t as any).id ?? `${t.title}-${t.path}`
                    if (seen.has(id)) return false
                    const keep = safeTrackFilter(t)
                    if (keep) {
                        seen.add(id)
                    }
                    return keep
                })
                if (filtered.length) {
                    all.push(...filtered)
                    addedThisPage += filtered.length
                }
                const now = Date.now()
                if (now - lastUiUpdate > 300) {
                    setStatusMessage(`Scanning… ${all.length.toLocaleString()} tracks found`)
                    lastUiUpdate = now
                }
                await SLEEP(0)
            }

            page += 1
            if (addedThisPage === 0 || results.length < PAGE_SIZE) {
                break
            }
        }
        return all
    }, [safeTrackFilter])

    const handleScanPress = useCallback(async () => {
        if (isLoading) {
            return
        }

        if (hasStoredTracks) {
            setStatusMessage('Launching your library...')
            setScanResult('success')
            InteractionManager.runAfterInteractions(() => {
                try {
                    if (typeof navigation.replace === 'function') {
                        navigation.replace('Library')
                    } else {
                        navigation.reset({ index: 0, routes: [{ name: 'Library' as never }] })
                    }
                } catch {}
            })
            return
        }

        if (permission.permission !== PermissionStatus.GRANTED) {
            setStatusMessage('We need storage access to scan for music. Please grant permission when prompted.')
            checkPermissions()
            return
        }

        setScanResult(null)
        setStatusMessage('Preparing scan...')
        setIsLoading(true)
        clearScanRequestTimer()

        try {
            await startScanAfterPaint()
            const tracks = await scanInBatches()

            if (tracks.length === 0) {
                finishScan(false, 'No matching tracks found. Make sure your music is at least 60 seconds long and stored in the Music folder.')
                return
            }

            dispatch(addTracks(tracks))
            finishScan(true, `${tracks.length} tracks ready. Launching your library...`)
        } catch (err) {
            handleScanError(err)
        }
    }, [clearScanRequestTimer, dispatch, finishScan, handleScanError, hasStoredTracks, isLoading, navigation, permission.permission, scanInBatches, startScanAfterPaint])

    return (
        <Container>
            <StatusBar hidden />

            <McImage source={ Images.logo } />
            <McText color={ Colors.primary } size={ 24 } black style={{ marginTop: 28 }}>The sound of life</McText>

            <McText color={ Colors.grey4 } size={ 14 } medium align='center' style={{ marginHorizontal: 51, marginTop: 8 }}>
                Music is not an entertainment, but also it is our life
            </McText>

            <McText regular color={ Colors.grey4 } size={ 14 } align='center' style={{ marginHorizontal: 40, marginTop: 32 }}>
                Tap the button below to grant access and let Oozwave scan your device for music files.
            </McText>

            <View style={{ marginTop: 48, alignItems: 'center' }}>
                {
                    isLoading
                        ? (
                            <ScanStatusContainer>
                                <McText medium size={ 16 } color={ Colors.primary } align='center'>
                                    { statusMessage }
                                </McText>
                                <View style={{ width: '100%', marginTop: 12 }}>
                                    <WaveformLoader height={ 56 } />
                                </View>
                            </ScanStatusContainer>
                        )
                        : (
                            <PlayButton
                                size={ 78 }
                                circle={ 70 }
                                icon={ "play" }
                                onPress={ handleScanPress }
                            />
                        )
                }
            </View>

            {
                !isLoading && statusMessage.length > 0 && (
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

// Progress bar removed in favor of a music-inspired loader

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








    // Reanimated overlay state (UI-thread). Always mounted; opacity is animated.
