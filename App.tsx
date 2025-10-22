import React from 'react'
import 'react-native-gesture-handler'
import TrackPlayer from 'react-native-track-player'
import { Provider } from 'react-redux'

import { AppNavigator } from './Navigation/index' 
import { store } from './Store/store'
import { View } from 'react-native'
import { Colors } from './Constants'
import PlayerStateSync from './state/playerQueue/PlayerStateSync'

const App = () => {
    return (
        <Provider store={ store }>
            <View style={{ flex: 1, backgroundColor: `${Colors.background}` }}>
                <PlayerStateSync />
                <AppNavigator />
            </View>
        </Provider>
    )
}

export default App
TrackPlayer.registerPlaybackService(() => require('./services/TrackPlayer.service'))
TrackPlayer.setupPlayer()

