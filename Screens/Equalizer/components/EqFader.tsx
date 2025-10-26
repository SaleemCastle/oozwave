import React, { memo, useMemo } from 'react'
import { AccessibilityActionEvent, AccessibilityActionInfo, View } from 'react-native'
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedGestureHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

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

  React.useEffect(() => { progress.value = (value - min) / range }, [value])

  const onGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { start: number }>({
    onStart: (_, ctx) => { ctx.start = progress.value },
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
    onEnd: () => { if (onRelease) runOnJS(onRelease)() },
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

  const neonColor = value === 0 ? 'rgba(255,255,255,0.16)' : (value > 0 ? 'rgba(0,245,255,0.6)' : 'rgba(255,0,200,0.6)')

  return (
    <View style={{ marginVertical: 18 }}>
      <Animated.Text style={{ color: '#FFF', fontWeight: '600', marginBottom: 6 }}>{`${title}`}</Animated.Text>
      <Animated.Text style={{ color: '#FFF', opacity: 0.7, position: 'absolute', top: -6, right: 0 }}>{`${value > 0 ? '+' : ''}${value.toFixed(1)} dB`}</Animated.Text>
      <PanGestureHandler enabled={!disabled} onGestureEvent={onGesture}>
        <Animated.View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`${title} fader`}
          accessibilityValue={{ now: Math.round(value * 10) / 10 }}
          accessibilityActions={accessibilityActions}
          onAccessibilityAction={onAccessibilityAction}
          style={{ width: trackWidth, height: 36, justifyContent: 'center' }}
        >
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
            {Array.from({ length: Math.floor(trackWidth / 10) + 1 }).map((_, i) => (
              <View key={i} style={{ position: 'absolute', left: i * 10, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            ))}
          </View>
          <Animated.View style={[{ height: 2, backgroundColor: neonColor }, indicatorStyle]} />
          <Animated.View style={[{
            position: 'absolute', top: 10, width: 16, height: 16, borderRadius: 8,
            borderWidth: 2, borderColor: '#FFF', backgroundColor: 'rgba(16,0,32,0.66)'
          }, handleStyle]} />
        </Animated.View>
      </PanGestureHandler>
    </View>
  )
}

export default memo(EqFader)
