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
    const containerStyle = [styles.container, style]
    if (onPress) {
        return (
            <Pressable
                accessibilityRole='button'
                accessibilityLabel={ accessibilityLabel }
                disabled={ disabled }
                onPress={ onPress }
                style={({ pressed }) => [containerStyle, pressed ? styles.pressed : null, disabled ? styles.disabled : null]}
            >
                <LinearGradient
                    colors={ ['rgba(255,0,200,0.12)', 'rgba(0,245,255,0.12)'] }
                    style={[styles.gradient, { borderColor: accentColor }]}
                >
                    { children }
                </LinearGradient>
            </Pressable>
        )
    }

    return (
        <View style={ containerStyle }>
            <LinearGradient
                colors={ ['rgba(255,0,200,0.12)', 'rgba(0,245,255,0.12)'] }
                style={[styles.gradient, { borderColor: accentColor }]}
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
        height: 200,
        width: 200,
        // ...shadows.neonPill,
    },
    gradient: {
        padding: 8,
    },
    pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.92,
    },
    disabled: {
        opacity: 0.5,
    },
})
