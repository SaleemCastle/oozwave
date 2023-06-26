import React, { useEffect, useState } from 'react'

import { StatusBar, TouchableOpacity, View } from 'react-native'

import styled from 'styled-components/native'
import Slider from '@react-native-community/slider'
import TrackPlayer, { State, useProgress } from 'react-native-track-player'

import { Colors, Images } from '../../Constants'
import { ITrack, setCurrentTrack } from '../../Store/Actions/currentTrack.actions'
import { McText, McImage, PlayButton } from '../../Components'
import { PlayerProps } from '../../types'
import { setCurrentPlayerState } from '../../Store/Actions/playerState.actions'
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'
// import { RouteProp, useNavigation } from '@react-navigation/native'

// interface IProps {
//   route: RouteProp<{ params: { selectedMusic: ITrack } }, 'params'>
// }
 
const Player = ({ navigation, route }: PlayerProps) => {
    const currentPlayerState = useAppSelector((state) => state.currentPlayerState.playerState)
    const currentTrack = useAppSelector((state) => state.currentTrack)
    const [selectedTrack, setSelectedMusic] = useState({} as ITrack)
    const [isPlaying, setPlaying] = useState(false)
    const progress = useProgress(100)
    const dispatch = useAppDispatch()
    // const navigator = useNavigation()

    const { selectedMusic } = route.params

    const formatDuration = (ms: number) => {
            let minutes = Math.floor(ms / 60000)
            let seconds = ((ms % 60000) / 1000).toFixed(0)
            return minutes + ":" + (+seconds < 10 ? '0' : '') + seconds
    }

    const startTrack = async () => {
        // Reset player state
        // await TrackPlayer.reset()
        
        const current = await TrackPlayer.getCurrentTrack()
        const trackObject = await TrackPlayer.getTrack(current === null ? 0 : current).catch((err) => console.warn('track not found', err))
        
        dispatch(setCurrentTrack({ ...selectedMusic}))
        TrackPlayer.play()
        setPlaying(true)
        // getPlayerState()
    }

    const pauseTrack = async () => {
            TrackPlayer.pause()
            setPlaying(false)
            getPlayerState()
    }

    const getPlayerState = async () => {
            const state = (await TrackPlayer.getState()).toString()

            dispatch(setCurrentPlayerState(state))
            setPlaying(state === State.Playing.toString())
    }
    
    useEffect(() => {
            getPlayerState()
            setSelectedMusic(selectedMusic)

            if (currentTrack?.title.toString() !== selectedMusic?.title.toString()) {
            TrackPlayer.reset()
            TrackPlayer.add({ ...selectedMusic, url: `file://${selectedMusic?.path}`, duration: +selectedMusic?.duration / 1000})
            getPlayerState()
            }

            return() => {
            if (currentPlayerState as string === 'stopped') {
                TrackPlayer.reset()
            }
            }
    }, [])

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
                <McImage 
                    source={ selectedTrack?.cover ? selectedTrack?.cover : Images.DefaultMusicIcon } 
                    style={{
                        marginHorizontal: 81,
                        marginVertical: 60,
                        height: 214,
                        width: 214,
                        borderRadius: 214,
                    }}
                />
                {/* <CoverImage
                    source={ selectedTrack?.path }
                    placeHolder={ 'https://cdn2.iconfinder.com/data/icons/Qetto___icons_by_ampeross-d4njobq/256/library-music.png' }
                    width={ 214 }
                    height={ 214 }
                /> */}
                
                <View style={{ marginTop: 16, justifyContent: 'center', alignItems: 'center' }}>
                    <McText semi size={ 24 } color={ Colors.grey5 } align='center'>
                        { selectedTrack?.title }
                    </McText>
                    <McText medium size={14} color={Colors.grey3} style={{marginTop: 8}} align='center'>
                        { selectedTrack?.artist }
                    </McText>
                </View>
            </MusicDetailSection>

            <SliderSection>
                <Slider
                    minimumValue={ 0 }
                    maximumValue={ progress.duration }
                    value={ progress.position }
                    minimumTrackTintColor={ Colors.primary }
                    maximumTrackTintColor={ Colors.grey3 }
                    thumbTintColor={ Colors.primary }
                >

                </Slider>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <McText size={ 12 } color={ Colors.grey4 }>{ formatDuration(Math.floor(progress.position * 1000)) }</McText>
                    <McText size={ 12 } color={ Colors.grey4 }>{ formatDuration(selectedTrack?.duration) }</McText>
                </View>
            </SliderSection>

            <ControlSection>
                <McImage source={ Images.repeat }/>

                <View style={{ width: 231, height: 70, justifyContent: 'center', alignItems: 'center' }}>

                    <View style={{
                        width: 231,
                        height: 54,
                        borderRadius: 54,
                        flexDirection: 'row',
                        backgroundColor: Colors.secondary,
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <McImage source={ Images.back } style={{ marginLeft: 24 }}/>

                        <View 
                            style={{
                                width: 88,
                                height: 88,
                                borderRadius: 88,
                                backgroundColor: Colors.background,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >

                            <PlayButton size={70} circle={62.82} icon={ isPlaying ? Images.pause : Images.play } onPress={ () => isPlaying ? pauseTrack() : startTrack() }/>

                        </View>

                        <McImage source={ Images.next } style={{ marginRight: 24 }}/>
                    </View>

                </View>

                <McImage source={ Images.sound }/>
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

export default Player