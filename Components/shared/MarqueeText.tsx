import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import McText from '../McText'

type TextStyleProps = {
  color?: string
  size?: number
  align?: string
  regular?: any
  bold?: any
  semi?: any
  extra?: any
  black?: any
  medium?: any
}

type Props = TextStyleProps & {
  text: string
  containerStyle?: any
}

const BOUNCE = 4
const GAP = 28

const MarqueeText: React.FC<Props> = ({ text, containerStyle, ...textStyle }) => {
  const [containerWidth, setContainerWidth] = useState(0)
  const [textWidth, setTextWidth] = useState(0)

  const translateX = useSharedValue(0)

  const approxCharWidth = (textStyle.size ?? 12) * 0.6
  const estimatedWidth = useMemo(() => Math.max(textWidth, Math.ceil(text.length * approxCharWidth)), [textWidth, text.length, approxCharWidth])
  const needsScroll = estimatedWidth > 0 && containerWidth > 0 && estimatedWidth > containerWidth
  const distance = useMemo(() => Math.max(0, estimatedWidth - containerWidth + GAP), [estimatedWidth, containerWidth])

  useEffect(() => {
    translateX.value = 0
    if (!needsScroll) return

    const moveMs = Math.min(14000, Math.max(4500, Math.round(((estimatedWidth + GAP) / 140) * 1000)))

    translateX.value = withRepeat(
      withSequence(
        withTiming(-distance, { duration: moveMs, easing: Easing.linear }),
        withTiming(-distance - BOUNCE, { duration: 220, easing: Easing.out(Easing.cubic) }),
        withTiming(-distance, { duration: 200, easing: Easing.in(Easing.cubic) }),
        withTiming(0, { duration: moveMs, easing: Easing.linear }),
        withTiming(BOUNCE, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      false
    )
  }, [estimatedWidth, containerWidth, distance, needsScroll, translateX])

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))

  const onContainerLayout = useCallback((e: any) => {
    const w = e?.nativeEvent?.layout?.width
    if (typeof w === 'number') setContainerWidth(w)
  }, [])

  const onMeasureText = useCallback((e: any) => {
    const w = e?.nativeEvent?.layout?.width
    if (typeof w === 'number') setTextWidth(w)
  }, [])

  const contentW = needsScroll ? (estimatedWidth * 2 + GAP) : undefined

  return (
    <View style={[{ overflow: 'hidden', flexShrink: 1, maxWidth: '100%', width: '100%' }, containerStyle]} onLayout={onContainerLayout}>
      {needsScroll ? (
        <Animated.View style={[{ flexDirection: 'row', width: contentW }, animatedStyle]}>
          <McText {...textStyle} numberOfLines={1} ellipsizeMode="clip" onLayout={onMeasureText} style={{ width: estimatedWidth, flexShrink: 0 }}>
            {text}
          </McText>
          <View style={{ width: GAP }} />
          <McText {...textStyle} numberOfLines={1} ellipsizeMode="clip" style={{ width: estimatedWidth, flexShrink: 0 }}>
            {text}
          </McText>
        </Animated.View>
      ) : (
        <McText {...textStyle} numberOfLines={1} ellipsizeMode="clip" onLayout={onMeasureText}>
          {text}
        </McText>
      )}
    </View>
  )
}

export default MarqueeText
