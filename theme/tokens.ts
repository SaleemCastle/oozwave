export const colors = {
    neonMagenta: '#FF00C8',
    neonMagentaSoft: 'rgba(255, 0, 200, 0.5)',
    midnightOverlay: 'rgba(20, 0, 40, 0.7)',
    lavenderFog: '#B8A6C7',
    cyanPulse: '#00E0FF',
    pureWhite: '#FFFFFF',
    deepShadow: 'rgba(0, 0, 0, 0.6)',
    glowMagenta: 'rgba(255, 0, 200, 0.35)',
}

export const radii = {
    pill: 36,
    circle: 32,
}

export const spacing = {
    inset: 16,
}

export const shadows = {
    neonPill: {
        shadowColor: colors.deepShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 12,
    },
    neonGlow: {
        shadowColor: colors.neonMagenta,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 0,
    },
}

export type ColorToken = keyof typeof colors
export type RadiusToken = keyof typeof radii
export type ShadowToken = keyof typeof shadows

const tokens = { colors, radii, spacing, shadows }

export default tokens
