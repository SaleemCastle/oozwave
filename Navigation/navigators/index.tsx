import React from 'react'
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from '@react-navigation/native'
import { useColorScheme } from 'react-native'
import { useAppSelector } from '../../hooks/reduxHooks'
import { selectSettings } from '../../state/settings'

import Stacks from './Stacks'
import TabStacks from './TabStacks'

export default function AppNavigator() {
    const scheme = useColorScheme()
    const { theme } = useAppSelector(selectSettings)
    const navTheme: Theme = theme === 'system' ? (scheme === 'dark' ? DarkTheme : DefaultTheme) : (theme === 'dark' ? DarkTheme : DefaultTheme)

    return (
        <NavigationContainer theme={ navTheme }>
            {/* Use TabStacks or Stacks below to display the bottom tabs or not */}
            <Stacks />
            {/* <TabStacks /> */}
        </NavigationContainer>
    )
}
