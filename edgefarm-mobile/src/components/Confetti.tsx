import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { neon } from '../theme/neon'

const PARTICLE_COUNT = 50

type Particle = {
  id: number
  x: number
  y: number
  delay: number
  duration: number
  color: string
}

const colors = [neon.pink, neon.blue, neon.purple, neon.green, neon.amber]

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    delay: Math.random() * 500,
    duration: 2000 + Math.random() * 1000,
    color: colors[Math.floor(Math.random() * colors.length)],
  }))
}

export function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = React.useState<Particle[]>([])

  useEffect(() => {
    if (active) {
      setParticles(createParticles())
    }
  }, [active])

  if (!active) return null

  return (
    <View className="absolute inset-0 pointer-events-none">
      {particles.map((particle) => (
        <ConfettiParticle key={particle.id} particle={particle} />
      ))}
    </View>
  )
}

function ConfettiParticle({ particle }: { particle: Particle }) {
  const translateY = useSharedValue(particle.y)
  const translateX = useSharedValue(0)
  const rotate = useSharedValue(0)
  const opacity = useSharedValue(1)

  useEffect(() => {
    translateY.value = withDelay(
      particle.delay,
      withTiming(1000, {
        duration: particle.duration,
        easing: Easing.out(Easing.quad),
      })
    )
    translateX.value = withDelay(
      particle.delay,
      withTiming((Math.random() - 0.5) * 200, {
        duration: particle.duration,
        easing: Easing.inOut(Easing.sin),
      })
    )
    rotate.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(360, { duration: 500, easing: Easing.linear }),
        -1,
        false
      )
    )
    opacity.value = withDelay(
      particle.delay + particle.duration - 300,
      withTiming(0, { duration: 300 })
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      className="absolute"
      style={[
        style,
        {
          left: `${particle.x}%`,
          width: 8,
          height: 8,
          backgroundColor: particle.color,
          borderRadius: 2,
        },
      ]}
    />
  )
}

