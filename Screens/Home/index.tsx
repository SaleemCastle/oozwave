import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { 
    StatusBar, 
    View,
    TouchableWithoutFeedback,
    FlatList,
    ScrollView,
    TextInput,
    Pressable,
    Animated,
    Alert,
    DeviceEventEmitter,
    Easing,
    StyleSheet, 
} from 'react-native'
import { useColorScheme } from 'react-native'
import styled from 'styled-components/native'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'
import TrackPlayer, { State, useProgress } from 'react-native-track-player'
import { Vibration } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlingGestureHandler, Directions, State as GHState } from 'react-native-gesture-handler'

import BottomBar from './BottomBar'


import { Colors, Images, Metrics } from '../../Constants'
import { dummyData } from '../../Mock'
import { setCurrentTrack, ITrack } from '../../Store/Actions/currentTrack.actions'
import { McText, McImage, PlayButton, McVectorIcon } from '../../Components'
import MarqueeText from '../../Components/shared/MarqueeText'
import AppDrawer, { DrawerOption } from '../../Components/AppDrawer'
import { styles } from './styles';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { IDummyPlaylist } from '../../Mock/Dummy'
import { RootState } from '../../Store/store'
import DiscoverCard from '../../Components/DiscoverCard'
import { setCurrentPlayerState } from '../../Store/Actions/playerState.actions'
import TrackCarousel from '../../Components/TrackCarousel'
import { playTracksNow, skipToNext, skipToPrevious } from '../../state/playerQueue'
import { trackToQueueItem, queueItemToITrack } from '../../state/playerQueue/utils'
import { colors } from '../../theme/tokens'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { toggleFavorite } from '../../state/favorites'
// import { Easing } from 'react-native-reanimated'

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppTabParamList } from '../../Navigation/AppTabs'
import type { RootStackParamList } from '../../types'
import { selectMiniPlayerPlacement, selectSettings } from '../../state/settings'
import { selectPlayCounts } from '../../state/plays'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'

export type HomeProps = CompositeScreenProps<BottomTabScreenProps<AppTabParamList, 'Home'>, NativeStackScreenProps<RootStackParamList>> 
interface DrawerToggleButtonProps {
    progress: Animated.Value
    isOpen: boolean
    onPress: () => void
}



const DrawerToggleButton: React.FC<DrawerToggleButtonProps> = ({ progress, isOpen, onPress }) => {
    const topLineStyle = {
        transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) },
            { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) },
        ],
    }

    const middleLineStyle = {
        opacity: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] }),
    }

    const bottomLineStyle = {
        transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
            { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-45deg'] }) },
        ],
    }

    return (
        <Pressable
            accessibilityRole='button'
            accessibilityLabel={ isOpen ? 'Close menu' : 'Open menu' }
            onPress={ onPress }
            hitSlop={ 12 }
            style={ toggleStyles.wrapper }
        >
            <Animated.View style={[toggleStyles.line, topLineStyle]} />
            <Animated.View style={[toggleStyles.line, middleLineStyle]} />
            <Animated.View style={[toggleStyles.line, bottomLineStyle]} />
        </Pressable>
    )
}


const Home = ({ navigation }: HomeProps) => {
    const tracks: ITrack[] = useAppSelector((state) => state.tracks)
    const playerState = useAppSelector((state) => state.currentPlayerState.playerState)
    const currentTrack = useAppSelector((state) => state.currentTrack)
    const permission = useAppSelector((state: RootState) => state.permission)
    const dispatch = useAppDispatch()
    const placement = useAppSelector(selectMiniPlayerPlacement)
    const { theme } = useAppSelector(selectSettings)
    const settingsAll = useAppSelector(selectSettings)
    const insets = useSafeAreaInsets()
    const tabBarHeight = useBottomTabBarHeight()
    const hapticsEnabled = useAppSelector((s) => (s as any).settings?.haptics as boolean)
    const normalizeVolume = useAppSelector((s) => (s as any).settings?.normalizeVolume as boolean)
    const scheme = useColorScheme()
    const isDark = theme === 'system' ? scheme === 'dark' : theme === 'dark'
    const containerBg = isDark ? Colors.background : Colors.white
    const favoriteIds = useAppSelector((s) => (s as any).favorites?.ids as string[] || [])
    const playCounts = useAppSelector(selectPlayCounts)
    const isMiniFavorite = currentTrack ? favoriteIds.includes(String(currentTrack.id)) : false
    let isPlaying = playerState === State.Playing.toString()
    const progress = useProgress(1)
    const coverTranslate = useRef(new Animated.Value(0)).current
    const coverOpacity = useRef(new Animated.Value(1)).current
    const lastSwipeDir = useRef<'left' | 'right' | null>(null)

    // Queue state for optimistic UI update
    const queue = useAppSelector((s) => (s as any).playerQueue?.queue as any[] || [])
    const queueIndex = useAppSelector((s) => (s as any).playerQueue?.currentIndex as number)
    const repeatMode = useAppSelector((s) => (s as any).playerQueue?.repeatMode as 'off' | 'queue' | 'track')
    const canSwipe = queue.length > 1

    const triggerSwipe = useCallback((dir: 'left' | 'right') => {
        if (!canSwipe) return
        lastSwipeDir.current = dir
        const outTo = dir === 'left' ? -50 : 50
        Animated.parallel([
            Animated.timing(coverTranslate, { toValue: outTo, duration: 110, useNativeDriver: true }),
            Animated.timing(coverOpacity, { toValue: 0, duration: 110, useNativeDriver: true }),
        ]).start()

        // Optimistically update cover art for snappier feel
        try {
            let nextIdx = queueIndex
            if (dir === 'right') {
                nextIdx = queueIndex < queue.length - 1 ? queueIndex + 1 : (repeatMode === 'queue' ? 0 : queueIndex)
            } else {
                nextIdx = queueIndex > 0 ? queueIndex - 1 : (repeatMode === 'queue' ? Math.max(0, queue.length - 1) : queueIndex)
            }
            const item = queue[nextIdx]
            if (item) {
                // @ts-ignore
                dispatch(setCurrentTrack(queueItemToITrack(item)))
            }
        } catch {}

        if (dir === 'left') {
            // @ts-ignore
            dispatch(skipToPrevious())
        } else {
            // @ts-ignore
            dispatch(skipToNext())
        }
    }, [queue, queueIndex, repeatMode, dispatch, coverTranslate, coverOpacity, canSwipe])

    useEffect(() => {
        if (!lastSwipeDir.current) return
        coverTranslate.setValue(lastSwipeDir.current === 'left' ? -50 : 50)
        coverOpacity.setValue(0)
        Animated.parallel([
            Animated.timing(coverTranslate, { toValue: 0, duration: 160, useNativeDriver: true }),
            Animated.timing(coverOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        ]).start(() => { lastSwipeDir.current = null })
    }, [currentTrack?.id])

    // If only one track, ensure cover is fully visible and no stale animation state
    useEffect(() => {
        if (!canSwipe) {
            coverTranslate.setValue(0)
            coverOpacity.setValue(1)
            lastSwipeDir.current = null
        }
    }, [canSwipe, coverTranslate, coverOpacity])

    const DiscoverCardMemoized = memo(DiscoverCard)

    const animation = new Animated.Value((progress.position / progress.duration) * 100)
    const inputRange = [0, 100]
    const outputRange = ["0%", "100%"]
    const animatedWidth = animation.interpolate({ inputRange, outputRange })

    const drawerProgress = useRef(new Animated.Value(0)).current
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [drawerMounted, setDrawerMounted] = useState(false)

    const drawerOptions = useMemo<DrawerOption[]>(() => [
        { id: 'personalize', label: 'personalize', icon: 'star', accentColor: Colors.primary, onPress: () => Alert.alert('Personalize', 'Tailor your dashboard soon!') },
        { id: 'preferences', label: 'preferences', icon: 'settings', accentColor: Colors.accent, onPress: () => navigation.navigate('Preferences') },
        { id: 'playlists', label: 'playlists', icon: 'list', accentColor: Colors.white, onPress: () => navigation.navigate('Playlists') },
        { id: 'equalizer', label: 'equalizer', icon: 'sliders', accentColor: Colors.primary, onPress: () => navigation.navigate('Equalizer') },
        { id: 'downloads', label: 'downloads', icon: 'download-cloud', accentColor: Colors.accent, onPress: () => Alert.alert('Downloads', 'Offline downloads coming soon!') },
        { id: 'support', label: 'support', icon: 'message-circle', accentColor: Colors.white, onPress: () => Alert.alert('Support', 'We\'re here to help!') },
    ], [])

    const openDrawer = useCallback(() => {
        setDrawerOpen(true)
        setDrawerMounted(true)
        Animated.timing(drawerProgress, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start()
    }, [drawerProgress])

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false)
        Animated.timing(drawerProgress, {
            toValue: 0,
            duration: 220,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                setDrawerMounted(false)
            }
        })
    }, [drawerProgress])

    // Sync drawer state with a global channel so the tabs container can handle back presses
    useEffect(() => {
        DeviceEventEmitter.emit('homeDrawerOpen', drawerOpen)
    }, [drawerOpen])

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('homeDrawerRequestClose', () => {
            if (drawerOpen) {
                closeDrawer()
            }
        })
        return () => sub.remove()
    }, [drawerOpen, closeDrawer])

    const toggleDrawer = useCallback(() => {
        if (drawerOpen) {
            closeDrawer()
        } else {
            openDrawer()
        }
    }, [closeDrawer, drawerOpen, openDrawer])

    const handleMiniPlayer = useCallback(async () => {
        if (hapticsEnabled) {
            Vibration.vibrate(10)
        }
        if (isPlaying) {
            await TrackPlayer.pause()
        } else {
            if (normalizeVolume) {
                try { await TrackPlayer.setVolume(0.9) } catch {}
            }
            await TrackPlayer.play()
        }
    }, [hapticsEnabled, isPlaying, normalizeVolume])

    const getPlayerState = useCallback(async () => {
        const state = (await TrackPlayer.getState()).toString()
        dispatch(setCurrentPlayerState(state))
        isPlaying = state === State.Playing.toString()
    }, [dispatch, isPlaying])

    useEffect(() => {
        getPlayerState()
    })

    const navToPlayer = useCallback((selectedTrack: ITrack) => {
        const queueItem = trackToQueueItem(selectedTrack)
        if (!queueItem) {
            Alert.alert('Unable to play', 'Track data is missing a valid file path.')
            return
        }
        dispatch(playTracksNow([queueItem]))
        navigation.navigate('Player')
    }, [dispatch, navigation])

    const curatedTracks = useMemo(() => {
        const list = [...tracks]
        const sort = (settingsAll as any)?.homeTracksSort ?? 'mostPlayed'
        switch (sort) {
            case 'favorites': {
                const favSet = new Set(favoriteIds.map(String))
                return list.filter((t) => favSet.has(String(t.id))).slice(0, 7)
            }
            case 'duration':
                return list.sort((a, b) => (b.duration || 0) - (a.duration || 0)).slice(0, 7)
            case 'recentlyAdded':
                return list.sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 7)
            case 'mostPlayed':
            default:
                return list
                    .sort((a, b) => ((playCounts[String(b.id)] || 0) - (playCounts[String(a.id)] || 0)))
                    .slice(0, 7)
        }
    }, [tracks, favoriteIds, playCounts, settingsAll])



    const _renderItem = useCallback(({item, index}: { item: IDummyPlaylist , index: number }) => {
        return (
            <Pressable 
                style={{
                    marginTop: 16,
                    marginLeft: index === 0 ? 24 : 0,
                    marginRight: index === dummyData.Playlists.length - 1 ? 0 : 24
                }}
                onPress={() => Alert.alert('This is ' + item.name)}
            >

                <McImage source={ item.thumbnail } key={ index } style={{ marginBottom: 12 }}/>

                <McText semi size={ 16 } color={ Colors.grey5 }>{ item.name }</McText>

                <McText 
                    medium 
                    size={ 12 } 
                    color={ Colors.grey3 }
                    style={{ marginTop: 4 }}
                >
                    { item.songs } { `song${item.songs > 1 ? 's' : ''}` }
                </McText>
            </Pressable>
        )
    }, [])
    const _rederDiscoverCards = useCallback(({item, index}: { item: any , index: number }) => {
        return (
            <DiscoverCardMemoized 
                cover={ item.cover } 
                key={ index } 
                title={ item.title } 
                id={ item.id } 
                bg={ item.bg } 
                onPress={ () => navigation.navigate('Billboards', { info: {  title: item.title } }) }
            />
        )
    }, [])


    const cards = [
        {
            id: 1,
            cover: Images.SampleDiscoverArt,
            title: 'Artist 100',
            bg: Colors.primary
        },
        {
            id: 2,
            cover: Images.SampleDiscoverArt2,
            title: 'Hot 100',
            bg: Colors.accent
        },
        {
            id: 3,
            cover: Images.SampleDiscoverArt2,
            title: 'Billboard 200',
            bg: Colors.white
        },
        {
            id: 14,
            cover: Images.SampleDiscoverArt,
            title: 'kpop 100',
            bg: Colors.green300
        },
    ]

    return (
        <Container bg={ containerBg }>
            <ScrollView showsVerticalScrollIndicator={ false }>

                <StatusBar hidden />
                <HeaderRow>
                    <McText extra size={ 24 } color={ Colors.primary }>
                        Good evening
                    </McText>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Pressable accessibilityRole='button' accessibilityLabel='Open favorites' onPress={() => navigation.navigate('Library', { screen: 'Favorites' } as any)} style={{ marginRight: 8 }} hitSlop={12}>
                            <MCIcon name='heart' size={22} color={ colors.neonMagenta } />
                        </Pressable>
                        <DrawerToggleButton
                            progress={ drawerProgress }
                            isOpen={ drawerOpen }
                            onPress={ toggleDrawer }
                        />
                    </View>
                </HeaderRow>
                <SearchSection>
                    <McImage 
                        source={ Images.search } 
                        style={{ marginLeft: 16, marginRight: 12 }}  
                    />
                    <TextInput 
                        placeholder='Song or Artist' 
                        placeholderTextColor={ Colors.grey3 } 
                        style={{
                            color: Colors.grey4
                        }}  
                    />
                </SearchSection>

                <TitleSection>
                    <McText medium size={ 20 } color={ Colors.grey4 }>Discover</McText>
                    <TouchableWithoutFeedback onPress={() => navigation.navigate('Discover')}>
                        <McImage source={ Images.chevronBlue } />
                    </TouchableWithoutFeedback>
                </TitleSection>

                <View>
                    <FlatList 
                        keyExtractor={ (item) => 'playlist_' + item.id }
                        horizontal
                        showsHorizontalScrollIndicator={ false }
                        contentContainerStyle={{}}
                        data={ dummyData.Playlists }
                        renderItem={ _renderItem }
                    />
                </View>

                <TitleSection>
                    <McText medium size={ 20 } color={ Colors.grey4 }>Charts</McText>
                    <TouchableWithoutFeedback>
                        <McImage source={ Images.chevronBlue } />
                    </TouchableWithoutFeedback>
                </TitleSection>

                <FlatList 
                    keyExtractor={ (item) => 'discover' + item.id }
                    horizontal
                    showsHorizontalScrollIndicator={ false }
                    contentContainerStyle={{
                        // flex: 1,
                        paddingLeft: 24,
                        justifyContent: 'space-between'
                    }} 
                    data={ cards }
                    renderItem={ _rederDiscoverCards }
                />

                <TitleSection>
                    <McText medium size={ 20 } color={ Colors.grey4 }>My Tracks</McText>

                    <TouchableWithoutFeedback onPress={() => navigation.navigate('Library', { screen: 'LibraryTab', params: { initialSection: 'Songs' } } as any)}>
                        <McImage source={ Images.chevronBlue } />
                    </TouchableWithoutFeedback>
                </TitleSection>

                <View style={{marginTop: 16 }}>
                    {
                        !tracks.length 
                        ?
                        <McText>Error Loading Tracks</McText>
                        :
                        <TrackCarousel tracks={ curatedTracks } handleNavigationToPlayer={ navToPlayer }/>
                    }
                </View>
            </ScrollView> 

            { drawerMounted && (

                <AppDrawer

                    visible={ drawerMounted }

                    progress={ drawerProgress }

                    onClose={ closeDrawer }

                    options={ drawerOptions }

                />

            ) }

            { currentTrack?.title && placement !== 'mergeWithTabBar' ? (
                <BottomSection style={{ bottom: placement === 'replaceTabBar' ? insets.bottom + 12 : insets.bottom + Math.max(72, tabBarHeight + 24) }}>
                    <BottomBar>
                        <Animated.View style={{height: '100%', width: animatedWidth, backgroundColor: Colors.background, position: 'absolute', opacity: 0.3}}/>
                            <FlingGestureHandler
                                enabled={canSwipe}
                                direction={Directions.LEFT}
                                onHandlerStateChange={({ nativeEvent }) => { if (nativeEvent.state === GHState.END) triggerSwipe('left') }}
                            >
                                <FlingGestureHandler
                                    enabled={canSwipe}
                                    direction={Directions.RIGHT}
                                    onHandlerStateChange={({ nativeEvent }) => { if (nativeEvent.state === GHState.END) triggerSwipe('right') }}
                                >
                                    <Pressable style={styles.playerContainer} onPress={() => navigation.navigate('Player')}
                                        onLongPress={() => { if (currentTrack) dispatch(toggleFavorite(String(currentTrack.id))) }}>
                                <View style={{
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flex:
                                        1
                                }}>
                                    <Animated.View style={{ transform: [{ translateX: coverTranslate }], opacity: coverOpacity }}>
                                        <CoverImage
                                            src={currentTrack?.path}
                                            placeHolder={Images.DefaultMusicIcon}
                                            width={38}
                                            height={38}
                                            style={{ borderRadius: 19 }}
                                        />
                                    </Animated.View>
                                    <View style={{ marginLeft: 12, maxWidth: '75%', width: '75%' }}>
                                        <MarqueeText containerStyle={{ width: '100%' }} text={currentTrack.title} bold
                                            size={12} color={Colors.grey5} />
                                        <McText medium size={12} color={Colors.grey3} style={{ marginTop: 4 }}
                                            numberOfLines={1}>{currentTrack?.artist}</McText>
                                    </View>
                                </View>
                                <Pressable onPress={() => {
                                    if (currentTrack)
                                        dispatch(toggleFavorite(String(currentTrack.id)))
                                }} hitSlop={12} style={{
                                    marginHorizontal:
                                        8
                                }} accessibilityRole='button' accessibilityLabel={isMiniFavorite ? 'Remove from favorites' :
                                    'Add to favorites'}>
                                    <View>
                                        <MCIcon name='heart' size={20} color={isMiniFavorite ? colors.neonMagenta :
                                            'rgba(180,180,180,0.8)'} style={{ position: 'absolute' }} />
                                        <MCIcon name='heart-outline' size={20} color={'#FFFFFF'} />
                                    </View>
                                </Pressable>
                                <PlayButton iconSize={20} size={46} circle={41.28} icon={isPlaying ? 'pause' : 'play'}
                                    onPress={handleMiniPlayer} />
                            </Pressable>
                                </FlingGestureHandler>
                            </FlingGestureHandler>
                    </BottomBar>
                </BottomSection>
            ) : null }
        </Container> 
    )
}

const toggleStyles = StyleSheet.create({
    wrapper: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    line: {
        position: 'absolute',
        width: 24,
        height: 2,
        borderRadius: 1,
        backgroundColor: colors.neonMagenta,
    },
})

const HeaderRow = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin: 12px ${Metrics.padding}px 0;
`;

const Container = styled.SafeAreaView<{ bg: string}>`
    flex: 1;
    background-color: ${props => props.bg};
`

const SearchSection = styled.View`
    width: 90%;
    height: 52px;
    border-radius: 30px;
    background-color: ${Colors.secondary};
    margin: 20px 24px 0px;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
`

const TitleSection = styled.View`
    margin: 20px 24px 0px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`

const FavoriteItemView = styled.View`
    margin: 10px 24px;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
`

const MusicCircle = styled.View`
    width: 42px;
    height: 42px;
    border-radius: 42px;
    overflow: hidden;
    align-items: center;
    justify-content: center;
`

const BottomSection = styled.View`
    margin: 0px 24px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    bottom: 50px;
    left: 0px;
    z-index: 1;
`
export default Home

