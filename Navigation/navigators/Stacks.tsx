import React from 'react'

import { createStackNavigator } from '@react-navigation/stack'

import {
    Onboarding,
    Player,
    Billboards,
    Discover,
    PlaylistsScreen,
    PlaylistDetailScreen,
    PlaylistEditorModal,
    Equalizer
} from '../../Screens'
import Preferences from '../../Screens/Preferences'
import AppTabs from '../AppTabs'
import { RootStackParamList } from '../../types'

const Stack = createStackNavigator<RootStackParamList>()

interface IProps {
    params?: any
}

const Stacks = (props: IProps) => (
    <Stack.Navigator initialRouteName='Onboarding'>
        <Stack.Screen
            name='Billboards'
            component={ Billboards }
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name='Onboarding'
            component={ Onboarding }
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name='Library'
            component={ AppTabs }
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name='Discover'
            component={ Discover }
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name='Equalizer'
            component={ Equalizer }
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name='Preferences'
            component={ Preferences }
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name='DiscoverSection'
            component={ require('../../Screens/Discover/SectionList').default }
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name='Player'
            component={ Player }
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name='Playlists'
            component={ PlaylistsScreen }
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name='PlaylistDetail'
            component={ PlaylistDetailScreen }
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name='PlaylistEditor'
            component={ PlaylistEditorModal }
            options={{
                headerShown: false,
                presentation: 'modal',
            }}
        />
    </Stack.Navigator>
)

export default Stacks
