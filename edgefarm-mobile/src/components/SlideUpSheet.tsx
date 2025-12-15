import React, { useEffect } from 'react'
import { Pressable, useWindowDimensions, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

export function SlideUpSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const { height } = useWindowDimensions()
  const t = useSharedValue(0)

  useEffect(() => {
    t.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 260 : 180,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
    })
  }, [visible, t])

  const backdrop = useAnimatedStyle(() => ({ opacity: t.value }))
  const sheet = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - t.value) * Math.min(520, height) }],
  }))

  // Keep mounted for close animation.
  if (!visible && t.value === 0) return null

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        {
          position: 'absolute',
          inset: 0,
          justifyContent: 'flex-end',
        },
        backdrop,
      ]}
    >
      <Pressable onPress={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.70)' }} />
      <Animated.View
        style={[
          sheet,
          {
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            overflow: 'hidden',
            backgroundColor: 'rgba(10,10,20,0.86)',
            borderWidth: 1,
            borderColor: 'rgba(56,189,248,0.18)',
          },
        ]}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>{children}</View>
      </Animated.View>
    </Animated.View>
  )
}
