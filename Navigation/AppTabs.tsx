import React, { useCallback, useEffect, useRef } from 'react'
import { Alert, BackHandler, DeviceEventEmitter, StyleSheet, Text, View } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useFocusEffect, useNavigation, useNavigationState } from '@react-navigation/native'

import TabBar from '../Components/TabBar'
import { Colors } from '../Constants'
import { Home, Library, Favorites as FavoritesScreen } from '../Screens'
import { useAppSelector } from '../hooks/reduxHooks'
import { selectMiniPlayerPlacement } from '../state/settings'

export type AppTabParamList = {
    Home: undefined
    LibraryTab: undefined
    Favorites: undefined
    Profile: undefined
}

const Tab = createBottomTabNavigator<AppTabParamList>()

const PlaceholderScreen = (title: string) => {
    const Component = React.memo(() => (
        <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderTitle}>{title}</Text>
            <Text style={styles.placeholderSubtitle}>Coming soon</Text>
        </View>
    ))
    Component.displayName = `${title}PlaceholderScreen`
    return Component
}

const ProfileScreen = PlaceholderScreen('Profile')

const AppTabs: React.FC = () => {
    const placement = useAppSelector(selectMiniPlayerPlacement)
    const hasTrack = useAppSelector((s) => Boolean((s as any).currentTrack?.title))
    const navigation = useNavigation<any>()
    const handleNowPlayingPress = useCallback(() => {
        navigation.navigate('Player')
    }, [navigation])

    // Track current active tab name from tab navigator state
    const activeTabName = useNavigationState((state: any) => {
        try {
            const idx = state?.index ?? 0
            return state?.routes?.[idx]?.name
        } catch { return undefined }
    })
    const lastBackPressRef = useRef(0)

    // Track Home drawer state via a simple event channel
    const isHomeDrawerOpenRef = useRef(false)
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('homeDrawerOpen', (open: boolean) => {
            isHomeDrawerOpenRef.current = Boolean(open)
        })
        return () => sub.remove()
    }, [])

    // Intercept Android back; only prompt to exit when the Home tab is active
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                // If the custom Home drawer is open, request it to close and consume back
                if (isHomeDrawerOpenRef.current) {
                    DeviceEventEmitter.emit('homeDrawerRequestClose')
                    return true
                }
                // Only prompt to exit on Home tab; otherwise navigate to Home
                if (activeTabName !== 'Home') {
                    navigation.navigate('Home' as never)
                    return true
                }
                // We are on Home: require double-back to exit (within 2s)
                const now = Date.now()
                if (now - lastBackPressRef.current < 2000) {
                    BackHandler.exitApp()
                    return true
                }
                lastBackPressRef.current = now
                DeviceEventEmitter.emit('appToast', { message: 'Press back again to exit', durationMs: 1600 })
                return true
            }
            const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress)
            return () => sub.remove()
        }, [navigation, activeTabName])
    )

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarHideOnKeyboard: true,
            }}
            tabBar={(props) => (
                placement === 'replaceTabBar'
                    ? null as unknown as React.ReactNode
                    : (
                        <TabBar
                            {...props}
                            showNowPlaying={placement === 'mergeWithTabBar' && hasTrack}
                            onNowPlayingPress={handleNowPlayingPress}
                        />
                    )
            )}
        >
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="LibraryTab"
                component={Library}
                options={{
                    tabBarLabel: 'Library',
                }}
            />
            <Tab.Screen
                name="Favorites"
                component={FavoritesScreen}
                options={{
                    tabBarLabel: 'Favorites',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    )
}

export default AppTabs

const styles = StyleSheet.create({
    placeholderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        padding: 24,
    },
    placeholderTitle: {
        color: Colors.primary,
        fontSize: 24,
        fontWeight: '700',
    },
    placeholderSubtitle: {
        marginTop: 8,
        color: Colors.grey4,
        fontSize: 16,
    },
})
