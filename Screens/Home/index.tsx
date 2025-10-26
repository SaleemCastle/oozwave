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
    Easing,
    StyleSheet, 
} from 'react-native'
import styled from 'styled-components/native'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'
import TrackPlayer, { State, useProgress } from 'react-native-track-player'
import { Vibration } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import BottomBar from './BottomBar'


import { Colors, Images, Metrics } from '../../Constants'
import { dummyData } from '../../Mock'
import { ITrack } from '../../Store/Actions/currentTrack.actions'
import { McText, McImage, PlayButton, McVectorIcon } from '../../Components'
import AppDrawer, { DrawerOption } from '../../Components/AppDrawer'
import { styles } from './styles';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { IDummyPlaylist } from '../../Mock/Dummy'
import { RootState } from '../../Store/store'
import DiscoverCard from '../../Components/DiscoverCard'
import { setCurrentPlayerState } from '../../Store/Actions/playerState.actions'
import TrackCarousel from '../../Components/TrackCarousel'
import { playTracksNow } from '../../state/playerQueue'
import { trackToQueueItem } from '../../state/playerQueue/utils'
import { colors } from '../../theme/tokens'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { toggleFavorite } from '../../state/favorites'
// import { Easing } from 'react-native-reanimated'

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppTabParamList } from '../../Navigation/AppTabs'
import type { RootStackParamList } from '../../types'
import { selectMiniPlayerPlacement } from '../../state/settings'
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
    const insets = useSafeAreaInsets()
    const tabBarHeight = useBottomTabBarHeight()
    const hapticsEnabled = useAppSelector((s) => (s as any).settings?.haptics as boolean)
    const normalizeVolume = useAppSelector((s) => (s as any).settings?.normalizeVolume as boolean)
    const favoriteIds = useAppSelector((s) => (s as any).favorites?.ids as string[] || [])
    const isMiniFavorite = currentTrack ? favoriteIds.includes(String(currentTrack.id)) : false
    let isPlaying = playerState === State.Playing.toString()
    const progress = useProgress(1)

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
        { id: 'preferences', label: 'preferences', icon: 'sliders', accentColor: Colors.accent, onPress: () => navigation.navigate('Preferences') },
        { id: 'playlists', label: 'playlists', icon: 'list', accentColor: Colors.white, onPress: () => navigation.navigate('Playlists') },
        { id: 'equalizer', label: 'equalizer', icon: 'activity', accentColor: Colors.primary, onPress: () => navigation.navigate('Equalizer') },
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
        <Container>
            <ScrollView showsVerticalScrollIndicator={ false }>

                <StatusBar hidden />
                <HeaderRow>
                    <McText extra size={ 24 } color={ Colors.primary }>
                        Good evening
                    </McText>
                    <DrawerToggleButton
                        progress={ drawerProgress }
                        isOpen={ drawerOpen }
                        onPress={ toggleDrawer }
                    />
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

                {/* <TitleSection>
                    <McText medium size={ 20 } color={ Colors.grey4 }>Favorite</McText>

                    <TouchableWithoutFeedback>
                        <McImage source={ Images.chevronBlue } />
                    </TouchableWithoutFeedback>
                </TitleSection> */}

                {/* <View>
                    {
                        !tracks.length 
                        ?
                        <McText>Error Loading Tracks</McText>
                        :
                        <TrackCarousel tracks={ tracks } handleNavigationToPlayer={ navToPlayer }/>
                    }
                </View> */}
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
                        <Pressable style={ styles.playerContainer } onPress={() => navigation.navigate('Player')} onLongPress={() => { if (currentTrack) dispatch(toggleFavorite(String(currentTrack.id))) }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flex: 1 }}>
                            <CoverImage
                                //@ts-ignore
                                    src={ currentTrack?.path }
                                    // placeHolder={ 'https://cdn2.iconfinder.com/data/icons/Qetto___icons_by_ampeross-d4njobq/256/library-music.png' }
                                    // width={ 38 }
                                    // height={ 38 }
                                />
                                <View style={{ marginLeft: 12, maxWidth: '70%' }}>
                                    <McText bold size={ 12 } color={ Colors.grey5 }>{ currentTrack.title }</McText>
                                    <McText medium size={ 12 } color={ Colors.grey3 } style={{ marginTop: 4 }} numberOfLines={ 1 }>{ currentTrack?.artist }</McText>
                                </View>
                            </View>
                            <Pressable onPress={() => { if (currentTrack) dispatch(toggleFavorite(String(currentTrack.id))) }} hitSlop={12} style={{ marginHorizontal: 8 }} accessibilityRole='button' accessibilityLabel={ isMiniFavorite ? 'Remove from favorites' : 'Add to favorites' }>
                                <View>
                                    <MCIcon name='heart' size={20} color={ isMiniFavorite ? colors.neonMagenta : 'rgba(180,180,180,0.8)' } style={{ position: 'absolute' }} />
                                    <MCIcon name='heart-outline' size={20} color={'#FFFFFF'} />
                                </View>
                            </Pressable>
                            <PlayButton size={ 46 } circle={ 41.28 } icon={ isPlaying ? Images.pause : Images.miniplay} onPress={ handleMiniPlayer }></PlayButton>
                        </Pressable>
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

const Container = styled.SafeAreaView`
    flex: 1;
    background-color: ${Colors.background};
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
