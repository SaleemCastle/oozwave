import React from 'react'
import { View } from 'react-native'
import styled from 'styled-components/native'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import { CoverImage } from 'react-native-get-music-files-v3dev-test'

import tokens from '../theme/tokens'
import { Colors } from '../Constants'
import { McText } from '.'

const { colors, radii, shadows } = tokens as any

type Props = {
  title: string
  subtitle?: string
  description?: string
  accentColor?: string
  emoji?: string | null
  privacyLabel?: string
  imagePaths?: string[]
}

const PlaylistHeroCard: React.FC<Props> = ({ title, subtitle, description, accentColor, emoji, privacyLabel, imagePaths }) => {
  const accent = accentColor ?? colors.neonMagenta
  return (
    <CardContainer>
      <GradientBorder colors={[accent, 'rgba(255,255,255,0.15)']}>
        <CardSurface>
          {Array.isArray(imagePaths) && imagePaths.length > 0 && (
            <Montage pointerEvents='none'>
              {imagePaths.slice(0, 6).map((p, idx) => (
                <Tile key={`${idx}_${p}`}>
                  {/* @ts-ignore library expects file path */}
                  <CoverImage src={p} width={120} height={80} style={{ width: '100%', height: '100%' }} />
                </Tile>
              ))}
              {/* subtle dark overlay to ensure readability */}
              <Overlay style={{ backgroundColor: 'rgba(0,0,0,0.35)' }} />
              {/* accent tint overlay with low opacity */}
              <LinearGradient colors={[accent, 'transparent']} style={{ ...StyleSheetAbsoluteFill, opacity: 0.08 }} />
            </Montage>
          )}
          <InnerCard style={ shadows?.neonPill }>
            <Row>
              <Avatar borderColor={accent}>
                {emoji ? (
                  <McText size={28}>{emoji}</McText>
                ) : (
                  <LinearGradient style={{ flex: 1, borderRadius: 28 }} colors={[accent, 'rgba(255,255,255,0.14)']} />
                )}
              </Avatar>
              <View style={{ flex: 1 }}>
                <McText semi size={20} color={Colors.grey5} numberOfLines={1}>{title}</McText>
                {!!subtitle && (
                  <McText size={13} color={'rgba(255,255,255,0.7)'} style={{ marginTop: 4 }} numberOfLines={1}>{subtitle}</McText>
                )}
                {!!description && (
                  <McText size={13} color={'rgba(255,255,255,0.6)'} style={{ marginTop: 6 }} numberOfLines={2}>{description}</McText>
                )}
              </View>
            </Row>
            {!!privacyLabel && (
              <PrivacyBadge>
                <McText medium size={11} color={Colors.grey5}>{privacyLabel}</McText>
              </PrivacyBadge>
            )}
          </InnerCard>
        </CardSurface>
      </GradientBorder>
    </CardContainer>
  )
}

const CardContainer = styled.View`
  margin-bottom: 16px;
`

const GradientBorder = styled(LinearGradient)`
  padding: 1px;
  border-radius: 16px;
`

const CardSurface = styled.View`
  position: relative;
  border-radius: 16px;
  overflow: hidden;
`

const InnerCard = styled.View`
  background-color: rgba(16, 0, 32, 0.85);
  border-radius: 16px;
  padding: 14px;
`

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`

const Avatar = styled.View<{ borderColor: string }>`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  overflow: hidden;
  border-width: 2px;
  border-color: ${({ borderColor }) => borderColor};
  margin-right: 12px;
  align-items: center;
  justify-content: center;
`

const PrivacyBadge = styled.View`
  align-self: flex-start;
  margin-top: 12px;
  padding: 6px 10px;
  border-radius: 12px;
  background-color: rgba(255,255,255,0.08);
`

const Montage = styled.View`
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  flex-wrap: wrap;
  flex-direction: row;
  opacity: 0.28;
`

const Tile = styled.View`
  width: 33.3333%;
  height: 50%;
`

const Overlay = styled.View`
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
`

const StyleSheetAbsoluteFill = { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 }

export default PlaylistHeroCard
