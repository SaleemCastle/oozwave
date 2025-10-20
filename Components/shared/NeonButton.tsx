import React, { ReactNode } from 'react'
import { Pressable, PressableStateCallbackType, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import tokens from '../../theme/tokens'
import McText from '../McText'

const { colors, shadows } = tokens

type NeonButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface NeonButtonProps {
    title: string
    onPress: () => void
    icon?: ReactNode
    variant?: NeonButtonVariant
    disabled?: boolean
    style?: StyleProp<ViewStyle>
    textStyle?: StyleProp<TextStyle>
    accessibilityLabel?: string
    fullWidth?: boolean
}

const gradientForVariant: Record<Exclude<NeonButtonVariant, 'ghost'>, [string, string]> = {
    primary: [colors.neonMagenta, colors.cyanPulse],
    secondary: ['rgba(255, 0, 200, 0.35)', 'rgba(0, 245, 255, 0.35)'],
    danger: ['#FF3D71', '#FF8800'],
}

const NeonButton: React.FC<NeonButtonProps> = ({
    title,
    onPress,
    icon,
    variant = 'primary',
    disabled = false,
    style,
    textStyle,
    accessibilityLabel,
    fullWidth = false,
}) => {
    const renderContent = (state: PressableStateCallbackType) => {
        const content = (
            <View style={[styles.content, fullWidth && styles.fullWidth, state.pressed && styles.pressedContent]}>
                { icon ? <View style={ styles.iconContainer }>{ icon }</View> : null }
                <McText
                    semi
                    style={[
                        styles.label,
                        variant === 'ghost' ? styles.ghostLabel : null,
                        disabled ? styles.disabledLabel : null,
                        textStyle,
                    ]}
                >
                    { title }
                </McText>
            </View>
        )

        if (variant === 'ghost') {
            return (
                <View style={[styles.ghostBase, fullWidth && styles.fullWidth]}>
                    { content }
                </View>
            )
        }

        const gradient = gradientForVariant[variant === 'secondary' ? 'secondary' : variant]
        return (
            <LinearGradient
                colors={ gradient }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, fullWidth && styles.fullWidth]}
            >
                { content }
            </LinearGradient>
        )
    }

    return (
        <Pressable
            accessibilityRole='button'
            accessibilityLabel={ accessibilityLabel ?? title }
            disabled={ disabled }
            onPress={ onPress }
            style={({ pressed }) => [
                styles.base,
                variant === 'ghost' ? styles.ghost : styles.elevated,
                disabled ? styles.disabled : null,
                pressed ? styles.pressed : null,
                style,
            ]}
            hitSlop={ 12 }
        >
            { renderContent }
        </Pressable>
    )
}

export default NeonButton

const styles = StyleSheet.create({
    base: {
        borderRadius: 999,
        overflow: 'hidden',
        minHeight: 48,
    },
    elevated: {
        ...shadows.neonGlow,
    },
    ghost: {
        borderWidth: 1,
        borderColor: colors.neonMagenta,
    },
    ghostBase: {
        paddingHorizontal: 20,
        borderRadius: 999,
    },
    content: {
        minHeight: 48,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

    },
    fullWidth: {
        alignSelf: 'stretch',
        width: '100%',
    },
    gradient: {
        borderRadius: 999,
    },
    pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.92,
    },
    pressedContent: {
        opacity: 0.9,
    },
    label: {
        color: colors.pureWhite,
        fontSize: 16,
        fontWeight: '600',
    },
    ghostLabel: {
        color: colors.neonMagenta,
    },
    disabled: {
        opacity: 0.4,
    },
    disabledLabel: {
        color: 'rgba(255,255,255,0.6)',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
})

