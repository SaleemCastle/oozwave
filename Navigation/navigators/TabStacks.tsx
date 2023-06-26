import React from 'react'
import { Text, View } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'

import Tabs from './Tabs'
import { Onboarding } from '../../Screens/index'

const Stack = createStackNavigator()

const TabStacks = ({ params }) => (
    <Stack.Navigator>
        <Stack.Screen
            name="Tabs"
            component={ Tabs }
            options={{
                headerShown: false,
            }}
        />
        <Stack.Screen
            name="Profile"
            component={ Onboarding }
            options={{
                headerShown: true,
            }}
        />
    </Stack.Navigator>
)

export default TabStacks
