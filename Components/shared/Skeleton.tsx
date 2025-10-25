import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Animated, LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

type Props = { style?: StyleProp<ViewStyle> }

const Shimmer: React.FC<{ borderRadius?: number; style?: StyleProp<ViewStyle> }> = ({ borderRadius = 8, style }) => {
  const [width, setWidth] = useState(0)
  const translate = useRef(new Animated.Value(-200)).current
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width)
  }, [])
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translate, { toValue: width + 200, duration: 1300, useNativeDriver: true }),
        Animated.timing(translate, { toValue: -200, duration: 0, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [translate, width])
  return (
    <View onLayout={onLayout} style={[{ backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', borderRadius }, style]}>
      <Animated.View style={{ position: 'absolute', left: -200, top: 0, bottom: 0, width: 200, transform: [{ translateX: translate }] }}>
        <LinearGradient colors={[ 'transparent', 'rgba(255,255,255,0.18)', 'transparent' ]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  )
}

export const SkeletonRect: React.FC<Props> = ({ style }) => (
  <Shimmer style={style} />
)

export const SkeletonCircle: React.FC<Props> = ({ style }) => (
  <Shimmer borderRadius={36} style={[{ width: 72, height: 72 }, style]} />
)

export default SkeletonRect
