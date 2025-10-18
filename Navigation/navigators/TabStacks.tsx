import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import AppTabs from '../AppTabs'
import { Onboarding } from '../../Screens/index'

const Stack = createStackNavigator()

const TabStacks = ({ params }) => (
    <Stack.Navigator>
        <Stack.Screen
            name="Tabs"
            component={ AppTabs }
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
