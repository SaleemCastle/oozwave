import React, { memo } from 'react'
import { Animated, Dimensions, Pressable, StyleSheet, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'

import tokens from '../theme/tokens'
import { McText } from '.'

const { colors, radii, shadows } = tokens

const { width: screenWidth } = Dimensions.get('window')

export interface DrawerOption {
    id: string
    label: string
    icon: string
    onPress?: () => void
    accentColor?: string
}

interface AppDrawerProps {
    visible: boolean
    progress: Animated.Value
    onClose: () => void
    options: DrawerOption[]
}

const AppDrawer: React.FC<AppDrawerProps> = ({ visible, progress, onClose, options }) => {
    if (!visible) {
        return null
    }

    const overlayStyle = {
        opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
        }),
    }

    const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [screenWidth, 0],
    })

    return (
        <View pointerEvents='box-none' style={ StyleSheet.absoluteFill }>
            <Animated.View
                pointerEvents='none'
                style={[StyleSheet.absoluteFillObject, styles.overlay, overlayStyle]}
            />
            <Pressable
                accessibilityRole='button'
                accessibilityLabel='Close menu'
                onPress={ onClose }
                style={ StyleSheet.absoluteFill }
            />
            <Animated.View
                style={[styles.drawer, { transform: [{ translateX }] }]}
            >
                <View style={ styles.headerRow }>
                    <McText extra size={ 22 } color={ colors.pureWhite }>Quick actions</McText>
                    <Pressable
                        accessibilityRole='button'
                        accessibilityLabel='Close menu'
                        onPress={ onClose }
                        style={ styles.closeButton }
                        hitSlop={ 12 }
                    >
                        <Icon name='x' size={ 20 } color={ colors.pureWhite } />
                    </Pressable>
                </View>
                <View style={ styles.grid }>
                    {
                        options.map((option) => (
                            <Pressable
                                key={ option.id }
                                accessibilityRole='button'
                                onPress={ () => {
                                    option.onPress?.()
                                    onClose()
                                } }
                                style={[styles.tile, option.accentColor ? { borderColor: option.accentColor } : null]}
                            >
                                <View style={ styles.tileIconContainer }>
                                    <Icon
                                        name={ option.icon }
                                        size={ 24 }
                                        color={ option.accentColor ?? colors.neonMagenta }
                                    />
                                </View>
                                <McText medium size={ 16 } color={ colors.pureWhite } style={ styles.tileLabel }>
                                    { option.label }
                                </McText>
                            </Pressable>
                        ))
                    }
                </View>
            </Animated.View>
        </View>
    )
}

export default memo(AppDrawer)

const styles = StyleSheet.create({
    overlay: {
        backgroundColor: 'rgba(6, 0, 18, 0.82)',
    },
    drawer: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: screenWidth,
        paddingTop: 72,
        paddingHorizontal: 28,
        backgroundColor: 'rgba(18, 0, 32, 0.94)',
        borderTopLeftRadius: radii.pill,
        borderBottomLeftRadius: radii.pill,
        ...shadows.neonPill,
        zIndex:999
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.neonMagentaSoft,
        backgroundColor: 'rgba(255, 0, 200, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    tile: {
        width: (screenWidth - 28 * 2 - 24) / 2,
        height: 120,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.neonMagentaSoft,
        backgroundColor: 'rgba(26, 10, 46, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        marginBottom: 12,
    },
    tileIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 0, 200, 0.08)',
    },
    tileLabel: {
        textTransform: 'capitalize',
        textAlign: 'center',
    },
})
