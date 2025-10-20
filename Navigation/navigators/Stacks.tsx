import React from 'react'

import { createStackNavigator } from '@react-navigation/stack'

import {
    Onboarding,
    Player,
    Billboards,
    PlaylistsScreen,
    PlaylistDetailScreen,
    PlaylistEditorModal,
} from '../../Screens'
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
