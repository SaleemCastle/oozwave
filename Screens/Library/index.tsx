import React, { useEffect, useState } from 'react'
import { 
    StatusBar, 
    View,
    TouchableWithoutFeedback,
    FlatList,
    ScrollView,
    TextInput,
    Pressable,
    Animated, 
} from 'react-native'
import styled from 'styled-components/native'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'
import TrackPlayer, { State, useProgress } from 'react-native-track-player'

import BottomBar from './BottomBar'


import { Colors, Images, Metrics } from '../../Constants'
import { dummyData } from '../../Mock'
import { ITrack } from '../../Store/Actions/currentTrack.actions'
import { McText, McImage, PlayButton } from '../../Components'
import { styles } from './styles';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { IDummyPlaylist } from '../../Mock/Dummy'
import { LibraryProps } from '../../types'
import { useSelector } from 'react-redux'
import { RootState } from '../../Store/store'
 
const Library = ({ navigation }: LibraryProps) => {
    const tracks = useAppSelector((state) => state.tracks)
    const playerState = useAppSelector((state) => state.currentPlayerState.playerState)
    const currentTrack = useAppSelector((state) => state.currentTrack)
    const [isPlaying, play] = useState(false)
    const progress = useProgress(100)

    const animation = new Animated.Value(Math.ceil((progress.position/progress.duration) * 100))
    const inputRange = [0, 100]
    const outputRange = ["0%", "100%"]
    const animatedWidth = animation.interpolate({inputRange, outputRange});
    const permission = useSelector((state: RootState) => state.permission)
    console.log('permission ', permission)

    const handleMiniPlayer = async () => {
        isPlaying ? TrackPlayer.pause() : TrackPlayer.play()
        play(!isPlaying)
    }

    useEffect(() => {
        play(playerState === State.Playing.toString())

        return () => { }
    }, [playerState])

    const _renderItem = ({item, index}: { item: IDummyPlaylist , index: number }) => {
        return (
            <View>
                <View style={{
                marginTop: 16,
                marginLeft: index === 0 ? 24 : 0,
                marginRight: index === dummyData.Playlists.length - 1 ? 0 : 24
                }}>

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
                </View>
            </View>
        )
    }

    return (
        <Container>
            <StatusBar hidden />

            <McText 
                bold 
                size={ 28 } 
                color={ Colors.primary }
                style={{ marginLeft: Metrics.padding, marginTop: 12 }}
            >
                Library
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

            <TitleSection>
                <McText medium size={ 20 } color={ Colors.grey4 }>Favorite</McText>

                <TouchableWithoutFeedback>
                    <McImage source={ Images.chevronBlue } />
                </TouchableWithoutFeedback>
            </TitleSection>

            <View style={{ height: 250 }}>
                <ScrollView
                    contentContainerStyle={{ marginTop: 14 }}
                    showsVerticalScrollIndicator={ true }
                    style={{ flex: 1 }}
                >
                {
                    (tracks as unknown as ITrack).error 
                    ?
                    <McText>Error Loading Tracks</McText>
                    :
                    tracks.map((item: ITrack, index: number) => {
                        return (
                            <FavoriteItemView key={ index }>

                                <TouchableWithoutFeedback onPress={() => {
                                    navigation.navigate('Player', { selectedMusic: item })
                                }}>

                                    <View style={{ flexDirection: 'row' }}>
                                        <MusicCircle>
                                            {/* <McImage source={ Images.musicIcon } /> */}
                                            <CoverImage
                                                // @ts-ignore 
                                                source={ item.path }
                                                placeHolder={
                                                'https://cdn2.iconfinder.com/data/icons/Qetto___icons_by_ampeross-d4njobq/256/library-music.png'
                                                }
                                                width={ 42 }
                                                height={ 42 }
                                            />
                                        </MusicCircle>

                                        <View style={{ marginLeft: 12 }}>

                                            <McText semi size={ 14 } color={ Colors.grey5 } numberOfLines={ 2 }>
                                                { item.title.length > 25 ? item.title.substring(0, 25).concat('...') : item.title }
                                            </McText>
                                            <McText medium size={ 12 } color= {Colors.grey3 } style={{ marginTop: 4 }}>{ item.artist }</McText>

                                        </View>

                                    </View>
                                </TouchableWithoutFeedback>

                                <McImage source={ Images.like } />
                            </FavoriteItemView>
                        )
                    })
                }
                </ScrollView>
            </View>

            {
                currentTrack?.title
                ?
                <BottomSection>
                    <BottomBar>
                        <Animated.View style={{height: '100%', width: animatedWidth, backgroundColor: Colors.background, position: 'absolute', opacity: 0.3}}/>
                        <Pressable style={ styles.playerContainer } onPress={() => navigation.navigate('Player', { selectedMusic: currentTrack })}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <McImage source={ Images.thumb1 } style={{ width: 38, height: 38 }} />
                                <View style={{ marginLeft: 12, width: '70%' }}>
                                    <McText bold size={ 12 } color={ Colors.grey5 }>{ currentTrack.title }</McText>
                                    <McText medium size={ 12 } color={ Colors.grey3 } style={{ marginTop: 4 }}>{ currentTrack?.artist }</McText>
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
    /* background-color: ${Colors.secondary}; */
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