import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    AccessibilityInfo,
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import tokens from '../theme/tokens'

const { colors, radii, shadows } = tokens

const BlurView: React.ComponentType<any> | null = null

interface CustomTabBarProps extends BottomTabBarProps {
    showNowPlaying?: boolean
    onNowPlayingPress?: () => void
}

const ICONS: Record<string, string> = {
    Home: 'home',
    Library: 'folder-music',
    Favorites: 'heart',
    Profile: 'account',
}

const usePrefersReducedMotion = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        let isMounted = true

        const handleChange = (value: boolean) => {
            if (isMounted) {
                setPrefersReducedMotion(value)
            }
        }

        AccessibilityInfo.isReduceMotionEnabled().then(handleChange)

        const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', handleChange)

        return () => {
            isMounted = false
            if (subscription) {
                if (typeof subscription.remove === 'function') {
                    subscription.remove()
                } else {
                    // @ts-ignore backward compatibility for RN < 0.65
                    AccessibilityInfo.removeEventListener?.('reduceMotionChanged', handleChange)
                }
            }
        }
    }, [])

    return prefersReducedMotion
}

interface TabItemProps {
    label: string
    iconName: string
    focused: boolean
    onPress: () => void
    onLongPress: () => void
    accessibilityLabel?: string
    testID?: string
    prefersReducedMotion: boolean
}

const TabItem = memo<TabItemProps>(({
    label,
    iconName,
    focused,
    onPress,
    onLongPress,
    accessibilityLabel,
    testID,
    prefersReducedMotion,
}) => {
    const scale = useRef(new Animated.Value(focused ? 1.08 : 1)).current

    useEffect(() => {
        if (prefersReducedMotion) {
            scale.setValue(1)
            return
        }

        Animated.timing(scale, {
            toValue: focused ? 1.08 : 1,
            duration: 180,
            useNativeDriver: true,
        }).start()
    }, [focused, prefersReducedMotion, scale])

    const iconColor = focused ? colors.neonMagenta : colors.lavenderFog

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={ accessibilityLabel }
            accessibilityState={{ selected: focused }}
            hitSlop={ 12 }
            onPress={ onPress }
            onLongPress={ onLongPress }
            testID={ testID }
            style={ styles.tabPressable }
        >
            <Animated.View
                style={ [
                    styles.iconWrapper,
                    focused && styles.iconWrapperActive,
                    !prefersReducedMotion && { transform: [{ scale }] },
                    prefersReducedMotion && focused && styles.iconWrapperActiveReduced,
                ] }
            >
                { focused && !prefersReducedMotion && (
                    <View style={ styles.iconGlow } />
                ) }
                <Icon name={ iconName } size={ 24 } color={ iconColor } />
            </Animated.View>
        </Pressable>
    )
}, (prev, next) => (
    prev.focused === next.focused &&
    prev.label === next.label &&
    prev.iconName === next.iconName &&
    prev.prefersReducedMotion === next.prefersReducedMotion
))

const TabBar: React.FC<CustomTabBarProps> = ({
    state,
    descriptors,
    navigation,
    showNowPlaying,
    onNowPlayingPress,
    insets,
}) => {
    const { bottom: safeBottom } = useSafeAreaInsets()
    const prefersReducedMotion = usePrefersReducedMotion()

    const bottomInset = Math.max(insets.bottom, safeBottom)

    const handleTabPress = useCallback((routeKey: string, routeName: string, isFocused: boolean, params?: object) => {
        const event = navigation.emit({
            type: 'tabPress',
            target: routeKey,
            canPreventDefault: true,
        })

        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: routeName, params, merge: true } as never)
        }
    }, [navigation])

    const handleTabLongPress = useCallback((routeKey: string) => {
        navigation.emit({
            type: 'tabLongPress',
            target: routeKey,
        })
    }, [navigation])

    const routes = useMemo(() => state.routes, [state.routes])

    return (
        <View pointerEvents="box-none" style={ styles.absoluteWrapper }>
            <View
                style={ [
                    styles.container,
                    {
                        marginBottom: bottomInset + 12,
                    },
                ] }
            >
                { BlurView ? (
                    <BlurView
                        style={ StyleSheet.absoluteFill }
                        blurAmount={ 24 }
                        blurType={ Platform.OS === 'ios' ? 'dark' : 'regular' }
                    />
                ) : (
                    <View style={ [StyleSheet.absoluteFill, styles.translucentFallback] } />
                ) }

                <View style={ styles.tabRow }>
                    { routes.map((route, index) => {
                        const isFocused = state.index === index
                        const descriptor = descriptors[route.key]
                        const options = descriptor?.options ?? {}
                        const labelFromOptions =
                            typeof options.tabBarLabel === 'string'
                                ? options.tabBarLabel
                                : typeof options.title === 'string'
                                    ? options.title
                                    : route.name
                        const label = labelFromOptions
                        const iconName = ICONS[route.name] ?? 'circle'

                        return (
                            <TabItem
                                key={ route.key }
                                label={ label }
                                iconName={ iconName }
                                focused={ isFocused }
                                prefersReducedMotion={ prefersReducedMotion }
                                accessibilityLabel={ options.tabBarAccessibilityLabel }
                                testID={ options.tabBarTestID }
                                onPress={ () => handleTabPress(route.key, route.name, isFocused, route.params) }
                                onLongPress={ () => handleTabLongPress(route.key) }
                            />
                        )
                    }) }
                </View>

                { showNowPlaying && (
                    <View pointerEvents="box-none" style={ styles.nowPlayingWrapper }>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Open now playing"
                            hitSlop={ 14 }
                            onPress={ onNowPlayingPress }
                            style={ styles.nowPlayingPressable }
                        >
                            <LinearGradient
                                colors={[colors.cyanPulse, colors.neonMagenta]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={ styles.nowPlayingGradient }
                            >
                                <Icon name="play" size={ 20 } color={ colors.pureWhite } />
                            </LinearGradient>
                            <View style={ styles.nowPlayingHalo } />
                        </Pressable>
                    </View>
                ) }
            </View>
        </View>
    )
}

export default TabBar

const styles = StyleSheet.create({
    absoluteWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
    },
    container: {
        backgroundColor: colors.midnightOverlay,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.neonMagentaSoft,
        paddingHorizontal: 24,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.neonPill,
        overflow: 'hidden',
    },
    tabRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        width: '100%',
    },
    tabPressable: {
        flexGrow: 1,
        flexShrink: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 48,
        maxWidth: 96,
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    iconWrapperActive: {
        backgroundColor: 'rgba(255, 0, 200, 0.08)',
    },
    iconWrapperActiveReduced: {
        backgroundColor: 'rgba(255, 0, 200, 0.15)',
    },
    iconGlow: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.glowMagenta,
        opacity: 0.55,
        zIndex: -1,
    },
    translucentFallback: {
        backgroundColor: colors.midnightOverlay,
    },
    nowPlayingWrapper: {
        position: 'absolute',
        top: -26,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'box-none',
    },
    nowPlayingPressable: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    nowPlayingGradient: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    nowPlayingHalo: {
        position: 'absolute',
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgba(0, 224, 255, 0.18)',
        zIndex: -1,
    },
})
