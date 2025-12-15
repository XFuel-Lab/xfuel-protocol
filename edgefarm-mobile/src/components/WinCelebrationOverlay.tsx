import React, { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Confetti } from './Confetti'
import { neon } from '../theme/neon'

export function WinCelebrationOverlay({
  visible,
  amount,
  isWinner,
  onClose,
}: {
  visible: boolean
  amount: number
  isWinner: boolean
  onClose: () => void
}) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.5)
  const glow = useSharedValue(0)
  const pulse = useSharedValue(1)

  useEffect(() => {
    if (!visible) {
      opacity.value = 0
      scale.value = 0.5
      glow.value = 0
      pulse.value = 1
      return
    }

    opacity.value = withTiming(1, { duration: 300 })
    scale.value = withSpring(1, { damping: 10, stiffness: 100 })
    glow.value = withDelay(200, withTiming(1, { duration: 600 }))
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    )

    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [visible, onClose, opacity, scale, glow, pulse])

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: pulse.value }],
  }))

  if (!visible) return null

  return (
    <Animated.View
      className="absolute inset-0 items-center justify-center z-50"
      style={[backdropStyle, { backgroundColor: 'rgba(0,0,0,0.85)' }]}
    >
      <Pressable className="absolute inset-0" onPress={onClose} />
      <Confetti active={visible && isWinner} />

      <Animated.View
        className="w-[90%] rounded-3xl border px-6 py-8"
        style={[
          cardStyle,
          {
            backgroundColor: 'rgba(20,20,36,0.95)',
            borderColor: isWinner ? 'rgba(251, 113, 133, 0.5)' : 'rgba(168, 85, 247, 0.4)',
          },
        ]}
      >
        <View className="items-center">
          {isWinner ? (
            <>
              <Animated.View
                className="mb-4 h-20 w-20 items-center justify-center rounded-full border-2"
                style={[
                  glowStyle,
                  {
                    borderColor: neon.pink,
                    backgroundColor: 'rgba(251, 113, 133, 0.15)',
                    shadowColor: neon.pink,
                    shadowOpacity: 0.8,
                    shadowRadius: 20,
                  },
                ]}
              >
                <Text className="text-4xl">🎉</Text>
              </Animated.View>

              <Text
                className="text-2xl font-bold text-center"
                style={{ color: neon.pink }}
              >
                You Won!
              </Text>
              <Text className="mt-2 text-center text-lg font-semibold text-white">
                ${amount.toLocaleString()} loser pot
              </Text>
              <Text className="mt-3 text-center text-sm" style={{ color: neon.muted }}>
                Auto-staked to your account
              </Text>
            </>
          ) : (
            <>
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full border-2" style={{ borderColor: neon.purple }}>
                <Text className="text-4xl">⭐</Text>
              </View>

              <Text className="text-xl font-bold text-center text-white">
                Your fans tipped ${amount.toLocaleString()}
              </Text>
              <Text className="mt-2 text-center text-lg font-semibold" style={{ color: neon.green }}>
                — your cut ${(amount * 0.1).toLocaleString()}
              </Text>
            </>
          )}

          <Pressable
            className="mt-6 rounded-xl border px-6 py-3"
            style={{ borderColor: neon.cardBorder }}
            onPress={onClose}
          >
            <Text className="text-sm font-semibold text-white">Close</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  )
}

