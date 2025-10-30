import React, { memo, useMemo } from 'react'
import { AccessibilityActionEvent, AccessibilityActionInfo, View, StyleSheet } from 'react-native'
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { colors as themeColors } from '../../../theme/tokens'
import { Colors } from '../../../Constants'

type Props = {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  onRelease?: () => void
  title: string
  disabled?: boolean
  width?: number
}

// Note: Avoid capturing non-worklet helpers inside worklets; inline math instead

const EqFader: React.FC<Props> = ({ value, min, max, onChange, onRelease, title, disabled, width = 300 }) => {
  const trackWidth = width
  const range = max - min
  const progress = useSharedValue((value - min) / range)
  const draggingRef = React.useRef(false)
  const setDraggingTrue = () => { draggingRef.current = true }
  const setDraggingFalse = () => { draggingRef.current = false }
  
  React.useEffect(() => {
    if (!draggingRef.current) {
      progress.value = (value - min) / range
    }
  }, [value])

  const onGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { start: number }>({
    onStart: (_, ctx) => { ctx.start = progress.value; runOnJS(setDraggingTrue)() },
    onActive: (e, ctx) => {
      const dx = e.translationX
      const deltaP = dx / trackWidth
      // clamp 0..1 without calling JS helper
      let p = ctx.start + deltaP
      p = p < 0 ? 0 : (p > 1 ? 1 : p)
      progress.value = p
      let nextVal = min + p * range
      // snap near zero
      nextVal = Math.abs(nextVal) < 0.25 ? 0 : nextVal
      runOnJS(onChange)(nextVal as number)
    },
    onEnd: () => { runOnJS(setDraggingFalse)(); if (onRelease) runOnJS(onRelease)() },
  })

  const handleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * trackWidth - 8 }] }))
  const indicatorStyle = useAnimatedStyle(() => ({ width: progress.value * trackWidth }))

  const accessibilityActions: ReadonlyArray<AccessibilityActionInfo> = useMemo(() => ([
    { name: 'increment', label: 'Increase' },
    { name: 'decrement', label: 'Decrease' },
  ]), [])

  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    const step = 0.5
    let next = value
    if (e.nativeEvent.actionName === 'increment') next = Math.min(max, Math.max(min, value + step))
    if (e.nativeEvent.actionName === 'decrement') next = Math.min(max, Math.max(min, value - step))
    onChange(Math.abs(next) < 0.25 ? 0 : next)
    onRelease?.()
  }

  const neonColor = value === 0 ? 'rgba(255,255,255,0.16)' : (value > 0 ? themeColors.cyanPulse : themeColors.neonMagenta)

  // Precompute a small, fixed set of tick positions (major every 2 dB, minor every 1 dB)
  const TICKS = useMemo(() => {
    const count = 21 // 0..20
    const arr = new Array(count).fill(0).map((_, i) => i / (count - 1))
    return arr
  }, [])

  return (
    <View style={{ marginVertical: 18 }}>
      <Animated.Text style={{ color: '#FFF', fontWeight: '600', marginBottom: 6 }}>{`${title}`}</Animated.Text>
      <Animated.Text style={{ color: '#FFF', opacity: 0.7, position: 'absolute', top: -6, right: 0 }}>{`${value > 0 ? '+' : ''}${value.toFixed(1)} dB`}</Animated.Text>
      <PanGestureHandler enabled={!disabled} onGestureEvent={onGesture}>
        <Animated.View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`${title} fader`}
          accessibilityValue={{ now: Number.isFinite(value) ? Math.round(value * 10) / 10 : 0 }}
          accessibilityActions={accessibilityActions}
          onAccessibilityAction={onAccessibilityAction}
          style={{ width: trackWidth, height: 36, justifyContent: 'center' }}
        >
          <View style={styles.ticksContainer}>
            {TICKS.map((p, i) => (
              <View key={i} style={[styles.tick, { left: p * trackWidth, opacity: (i % 5 === 0) ? 0.28 : 0.12, height: (i % 5 === 0) ? 16 : 10, top: (i % 5 === 0) ? 0 : 3 }]} />
            ))}
          </View>
          <Animated.View style={[styles.indicator, { backgroundColor: neonColor }, indicatorStyle]} />
          <Animated.View style={[styles.handle, handleStyle]} />
        </Animated.View>
      </PanGestureHandler>
    </View>
  )
}

export default memo(EqFader)

const styles = StyleSheet.create({
  ticksContainer: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
  },
  tick: {
    position: 'absolute', width: 1, backgroundColor: 'rgba(255,255,255,0.8)'
  },
  indicator: {
    height: 2,
  },
  handle: {
    position: 'absolute', top: 10, width: 16, height: 16, borderRadius: 8,
    borderWidth: 4, borderColor: '#FFF', backgroundColor: Colors.background,
  },
})
