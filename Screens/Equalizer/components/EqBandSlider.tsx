import React, { memo, useCallback } from 'react'
import { AccessibilityActionEvent, AccessibilityActionInfo, View } from 'react-native'
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated'
import { colors as themeColors } from '../../../theme/tokens'

type Props = {
  index: number
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  onRelease?: () => void
  label: string
  disabled?: boolean
  active?: boolean
  onActiveChange?: (active: boolean) => void
  height?: number
  reducedMotion?: boolean
}

// Avoid capturing JS helpers in worklets; inline math inside handlers

const KNOB_SIZE = 18

const EqBandSlider: React.FC<Props> = ({ value, min, max, onChange, onRelease, label, disabled, active, onActiveChange, height = 220, reducedMotion }) => {
  const trackHeight = height
  const range = max - min
  const progress = useSharedValue((value - min) / range)
  const isActive = useSharedValue(false)

  const toValue = (p: number) => {
    const raw = min + p * range
    return raw < min ? min : (raw > max ? max : raw)
  }
  const toProgress = (val: number) => {
    const raw = (val - min) / range
    return raw < 0 ? 0 : (raw > 1 ? 1 : raw)
  }

  React.useEffect(() => {
    // Avoid syncing from props while dragging to prevent jitter
    if (!active) {
      progress.value = toProgress(value)
    }
  }, [value, active])

  const reportActive = useCallback((a: boolean) => { onActiveChange?.(a) }, [onActiveChange])

  const onGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startP: number }>({
    onStart: (_, ctx) => {
      ctx.startP = progress.value
      isActive.value = true
      if (onActiveChange) runOnJS(reportActive)(true)
    },
    onActive: (evt, ctx) => {
      const deltaP = -evt.translationY / trackHeight
      let nextP = ctx.startP + deltaP
      nextP = nextP < 0 ? 0 : (nextP > 1 ? 1 : nextP)
      progress.value = nextP
      // inline toValue(nextP) with clamping
      let nextVal = min + nextP * range
      nextVal = nextVal < min ? min : (nextVal > max ? max : nextVal)
      nextVal = Math.abs(nextVal) < 0.25 ? 0 : nextVal
      runOnJS(onChange)(nextVal)
    },
    onEnd: () => {
      isActive.value = false
      if (onActiveChange) runOnJS(reportActive)(false)
      if (onRelease) runOnJS(onRelease)()
    },
    onCancel: () => {
      isActive.value = false
      if (onActiveChange) runOnJS(reportActive)(false)
    },
  })

  const knobStyle = useAnimatedStyle(() => {
    const y = (1 - progress.value) * trackHeight - KNOB_SIZE / 2
    const scale = reducedMotion ? 1 : withTiming(isActive.value ? 1.08 : 1, { duration: 160 })
    return {
      transform: [{ translateY: y }, { scale }],
      opacity: disabled ? 0.5 : 1,
    }
  }, [disabled, reducedMotion])

  const valueChipStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? (isActive.value ? 1 : 0) : withTiming(isActive.value ? 1 : 0, { duration: 200 }),
    transform: [{ translateY: (1 - progress.value) * trackHeight - KNOB_SIZE - 18 }],
  }))

  const accessibilityActions: ReadonlyArray<AccessibilityActionInfo> = React.useMemo(() => ([
    { name: 'increment', label: 'Increase' },
    { name: 'decrement', label: 'Decrease' },
  ]), [])

  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    const step = 0.5
    let next = value
    if (e.nativeEvent.actionName === 'increment') next = clamp(value + step, min, max)
    if (e.nativeEvent.actionName === 'decrement') next = clamp(value - step, min, max)
    onChange(snapNearZero(next))
    onRelease?.()
  }

  return (
    <PanGestureHandler enabled={!disabled} onGestureEvent={onGesture}>
      <Animated.View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Band ${label}`}
        accessibilityValue={{ now: Math.round(value * 10) / 10 }}
        accessibilityActions={accessibilityActions}
        onAccessibilityAction={onAccessibilityAction}
        style={{ width: 40, alignItems: 'center', paddingHorizontal: active ? 6 : 0 }}
      >
        <View style={{ position: 'relative', height: trackHeight, width: 2, backgroundColor: 'rgba(255,255,255,0.24)' }} />
        <Animated.View style={[{
          position: 'absolute',
          width: KNOB_SIZE, height: KNOB_SIZE, borderRadius: KNOB_SIZE / 2,
          borderWidth: 2, borderColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.1)',
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
        }, knobStyle]} />
        <Animated.View style={[{ position: 'absolute', top: -22, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'transparent' }, valueChipStyle]}>
          <Animated.Text style={{ color: themeColors.neonMagenta, fontSize: 10 }}>{`${value > 0 ? '+' : ''}${value.toFixed(1)}`}</Animated.Text>
        </Animated.View>
        <View style={{ marginTop: 10 }}>
          <Animated.Text style={{ color: themeColors.neonMagenta, fontSize: 11 }}>{label}</Animated.Text>
        </View>
      </Animated.View>
    </PanGestureHandler>
  )
}

export default memo(EqBandSlider)
