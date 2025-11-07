import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    AccessibilityInfo,
    Animated as RNAnimated,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native'
// Note: Simplified (no Reanimated) for arc to avoid Hermes issues
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Svg, { Circle } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import tokens from '../theme/tokens'
import TrackPlayer, { State as TPState, useProgress } from 'react-native-track-player'
import { useAppSelector } from '../hooks/reduxHooks'
import { Vibration } from 'react-native'

const { colors, radii, shadows } = tokens

const BlurView: React.ComponentType<any> | null = null

interface CustomTabBarProps extends BottomTabBarProps {
    showNowPlaying?: boolean
    onNowPlayingPress?: () => void
}

const ICONS: Record<string, string> = {
    Home: 'home',
    Library: 'folder-music',
    LibraryTab: 'folder-music',
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
    const scale = useRef(new RNAnimated.Value(focused ? 1.08 : 1)).current

    useEffect(() => {
        if (prefersReducedMotion) {
            scale.setValue(1)
            return
        }

        RNAnimated.timing(scale, {
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
            <RNAnimated.View
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
            </RNAnimated.View>
        </Pressable>
    )
}, (prev, next) => (
    prev.focused === next.focused &&
    prev.label === next.label &&
    prev.iconName === next.iconName &&
    prev.prefersReducedMotion === next.prefersReducedMotion
))

// Compact mini player that fits a tab slot (top-level)
const MiniTabPlayer: React.FC<{ onOpenPlayer?: () => void }> = ({ onOpenPlayer }) => {
    const currentTrack = useAppSelector((s) => (s as any).currentTrack)
    const playerState = useAppSelector((s) => (s as any).currentPlayerState?.playerState as string | undefined)
    const haptics = useAppSelector((s) => (s as any).settings?.haptics as boolean)
    const isPlaying = playerState === TPState.Playing.toString()
    const { position, duration } = useProgress(0.1)

    const onToggle = useCallback(async () => {
        if (haptics) Vibration.vibrate(10)
        try {
            if (isPlaying) {
                await TrackPlayer.pause()
            } else {
                await TrackPlayer.play()
            }
        } catch {}
    }, [haptics, isPlaying])

    const iconColor = isPlaying ? colors.neonMagenta : colors.lavenderFog

    const pct = duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0
    

    const size = 44
    const stroke = 3
    const r = (size - stroke) / 2
    const cx = size / 2
    const cy = size / 2
    const circumference = 2 * Math.PI * r

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={ isPlaying ? 'Pause' : 'Play' }
            onPress={ onToggle }
            onLongPress={ onOpenPlayer }
            hitSlop={ 12 }
            style={ styles.tabPressable }
        >
            <View style={ styles.ringWrapper }>
                <Svg width={ size } height={ size } style={ styles.ringSvg }>
                    <Circle
                        cx={ cx }
                        cy={ cy }
                        r={ r }
                        stroke={'rgba(255, 0, 200, 0.25)'}
                        strokeWidth={ stroke }
                        fill={'transparent'}
                    />
                    <Circle
                        cx={ cx }
                        cy={ cy }
                        r={ r }
                        stroke={ colors.neonMagenta }
                        strokeWidth={ stroke }
                        strokeLinecap={'round'}
                        fill={'transparent'}
                        strokeDasharray={ `${circumference}, ${circumference}` }
                        strokeDashoffset={ circumference - (pct * circumference) }
                        transform={`rotate(-90 ${cx} ${cy})`}
                    />
                </Svg>
                <View style={ styles.iconCenter }>
                    <View style={[styles.iconWrapper, isPlaying && styles.iconWrapperActive]}>
                        <Icon name={ isPlaying ? 'pause' : 'play' } size={ 22 } color={ iconColor } />
                    </View>
                </View>
            </View>
        </Pressable>
    )
}

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
    const focusedIndex = state.index
    const miniSlot = useAppSelector((s) => (s as any).settings?.miniPlayerTabSlot as 'currentTab' | 'homeTab')
    const homeIndex = routes.findIndex((r) => r.name === 'Home')
    const hasTrack = useAppSelector((s) => Boolean((s as any).currentTrack?.title))

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

                        const targetIndex = miniSlot === 'homeTab' && homeIndex >= 0 ? homeIndex : focusedIndex
                        if (showNowPlaying && hasTrack && index === targetIndex) {
                            return (
                                <MiniTabPlayer key={ route.key } onOpenPlayer={ onNowPlayingPress } />
                            )
                        }

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
    ringWrapper: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    ringSvg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    iconCenter: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    }
})
