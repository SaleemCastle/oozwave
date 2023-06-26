import React from 'react'

import { createStackNavigator } from '@react-navigation/stack'

import { Onboarding, Library, Player } from '../../Screens'
import { RootStackParamList } from '../../types'

const Stack = createStackNavigator<RootStackParamList>()

interface IProps {
  params?: any
}

const Stacks = (props: IProps) => (
  <Stack.Navigator initialRouteName="Onboarding">
        {/* <Stack.Screen
            name="Home"
            component={Home}
            options={{
                headerShown: false,
            }}
        /> */}
        {/* <Stack.Screen
            name="Profile" 
            component={ Profile }
            options={{
                headerShown: true,
            }}
        /> */}
        <Stack.Screen
            name="Onboarding"
            component={Onboarding}
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name="Library"
            component={ Library }
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name="Player"
            component={ Player }
            options={{
                headerShown: false,
            }}
        />
        {/* <Stack.Screen
            name="TestPlayer"
            component={TestPlayer}
            options={{
                headerShown: false,
            }}
        /> */}
  </Stack.Navigator>
)

export default Stacks
