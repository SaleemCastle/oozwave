import React, { ReactNode } from 'react'
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import tokens from '../../theme/tokens'

const { colors, shadows } = tokens

interface NeonCardProps {
    children: ReactNode
    onPress?: () => void
    style?: StyleProp<ViewStyle>
    accentColor?: string
    disabled?: boolean
    accessibilityLabel?: string
}

const NeonCard: React.FC<NeonCardProps> = ({
    children,
    onPress,
    style,
    accentColor = colors.neonMagenta,
    disabled = false,
    accessibilityLabel,
}) => {
    const resolvedStyle = Array.isArray(style)
        ? style
        : style !== undefined && style !== null
            ? [style]
            : []
    const baseStyle = [styles.container, { borderColor: accentColor }, ...resolvedStyle]

    if (onPress) {
        return (
            <Pressable
                accessibilityRole='button'
                accessibilityLabel={ accessibilityLabel }
                disabled={ disabled }
                onPress={ onPress }
                style={({ pressed }) => [
                    ...baseStyle,
                    pressed ? styles.pressed : null,
                    disabled ? styles.disabled : null,
                ]}
            >
                <LinearGradient
                    colors={ ['rgba(255,0,200,0.12)', 'rgba(0,245,255,0.12)'] }
                    style={ styles.gradient }
                >
                    { children }
                </LinearGradient>
            </Pressable>
        )
    }

    return (
        <View style={ baseStyle }>
            <LinearGradient
                colors={ ['rgba(255,0,200,0.12)', 'rgba(0,245,255,0.12)'] }
                style={ styles.gradient }
            >
                { children }
            </LinearGradient>
        </View>
    )
}

export default NeonCard

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        // borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        // borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(10,0,22,0.65)',
        ...shadows.neonPill,
    },
    gradient: {
        flex: 1,
        padding: 16,
        // borderRadius: 24,
    },
    pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.92,
    },
    disabled: {
        opacity: 0.5,
    },
})
