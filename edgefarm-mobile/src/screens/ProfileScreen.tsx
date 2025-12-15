import React, { useEffect, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenBackground } from '../components/ScreenBackground'
import { NeonCard } from '../components/NeonCard'
import { neon } from '../theme/neon'
import { getWinnings, type Winning } from '../lib/winningsStore'

export function ProfileScreen() {
  const [winnings, setWinnings] = useState<Winning[]>([])

  useEffect(() => {
    const loadWinnings = () => {
      setWinnings(getWinnings())
    }
    loadWinnings()
    const interval = setInterval(loadWinnings, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <ScreenBackground>
      <SafeAreaView className="flex-1">
        <View className="p-4">
          <Text className="text-2xl font-bold text-white">Profile</Text>
          <Text className="mt-1 text-sm" style={{ color: neon.muted }}>
            Wallet, preferences, and streak details
          </Text>

          <NeonCard className="mt-4">
            <Text className="text-base font-semibold text-white">EdgeFarm ID</Text>
            <Text className="mt-2 text-sm" style={{ color: neon.muted }}>
              Coming next: real Theta wallet connection + on-chain XP, streak proofs, and referrals.
            </Text>

            <View className="mt-4 flex-row items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: 'rgba(168,85,247,0.22)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <Text className="text-sm text-white">Notifications</Text>
              <Text className="text-sm font-semibold" style={{ color: neon.blue }}>
                Enabled
              </Text>
            </View>

            <View className="mt-3 flex-row items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: 'rgba(168,85,247,0.22)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <Text className="text-sm text-white">Battery-safe farming</Text>
              <Text className="text-sm font-semibold" style={{ color: neon.green }}>
                On
              </Text>
            </View>
          </NeonCard>

          <NeonCard className="mt-4">
            <Text className="text-base font-semibold text-white">My Winnings</Text>
            {winnings.length === 0 ? (
              <Text className="mt-3 text-sm" style={{ color: neon.muted }}>
                No winnings yet. Tip pools to enter lotteries!
              </Text>
            ) : (
              <FlatList
                data={winnings}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    className="mt-3 rounded-xl border px-4 py-3"
                    style={{
                      borderColor:
                        item.type === 'lottery_win'
                          ? 'rgba(251, 113, 133, 0.35)'
                          : 'rgba(168, 85, 247, 0.35)',
                      backgroundColor:
                        item.type === 'lottery_win'
                          ? 'rgba(251, 113, 133, 0.10)'
                          : 'rgba(168, 85, 247, 0.10)',
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-white">
                          {item.eventTitle}
                        </Text>
                        <Text className="mt-1 text-xs" style={{ color: neon.muted }}>
                          {item.type === 'lottery_win' ? 'Lottery Win' : 'Tip Cut'}
                        </Text>
                        <Text className="mt-1 text-xs" style={{ color: neon.muted }}>
                          {formatDate(item.timestamp)}
                        </Text>
                      </View>
                      <Text
                        className="text-lg font-bold"
                        style={{
                          color: item.type === 'lottery_win' ? neon.pink : neon.purple,
                        }}
                      >
                        +${item.amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </NeonCard>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  )
}
