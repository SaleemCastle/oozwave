import React from 'react'
import { NavigationContainer } from '@react-navigation/native'

import { DefaultTheme, DarkTheme } from '@react-navigation/native'
import Stacks from './Stacks'
import TabStacks from './TabStacks'

export default function AppNavigator() {
    return (
        <NavigationContainer theme={ DarkTheme }>
            {/* Use TabStacks or Stacks below to display the bottom tabs or not */}
            <Stacks />
            {/* <TabStacks /> */}
        </NavigationContainer>
    )
}
