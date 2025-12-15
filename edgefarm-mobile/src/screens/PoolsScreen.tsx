import React, { useEffect, useMemo, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { NeonCard } from '../components/NeonCard'
import { NeonButton } from '../components/NeonButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { TipSuccessOverlay } from '../components/TipSuccessOverlay'
import { WinCelebrationOverlay } from '../components/WinCelebrationOverlay'
import { getAppExtra } from '../lib/appConfig'
import { neon } from '../theme/neon'
import { useCountdown } from '../hooks/useCountdown'
import { addWinning } from '../lib/winningsStore'

type EventRow = {
  id: string
  title: string
  winnerPot: number
  loserPot: number
  lotteryPot: number
  endTime: number
  hasDrawn: boolean
}

export function PoolsScreen() {
  const [successVisible, setSuccessVisible] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [winCelebrationVisible, setWinCelebrationVisible] = useState(false)
  const [winAmount, setWinAmount] = useState(0)
  const [isWinner, setIsWinner] = useState(false)
  const [drawnEvents, setDrawnEvents] = useState<Set<string>>(new Set())
  const { lotteryJackpot, globalLotteryCutBps } = getAppExtra()
  const globalLotteryPct = (globalLotteryCutBps / 100).toFixed(0)

  const events: EventRow[] = useMemo(
    () => [
      {
        id: 'e1',
        title: 'Cloud9 vs Dignitas Finals',
        winnerPot: 124_800,
        loserPot: 78_300,
        lotteryPot: 22_340,
        endTime: Date.now() + 2 * 60 * 1000, // 2 minutes from now
        hasDrawn: false,
      },
      {
        id: 'e2',
        title: 'Sentinels vs LOUD Showmatch',
        winnerPot: 64_250,
        loserPot: 41_900,
        lotteryPot: 11_750,
        endTime: Date.now() + 5 * 60 * 1000, // 5 minutes from now
        hasDrawn: false,
      },
      {
        id: 'e3',
        title: 'T1 vs Gen.G Grand Final',
        winnerPot: 92_110,
        loserPot: 58_420,
        lotteryPot: 15_980,
        endTime: Date.now() + 10 * 60 * 1000, // 10 minutes from now
        hasDrawn: false,
      },
    ],
    []
  )

  const tip = (side: 'winner' | 'loser', eventTitle: string) => {
    const entered = side === 'loser'
    setSuccessMsg(
      entered
        ? `You entered ${lotteryJackpot} lottery (${globalLotteryPct}% global pot)\nEvent: ${eventTitle}`
        : `Tip placed on Winner\nEvent: ${eventTitle}`
    )
    setSuccessVisible(true)
  }

  const handleLotteryDraw = (event: EventRow) => {
    if (drawnEvents.has(event.id)) return

    setDrawnEvents((prev) => new Set(prev).add(event.id))

    // Mock: 30% chance of winning
    const won = Math.random() < 0.3
    const amount = event.lotteryPot

    if (won) {
      setIsWinner(true)
      setWinAmount(amount)
      addWinning({
        eventTitle: event.title,
        amount,
        type: 'lottery_win',
      })
    } else {
      // Mock: show tip cut for loser star
      setIsWinner(false)
      const tipAmount = event.loserPot
      const tipCut = tipAmount * 0.1 // 10% cut
      setWinAmount(tipAmount) // Show full tip amount in message
      addWinning({
        eventTitle: event.title,
        amount: tipCut,
        type: 'tip_cut',
      })
    }

    setWinCelebrationVisible(true)
  }

  return (
    <ScreenBackground>
      <SafeAreaView className="flex-1">
        <View className="px-4 pt-3">
          <Text className="text-2xl font-bold text-white">Tip Pools</Text>
          <View
            className="mt-3 rounded-2xl border px-4 py-3"
            style={{ borderColor: 'rgba(251, 113, 133, 0.35)', backgroundColor: 'rgba(251, 113, 133, 0.10)' }}
          >
            <Text className="text-sm font-semibold" style={{ color: neon.pink }}>
              {globalLotteryPct}% of every tip feeds the global lottery
            </Text>
            <Text className="mt-1 text-xs" style={{ color: neon.muted }}>
              Tip Loser to enter. Winners still earn the main pot.
            </Text>
          </View>
        </View>

        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
          renderItem={({ item }) => (
            <PoolCard
              event={item}
              onTip={tip}
              onLotteryDraw={handleLotteryDraw}
              isDrawn={drawnEvents.has(item.id)}
            />
          )}
        />

        <TipSuccessOverlay
          visible={successVisible}
          message={successMsg}
          onClose={() => setSuccessVisible(false)}
        />

        <WinCelebrationOverlay
          visible={winCelebrationVisible}
          amount={winAmount}
          isWinner={isWinner}
          onClose={() => setWinCelebrationVisible(false)}
        />
      </SafeAreaView>
    </ScreenBackground>
  )
}

function PoolCard({
  event,
  onTip,
  onLotteryDraw,
  isDrawn,
}: {
  event: EventRow
  onTip: (side: 'winner' | 'loser', eventTitle: string) => void
  onLotteryDraw: (event: EventRow) => void
  isDrawn: boolean
}) {
  const countdown = useCountdown(event.endTime)
  const pulseScale = useSharedValue(1)

  useEffect(() => {
    if (!countdown.isExpired && !isDrawn) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    }
  }, [countdown.isExpired, isDrawn])

  useEffect(() => {
    if (countdown.isExpired && !isDrawn) {
      onLotteryDraw(event)
    }
  }, [countdown.isExpired, isDrawn])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  const lotteryPotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  return (
    <NeonCard>
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-white">{event.title}</Text>
        {!isDrawn && (
          <View
            className="rounded-lg border px-3 py-1.5"
            style={{
              borderColor: countdown.isExpired ? neon.green : neon.pink,
              backgroundColor: countdown.isExpired
                ? 'rgba(52, 211, 153, 0.15)'
                : 'rgba(251, 113, 133, 0.15)',
            }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: countdown.isExpired ? neon.green : neon.pink }}
            >
              {countdown.isExpired ? 'DRAWING...' : countdown.formatted}
            </Text>
          </View>
        )}
        {isDrawn && (
          <View
            className="rounded-lg border px-3 py-1.5"
            style={{
              borderColor: neon.green,
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
            }}
          >
            <Text className="text-xs font-bold" style={{ color: neon.green }}>
              DRAWN
            </Text>
          </View>
        )}
      </View>

      <View className="mt-3 flex-row justify-between">
        <View>
          <Text className="text-xs" style={{ color: neon.muted }}>
            Winner pot
          </Text>
          <Text className="mt-1 text-lg font-bold" style={{ color: neon.blue }}>
            ${event.winnerPot.toLocaleString()}
          </Text>
        </View>
        <View>
          <Text className="text-xs" style={{ color: neon.muted }}>
            Loser pot
          </Text>
          <Text className="mt-1 text-lg font-bold" style={{ color: neon.purple }}>
            ${event.loserPot.toLocaleString()}
          </Text>
        </View>
        <View>
          <Text className="text-xs" style={{ color: neon.muted }}>
            10% lottery
          </Text>
          <Animated.View style={lotteryPotStyle}>
            <Text className="mt-1 text-lg font-bold" style={{ color: neon.pink }}>
              ${event.lotteryPot.toLocaleString()}
            </Text>
          </Animated.View>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1">
          <NeonButton
            label="Tip Winner"
            onPress={() => onTip('winner', event.title)}
            disabled={isDrawn}
          />
        </View>
        <View className="flex-1">
          <NeonButton
            label="Tip Loser (enter lottery)"
            variant="secondary"
            onPress={() => onTip('loser', event.title)}
            disabled={isDrawn}
          />
        </View>
      </View>
    </NeonCard>
  )
}
