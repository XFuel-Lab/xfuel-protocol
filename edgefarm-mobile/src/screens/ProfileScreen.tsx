import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { ScreenBackground } from '../components/ScreenBackground'
import { NeonCard } from '../components/NeonCard'
import { neon } from '../theme/neon'
import { type } from '../theme/typography'
import { NeonPill } from '../components/NeonPill'
import { NeonButton } from '../components/NeonButton'
import * as Haptics from 'expo-haptics'
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { ProgressRing } from '../components/ProgressRing'
import { useNavigation } from '@react-navigation/native'

export function ProfileScreen() {
  const nav = useNavigation<any>()
  const [farmingOn, setFarmingOn] = useState(true)

  const user = useMemo(
    () => ({
      username: 'NeonFarmer',
      walletShort: '0x1234…7890',
      level: 12,
      levelProgress: 0.68,
    }),
    []
  )

  const stats = useMemo(
    () => ({
      totalTfuelFarmed: 1842.7,
      blendedApy: 48.2,
      selectedLST: 'stkTIA',
      tipsSent: 37,
      lotteryEntries: 19,
      streakDays: 12,
      rankText: 'Top 4% of farmers',
    }),
    []
  )

  const pulse = useSharedValue(0)
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true)
  }, [pulse])

  const badgePulse = useAnimatedStyle(() => ({
    opacity: 0.65 + pulse.value * 0.25,
    transform: [{ scale: 1 + pulse.value * 0.02 }],
  }))

  return (
    <ScreenBackground>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
          {/* Top identity header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ ...type.h2, color: 'rgba(255,255,255,0.95)' }}>Profile</Text>
            <NeonPill label={user.walletShort} tone="purple" />
          </View>

          <NeonCard className="mt-5">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: 'rgba(56,189,248,0.22)',
                    backgroundColor: 'rgba(56,189,248,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="person" size={22} color="rgba(255,255,255,0.92)" />
                </View>
                <View>
                  <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>{user.username}</Text>
                  <Text style={{ ...type.caption, marginTop: 4, color: 'rgba(255,255,255,0.55)' }}>Theta wallet · default avatar</Text>
                </View>
              </View>

              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ position: 'absolute' }}>
                  <ProgressRing
                    size={62}
                    strokeWidth={6}
                    progress={user.levelProgress}
                    trackColor={'rgba(255,255,255,0.10)'}
                    progressColor={neon.blue}
                  />
                </View>
                <View style={{ width: 62, height: 62, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.60)' }}>LVL</Text>
                  <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.95)' }}>{user.level}</Text>
                </View>
              </View>
            </View>

            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Animated.View style={[badgePulse, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <Ionicons name="sparkles" size={16} color={neon.pink} />
                <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.90)' }}>Farmer Level {user.level}</Text>
              </Animated.View>
              <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.55)' }}>{Math.round(user.levelProgress * 100)}% to next</Text>
            </View>
          </NeonCard>

          {/* Stats grid */}
          <View style={{ marginTop: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard title="Total TFUEL farmed" value={`${stats.totalTfuelFarmed.toLocaleString()} TFUEL`} tone="blue" />
              <StatCard title="Current yield" value={`${stats.blendedApy.toFixed(1)}% · ${stats.selectedLST}`} tone="purple" />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard title="Tips / Lottery" value={`${stats.tipsSent} / ${stats.lotteryEntries}`} tone="pink" />
              <StatCard title="Streak / Rank" value={`${stats.streakDays}d · ${stats.rankText}`} tone="green" />
            </View>
          </View>

          {/* Achievements */}
          <View style={{ marginTop: 18 }}>
            <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>Achievements</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, gap: 10 }}>
              <Badge label="First Swap" icon="swap-horizontal" unlocked />
              <Badge label="Lottery Winner" icon="trophy" unlocked={false} />
              <Badge label="100 Day Streak" icon="flame" unlocked={false} />
            </ScrollView>
          </View>

          {/* Quick actions */}
          <View style={{ marginTop: 18, gap: 10 }}>
            <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>Quick actions</Text>
            <NeonButton
              label={farmingOn ? 'Stop Farming' : 'Start Farming'}
              variant={farmingOn ? 'secondary' : 'primary'}
              onPress={() => {
                setFarmingOn((v) => !v)
                Haptics.selectionAsync().catch(() => {})
              }}
              rightHint={farmingOn ? 'running' : 'boost'}
            />
            <NeonButton
              label="Create Tip Pool"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {})
                nav.navigate('Pools')
              }}
              rightHint="viral"
            />
            <NeonButton
              label="Invite Friends"
              variant="secondary"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {})
              }}
              rightHint="+10% yield boost"
            />
          </View>

          {/* NFT showcase */}
          <View style={{ marginTop: 18 }}>
            <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>NFT Showcase</Text>
            <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.55)' }}>
              Tip Pool wins · ThetaDrop rewards (mock)
            </Text>

            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <NftTile title="Tip Pool Win #12" subtitle="Neon trophy" />
              <NftTile title="ThetaDrop" subtitle="Season 1" />
              <NftTile title="Lottery Entry" subtitle="Rare glow" />
              <NftTile title="Edge Badge" subtitle="Founder" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  )
}

function StatCard({ title, value, tone }: { title: string; value: string; tone: 'blue' | 'purple' | 'pink' | 'green' }) {
  const color = tone === 'green' ? neon.green : tone === 'pink' ? neon.pink : tone === 'purple' ? neon.purple : neon.blue
  return (
    <View style={{ flex: 1 }}>
      <NeonCard>
        <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.55)' }}>{title}</Text>
        <Text style={{ ...type.bodyM, marginTop: 10, color: 'rgba(255,255,255,0.95)' }}>{value}</Text>
        <View style={{ marginTop: 10 }}>
          <NeonPill label={tone.toUpperCase()} tone={tone === 'green' ? 'green' : tone === 'pink' ? 'pink' : tone === 'purple' ? 'purple' : 'blue'} />
        </View>
        <View
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            width: 10,
            height: 10,
            borderRadius: 99,
            backgroundColor: color,
            shadowColor: color,
            shadowOpacity: 1,
            shadowRadius: 10,
          }}
        />
      </NeonCard>
    </View>
  )
}

function Badge({ label, icon, unlocked }: { label: string; icon: keyof typeof Ionicons.glyphMap; unlocked: boolean }) {
  const pulse = useSharedValue(0)
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }), -1, true)
  }, [pulse])

  const glow = useAnimatedStyle(() => ({
    opacity: unlocked ? 0.20 + pulse.value * 0.30 : 0.06,
  }))

  const c = unlocked ? neon.blue : 'rgba(255,255,255,0.25)'

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {})
      }}
      style={{ width: 140, borderRadius: 20, overflow: 'hidden' }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          glow,
          {
            position: 'absolute',
            inset: -10,
            borderRadius: 24,
            backgroundColor: unlocked ? 'rgba(56,189,248,0.16)' : 'rgba(255,255,255,0.06)',
            shadowColor: c,
            shadowOpacity: 1,
            shadowRadius: 18,
          },
        ]}
      />
      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: unlocked ? 'rgba(56,189,248,0.22)' : 'rgba(255,255,255,0.12)',
          backgroundColor: 'rgba(255,255,255,0.03)',
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Ionicons name={icon} size={18} color={unlocked ? neon.blue : 'rgba(255,255,255,0.45)'} />
          <Ionicons name={unlocked ? 'checkmark-circle' : 'lock-closed'} size={16} color={unlocked ? neon.green : 'rgba(255,255,255,0.35)'} />
        </View>
        <Text style={{ ...type.bodyM, marginTop: 10, color: 'rgba(255,255,255,0.92)' }} numberOfLines={2}>
          {label}
        </Text>
        <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.50)' }}>{unlocked ? 'Unlocked' : 'Locked'}</Text>
      </View>
    </Pressable>
  )
}

function NftTile({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View
      style={{
        width: '48%',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(255,255,255,0.03)',
      }}
    >
      <View
        style={{
          height: 92,
          backgroundColor: 'rgba(56,189,248,0.08)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="image" size={22} color="rgba(255,255,255,0.55)" />
      </View>
      <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
        <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }} numberOfLines={1}>{title}</Text>
        <Text style={{ ...type.caption, marginTop: 4, color: 'rgba(255,255,255,0.55)' }} numberOfLines={1}>{subtitle}</Text>
      </View>
    </View>
  )
}
