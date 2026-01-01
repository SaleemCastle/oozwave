import React, { useEffect, useRef, useState } from 'react'
import { Animated, DeviceEventEmitter, Easing, StyleSheet, Text, View } from 'react-native'

type ToastEvent = { message: string, durationMs?: number }

const AppToast: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const opacity = useRef(new Animated.Value(0)).current
  const translate = useRef(new Animated.Value(16)).current
  const hideTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('appToast', (evt: ToastEvent) => {
      const text = evt?.message ?? ''
      const duration = Math.max(800, Math.min(4000, evt?.durationMs ?? 1800))
      if (!text) return
      if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
      setMessage(text)
      setVisible(true)
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translate, { toValue: 0, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start()
      hideTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(translate, { toValue: 16, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]).start(() => {
          setVisible(false)
          setMessage(null)
        })
      }, duration)
    })
    return () => { sub.remove(); if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [opacity, translate])

  if (!visible || !message) return null
  return (
    <View pointerEvents='none' style={styles.wrap}>
      <Animated.View style={[styles.toast, { opacity, transform: [{ translateY: translate }] }]}>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    maxWidth: '86%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 16,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
})

export default AppToast

