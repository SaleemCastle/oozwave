import React, { memo, useCallback, useEffect, useState } from 'react'
import { 
    StatusBar, 
    View,
    TouchableWithoutFeedback,
    FlatList,
    ScrollView,
    TextInput,
    Pressable,
    Animated,
    Text,
    Alert, 
} from 'react-native'
import styled from 'styled-components/native'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'
import TrackPlayer, { State, useProgress } from 'react-native-track-player'

import BottomBar from './BottomBar'


import { Colors, Images, Metrics } from '../../Constants'
import { dummyData } from '../../Mock'
import { ITrack } from '../../Store/Actions/currentTrack.actions'
import { McText, McImage, PlayButton, McVectorIcon } from '../../Components'
import { styles } from './styles';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { IDummyPlaylist } from '../../Mock/Dummy'
import { LibraryProps } from '../../types'
import { RootState } from '../../Store/store'
import DiscoverCard from '../../Components/DiscoverCard'
import { setCurrentPlayerState } from '../../Store/Actions/playerState.actions'
import TrackCarousel from '../../Components/TrackCarousel'
 
const Library = ({ navigation }: LibraryProps) => {
    const tracks: ITrack[] = useAppSelector((state) => state.tracks)
    const playerState = useAppSelector((state) => state.currentPlayerState.playerState)
    const currentTrack = useAppSelector((state) => state.currentTrack)
    const permission = useAppSelector((state: RootState) => state.permission)
    const dispatch = useAppDispatch()
    let isPlaying = playerState === State.Playing.toString()
    const progress = useProgress(1)

    const DiscoverCardMemoized = memo(DiscoverCard)

    const animation = new Animated.Value((progress.position / progress.duration) * 100)
    const inputRange = [0, 100]
    const outputRange = ["0%", "100%"]
    const animatedWidth = animation.interpolate({inputRange, outputRange})
    console.log(isPlaying)
    
    const handleMiniPlayer = useCallback(async () => {
        isPlaying ? await TrackPlayer.pause() : await TrackPlayer.play()
    }, [isPlaying])

    const getPlayerState = useCallback(async () => {
        const state = (await TrackPlayer.getState()).toString()
        dispatch(setCurrentPlayerState(state))
        isPlaying = state === State.Playing.toString()
    }, [dispatch, isPlaying])

    useEffect(() => {
        getPlayerState()
    })

    const navToPlayer = useCallback((selectedTrack: ITrack) => {
        navigation.navigate('Player', { selectedMusic: selectedTrack })
    }, [])

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

                <McText 
                    extra 
                    size={ 28 } 
                    color={ Colors.primary }
                    style={{ marginLeft: Metrics.padding, marginTop: 12 }}
                >
                    Good evening
                </McText>
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

                    <TouchableWithoutFeedback>
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

                <TitleSection>
                    <McText medium size={ 20 } color={ Colors.grey4 }>Favorite</McText>

                    <TouchableWithoutFeedback>
                        <McImage source={ Images.chevronBlue } />
                    </TouchableWithoutFeedback>
                </TitleSection>

                <View>
                    {/* <ScrollView
                        contentContainerStyle={{ marginTop: 14 }}
                        showsVerticalScrollIndicator={ true }
                        style={{ flex: 1 }}
                    > */}
                    {
                        !tracks.length 
                        ?
                        <McText>Error Loading Tracks</McText>
                        :
                        <TrackCarousel tracks={ tracks } handleNavigationToPlayer={ navToPlayer }/>
                    }
                    {/* </ScrollView> */}
                </View>
            </ScrollView> 
            {
                currentTrack?.title
                ?
                <BottomSection>
                    <BottomBar>
                        <Animated.View style={{height: '100%', width: animatedWidth, backgroundColor: Colors.background, position: 'absolute', opacity: 0.3}}/>
                        <Pressable style={ styles.playerContainer } onPress={() => navigation.navigate('Player', { selectedMusic: currentTrack })}>
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

                            <PlayButton size={ 46 } circle={ 41.28 } icon={ isPlaying ? Images.pause : Images.miniplay} onPress={ handleMiniPlayer }></PlayButton>
                        </Pressable>
                    </BottomBar>
                </BottomSection>
                : null
            }
        </Container>
    )
}

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
export default Library