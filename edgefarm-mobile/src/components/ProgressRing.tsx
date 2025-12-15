import React from 'react'
import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

export function ProgressRing({
  size,
  strokeWidth,
  progress,
  trackColor,
  progressColor,
}: {
  size: number
  strokeWidth: number
  progress: number // 0..1
  trackColor: string
  progressColor: string
}) {
  const p = Math.max(0, Math.min(1, progress))
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const dash = c * (1 - p)

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dash}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
    </View>
  )
}
