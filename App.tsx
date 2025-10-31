import React from 'react'
import 'react-native-gesture-handler'
import TrackPlayer from 'react-native-track-player'
import { Provider } from 'react-redux'

import { AppNavigator } from './Navigation/index'
import { store } from './Store/store'
import { View, useColorScheme } from 'react-native'
import { Colors } from './Constants'
import PlayerStateSync from './state/playerQueue/PlayerStateSync'
import { useAppSelector } from './hooks/reduxHooks'
import { selectSettings } from './state/settings'

const Root = () => {
    const scheme = useColorScheme()
    const { theme } = useAppSelector(selectSettings)
    const isDark = theme === 'system' ? scheme === 'dark' : theme === 'dark'
    const bg = isDark ? Colors.background : Colors.white
    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <PlayerStateSync />
            <AppNavigator />
        </View>
    )
}

const App = () => (
    <Provider store={ store }>
        <Root />
    </Provider>
)

export default App
TrackPlayer.registerPlaybackService(() => require('./services/TrackPlayer.service'))
TrackPlayer.setupPlayer()

if (typeof __DEV__ !== 'undefined' && __DEV__) {
    setTimeout(() => {
        try {
            const state = store.getState() as any
            // Avoid stringifying huge collections like tracks/queue in dev
            const { tracks, playerQueue, ...rest } = state || {}
            const safeBytes = JSON.stringify(rest).length
            const countProps = (o: any) => {
                const seen = new Set<any>()
                let props = 0
                const stack = [o]
                while (stack.length) {
                    const n: any = stack.pop()
                    if (n && typeof n === 'object' && !seen.has(n)) {
                        seen.add(n)
                        for (const k in n) { props++; stack.push(n[k]) }
                    }
                }
                return props
            }
            // eslint-disable-next-line no-console
            console.log('redux bytes (safe) ~', safeBytes, 'prop count ~', countProps(rest))
        } catch {}
    }, 1500)
}
