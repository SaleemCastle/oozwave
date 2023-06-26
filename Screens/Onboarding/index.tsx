import React, { useEffect } from 'react'
import { Button, StatusBar, Text, View } from 'react-native'
import MusicFiles, { Constants } from 'react-native-get-music-files-v3dev-test'
import styled from 'styled-components/native'

import { Colors, Images } from '../../Constants'
import { McText, McImage, PlayButton } from '../../Components'
import TrackPlayer, { AppKilledPlaybackBehavior, Capability } from 'react-native-track-player'
import { checkPermissions } from '../../services/requestPermissions'
import { OnboardingProps } from '../../types'
import { useAppDispatch } from '../../hooks/reduxHooks'
import { addTracks, addTracksError } from '../../Store/Actions/tracks.actions'
import { ADD_TRACKS_ERROR } from '../../Store/ReduxConstants'
 
const Onboarding = ({ navigation }: OnboardingProps) => {
    const dispatch = useAppDispatch()
    useEffect(() =>{
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
    })
    
    useEffect(() => {
        checkPermissions()
        MusicFiles.getAll({
            batchSize: 0,
            batchNumber: 0,
            minimumSongDuration: 1000 * 90, 
            sortBy: Constants.SortBy.Title.toString(),
            sortOrder: Constants.SortOrder.Ascending.toString()
        })
        .then(tracks => {
            dispatch(addTracks(tracks.results.filter(track => track.album !== 'WhatsApp Audio')))
        })
        .catch(err =>{
            console.warn(err)
            dispatch(addTracks([]))
            const error: Error = { name: ADD_TRACKS_ERROR, message: err.toString() }
            dispatch(addTracksError(error))
        }) 
       
    })
    return (
        <Container>
            <StatusBar hidden />

            <McImage source={ Images.logo } />
            <McText color={ Colors.primary } size={ 24 } black style={{ marginTop: 28 }}>The sound of life</McText>

            <McText color={ Colors.grey4 } size={ 14 } medium align='center' style={{ marginHorizontal: 51, marginTop: 8 }}>
                Music is not an entertainment, but also it is our life
            </McText>

            <View style={{marginTop: 202}}>
                <PlayButton 
                    size={78} 
                    circle={70} 
                    icon={Images.arrowRight}
                    onPress={() => { navigation.navigate('Library')} }  
                />
            </View>
        </Container>
    )
}

const Container = styled.SafeAreaView`
    flex: 1;
    background-color: ${ Colors.background };
    justify-content: center;
    align-items: center;
`;

export default Onboarding