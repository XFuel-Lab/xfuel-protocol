import React, { useEffect, useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NeonButton } from '../components/NeonButton'
import { ScreenBackground } from '../components/ScreenBackground'
import { TipSuccessOverlay } from '../components/TipSuccessOverlay'
import { getAppExtra } from '../lib/appConfig'
import { neon } from '../theme/neon'
import { type } from '../theme/typography'
import { NeonPill } from '../components/NeonPill'
import { Ionicons } from '@expo/vector-icons'
import Slider from '@react-native-community/slider'
import * as Haptics from 'expo-haptics'
import { SlideUpSheet } from '../components/SlideUpSheet'

type PoolType = 'Winner Takes All' | 'Loser Lottery' | 'Charity'

type Pool = {
  id: string
  name: string
  type: PoolType
  endsAtMs: number
  creator: string
  creatorCutPct: number // 0–10
  charityAddress?: string
  minTipUsd: number

  winnerPot: number
  loserPot: number
  lotteryPot: number

  tipsLastHour: number
  participants: Array<{ name: string; amount: number }>
}

export function PoolsScreen() {
  const [successVisible, setSuccessVisible] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const { lotteryJackpot, globalLotteryCutBps } = getAppExtra()
  const globalLotteryPct = (globalLotteryCutBps / 100).toFixed(0)
  const [tick, setTick] = useState(0)

  const [createOpen, setCreateOpen] = useState(false)
  const [allOpen, setAllOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null)

  // Create modal form state
  const [poolName, setPoolName] = useState('')
  const [endsInMinutes, setEndsInMinutes] = useState('60')
  const [poolType, setPoolType] = useState<PoolType>('Loser Lottery')
  const [creatorCutPct, setCreatorCutPct] = useState(3)
  const [charityAddress, setCharityAddress] = useState('')
  const [minTipUsd, setMinTipUsd] = useState('5')

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const basePools: Pool[] = useMemo(
    () => [
      {
        id: 'p1',
        name: 'Cloud9 vs Dignitas Finals',
        type: 'Loser Lottery',
        creator: 'edgefarm',
        creatorCutPct: 2,
        minTipUsd: 5,
        winnerPot: 124_800,
        loserPot: 78_300,
        lotteryPot: 22_340,
        endsAtMs: Date.now() + 1000 * 60 * 38,
        tipsLastHour: 182,
        participants: [
          { name: 'neonrunner', amount: 220 },
          { name: 'alpha', amount: 140 },
          { name: 'b0t', amount: 75 },
          { name: 'ivy', amount: 62 },
        ],
      },
      {
        id: 'p2',
        name: 'Sentinels vs LOUD Showmatch',
        type: 'Winner Takes All',
        creator: 'edgefarm',
        creatorCutPct: 1,
        minTipUsd: 10,
        winnerPot: 64_250,
        loserPot: 41_900,
        lotteryPot: 11_750,
        endsAtMs: Date.now() + 1000 * 60 * 12,
        tipsLastHour: 244,
        participants: [
          { name: 'morpho', amount: 500 },
          { name: 'phantom', amount: 220 },
          { name: 'debridge', amount: 160 },
        ],
      },
      {
        id: 'p3',
        name: 'T1 vs Gen.G Grand Final',
        type: 'Loser Lottery',
        creator: 'edgefarm',
        creatorCutPct: 2,
        minTipUsd: 5,
        winnerPot: 92_110,
        loserPot: 58_420,
        lotteryPot: 15_980,
        endsAtMs: Date.now() + 1000 * 60 * 22,
        tipsLastHour: 88,
        participants: [
          { name: 'sora', amount: 90 },
          { name: 'kaito', amount: 70 },
          { name: 'zelda', amount: 60 },
        ],
      },
    ],
    []
  )

  const [myPools, setMyPools] = useState<Pool[]>([])
  const [pools, setPools] = useState<Pool[]>(basePools)

  useEffect(() => {
    // If base pools ever change (they won’t), keep state in sync
    setPools((prev) => (prev.length ? prev : basePools))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const popularPools = useMemo(() => {
    const byPot = [...pools].sort((a, b) => (b.winnerPot + b.loserPot + b.lotteryPot) - (a.winnerPot + a.loserPot + a.lotteryPot))
    return byPot.slice(0, 6)
  }, [pools])

  const selectedPool = useMemo(() => pools.find((p) => p.id === selectedPoolId) ?? null, [pools, selectedPoolId])

  const tip = (side: 'winner' | 'loser', pool: Pool) => {
    const entered = side === 'loser'
    setSuccessMsg(
      entered
        ? `You entered ${lotteryJackpot} lottery (${globalLotteryPct}% global pot)\nPool: ${pool.name}`
        : `Tip placed on Winner\nPool: ${pool.name}`
    )
    setSuccessVisible(true)
  }

  const openDetails = (poolId: string) => {
    setSelectedPoolId(poolId)
    setDetailsOpen(true)
    Haptics.selectionAsync().catch(() => {})
  }

  const closeDetails = () => setDetailsOpen(false)

  const formatCountdown = (endsAtMs: number) => {
    const remaining = Math.max(0, endsAtMs - Date.now())
    const mm = Math.floor(remaining / 60000)
    const ss = Math.floor((remaining % 60000) / 1000)
    return `${mm}:${ss.toString().padStart(2, '0')}`
  }

  const launchPool = () => {
    const minutes = Math.max(1, Math.min(720, parseInt(endsInMinutes || '60', 10) || 60))
    const minTip = Math.max(1, Math.min(9999, parseFloat(minTipUsd || '5') || 5))
    const name = poolName.trim() || `My Pool #${myPools.length + 1}`

    const newPool: Pool = {
      id: `my-${Date.now()}`,
      name,
      type: poolType,
      creator: 'you',
      creatorCutPct: creatorCutPct,
      charityAddress: poolType === 'Charity' ? (charityAddress.trim() || undefined) : undefined,
      minTipUsd: minTip,
      endsAtMs: Date.now() + minutes * 60_000,
      winnerPot: 0,
      loserPot: 0,
      lotteryPot: 0,
      tipsLastHour: 0,
      participants: [],
    }

    setMyPools((prev) => [newPool, ...prev])
    setPools((prev) => [newPool, ...prev])
    setCreateOpen(false)
    setPoolName('')
    setEndsInMinutes('60')
    setPoolType('Loser Lottery')
    setCreatorCutPct(3)
    setCharityAddress('')
    setMinTipUsd('5')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  }

  return (
    <ScreenBackground>
      <SafeAreaView className="flex-1">
        <FlatList
          data={[]}
          keyExtractor={(x) => x}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ ...type.h2, color: 'rgba(255,255,255,0.95)' }}>Tip Pools</Text>
                <NeonPill label={`Jackpot ${lotteryJackpot}`} tone="pink" />
              </View>

              <View
                style={{
                  marginTop: 12,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(251, 113, 133, 0.30)',
                  backgroundColor: 'rgba(251, 113, 133, 0.08)',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ ...type.bodyM, color: neon.pink }}>
                  {globalLotteryPct}% of every tip feeds the global lottery
                </Text>
                <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.58)' }}>
                  Browse. Tip. Screenshot. Share. Winner tips grow the pot; Loser tips enter the draw.
                </Text>
              </View>

              {/* Popular pools carousel */}
              <View style={{ marginTop: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>Popular Pools</Text>
                  <NeonPill label="Live" tone="blue" />
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingTop: 12, paddingBottom: 2, gap: 12 }}
                >
                  {popularPools.map((p) => (
                    <Pressable key={p.id} onPress={() => openDetails(p.id)} hitSlop={12}>
                      <View
                        style={{
                          width: 280,
                          borderRadius: 22,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.12)',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          paddingHorizontal: 14,
                          paddingVertical: 14,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.94)' }} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="trophy" size={16} color={neon.blue} />
                            <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.70)' }}>
                              {formatCountdown(p.endsAtMs)}
                            </Text>
                          </View>
                        </View>

                        <Text style={{ ...type.caption, marginTop: 8, color: 'rgba(255,255,255,0.55)' }}>
                          Live pot size
                        </Text>
                        <Text style={{ ...type.h1, marginTop: 2, color: 'rgba(255,255,255,0.96)' }}>
                          ${(p.winnerPot + p.loserPot + p.lotteryPot).toLocaleString()}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="happy" size={16} color={neon.blue} />
                            <Ionicons name="skull" size={16} color={neon.purple} />
                            <NeonPill label={`${p.tipsLastHour}/h`} tone="purple" />
                          </View>
                          <NeonPill label={p.type} tone={p.type === 'Charity' ? 'green' : p.type === 'Loser Lottery' ? 'pink' : 'blue'} />
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* My pools */}
              <View style={{ marginTop: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>My Pools</Text>
                  <NeonPill label={`${myPools.length}`} tone="purple" />
                </View>

                {myPools.length ? (
                  <View style={{ marginTop: 10, gap: 10 }}>
                    {myPools.slice(0, 3).map((p) => (
                      <Pressable key={p.id} onPress={() => openDetails(p.id)} hitSlop={10}>
                        <View
                          style={{
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: 'rgba(56,189,248,0.16)',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }} numberOfLines={1}>
                              {p.name}
                            </Text>
                            <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.60)' }}>
                              ends {formatCountdown(p.endsAtMs)}
                            </Text>
                          </View>
                          <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.50)' }}>
                            {p.type} · min tip ${p.minTipUsd.toFixed(0)} · cut {p.creatorCutPct.toFixed(0)}%
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={{ ...type.caption, marginTop: 10, color: 'rgba(255,255,255,0.52)' }}>
                    Create your first pool and share it.
                  </Text>
                )}
              </View>

              <View style={{ marginTop: 18 }}>
                <NeonButton label="See All Pools" variant="secondary" onPress={() => setAllOpen(true)} rightHint={`${pools.length}`} />
              </View>
            </View>
          }
          renderItem={null as any}
        />

        {/* Floating + button */}
        <Pressable
          onPress={() => setCreateOpen(true)}
          hitSlop={18}
          style={{
            position: 'absolute',
            right: 18,
            bottom: 96,
            width: 56,
            height: 56,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(56,189,248,0.25)',
            backgroundColor: 'rgba(56,189,248,0.10)',
          }}
        >
          <Ionicons name="add" size={28} color={neon.blue} />
        </Pressable>

        {/* Create pool modal */}
        <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', padding: 18, justifyContent: 'center' }}>
            <View style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(10,10,20,0.92)' }}>
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>Create Tip Pool</Text>
                  <Pressable onPress={() => setCreateOpen(false)} hitSlop={16} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="close" size={20} color="rgba(255,255,255,0.80)" />
                  </Pressable>
                </View>

                <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.55)' }}>
                  Launch a pool people want to screenshot and share.
                </Text>

                <View style={{ marginTop: 12, gap: 10 }}>
                  <Field label="Pool name">
                    <TextInput
                      value={poolName}
                      onChangeText={setPoolName}
                      placeholder="e.g., Finals Mega Pool"
                      placeholderTextColor={'rgba(255,255,255,0.35)'}
                      style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}
                    />
                  </Field>

                  <Field label="Event end time (minutes from now)">
                    <TextInput
                      value={endsInMinutes}
                      onChangeText={setEndsInMinutes}
                      keyboardType="number-pad"
                      placeholder="60"
                      placeholderTextColor={'rgba(255,255,255,0.35)'}
                      style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}
                    />
                  </Field>

                  <View>
                    <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.55)' }}>Type</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      {(['Winner Takes All', 'Loser Lottery', 'Charity'] as const).map((t) => (
                        <Pressable
                          key={t}
                          onPress={() => setPoolType(t)}
                          style={{
                            flex: 1,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: poolType === t ? 'rgba(56,189,248,0.30)' : 'rgba(255,255,255,0.12)',
                            backgroundColor: poolType === t ? 'rgba(56,189,248,0.10)' : 'rgba(255,255,255,0.04)',
                            paddingVertical: 10,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.80)' }}>{t}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.55)' }}>Creator cut</Text>
                      <NeonPill label={`${creatorCutPct.toFixed(0)}%`} tone="purple" />
                    </View>
                    <Slider
                      value={creatorCutPct}
                      minimumValue={0}
                      maximumValue={10}
                      step={1}
                      minimumTrackTintColor={neon.purple}
                      maximumTrackTintColor={'rgba(255,255,255,0.15)'}
                      thumbTintColor={neon.blue}
                      onValueChange={(v) => setCreatorCutPct(Math.round(v))}
                    />
                  </View>

                  {poolType === 'Charity' ? (
                    <Field label="Charity address (optional)">
                      <TextInput
                        value={charityAddress}
                        onChangeText={setCharityAddress}
                        placeholder="0x…"
                        placeholderTextColor={'rgba(255,255,255,0.35)'}
                        style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}
                      />
                    </Field>
                  ) : null}

                  <Field label="Min tip (USD)">
                    <TextInput
                      value={minTipUsd}
                      onChangeText={setMinTipUsd}
                      keyboardType="decimal-pad"
                      placeholder="5"
                      placeholderTextColor={'rgba(255,255,255,0.35)'}
                      style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}
                    />
                  </Field>

                  <NeonButton label="Launch Pool" onPress={launchPool} rightHint="instant" />
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* All pools modal */}
        <Modal visible={allOpen} transparent animationType="fade" onRequestClose={() => setAllOpen(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', padding: 18, justifyContent: 'center' }}>
            <View style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(10,10,20,0.92)' }}>
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>All Pools</Text>
                  <Pressable onPress={() => setAllOpen(false)} hitSlop={16} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="close" size={20} color="rgba(255,255,255,0.80)" />
                  </Pressable>
                </View>
              </View>

              <FlatList
                data={[...pools].sort((a, b) => (b.winnerPot + b.loserPot + b.lotteryPot) - (a.winnerPot + a.loserPot + a.lotteryPot))}
                keyExtractor={(p) => p.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => { setAllOpen(false); openDetails(item.id) }} hitSlop={10}>
                    <View style={{ borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 14, paddingVertical: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }} numberOfLines={1}>{item.name}</Text>
                        <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.60)' }}>{formatCountdown(item.endsAtMs)}</Text>
                      </View>
                      <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.55)' }}>
                        ${(item.winnerPot + item.loserPot + item.lotteryPot).toLocaleString()} pot · {item.type} · {item.tipsLastHour}/h
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Details slide-up */}
        <SlideUpSheet visible={detailsOpen && !!selectedPool} onClose={closeDetails}>
          {selectedPool ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }} numberOfLines={1}>{selectedPool.name}</Text>
                <Pressable onPress={closeDetails} hitSlop={16} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chevron-down" size={22} color="rgba(255,255,255,0.78)" />
                </Pressable>
              </View>
              <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.55)' }}>
                {selectedPool.type} · ends in {formatCountdown(selectedPool.endsAtMs)} · min tip ${selectedPool.minTipUsd.toFixed(0)}
              </Text>

              <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <NeonPill label={`Creator @${selectedPool.creator}`} tone="purple" />
                <NeonPill label={`Cut ${selectedPool.creatorCutPct.toFixed(0)}%`} tone="blue" />
                <NeonPill label={`Lottery ${globalLotteryPct}%`} tone="pink" />
              </View>

              <View style={{ marginTop: 14 }}>
                <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.58)' }}>Pot breakdown</Text>
                <View style={{ marginTop: 10, gap: 8 }}>
                  <PotRow label="Winner pot" value={selectedPool.winnerPot} tone="blue" />
                  <PotRow label="Loser pot" value={selectedPool.loserPot} tone="purple" />
                  <PotRow label={`${globalLotteryPct}% Lottery pot`} value={selectedPool.lotteryPot} tone="pink" />
                </View>
              </View>

              <View style={{ marginTop: 14 }}>
                <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.58)' }}>Participants</Text>
                {selectedPool.participants.length ? (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    {selectedPool.participants.slice(0, 6).map((p) => (
                      <View key={`${p.name}-${p.amount}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.80)' }}>{p.name}</Text>
                        <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.70)' }}>${p.amount.toLocaleString()}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ ...type.caption, marginTop: 8, color: 'rgba(255,255,255,0.50)' }}>No tips yet — be first.</Text>
                )}
              </View>

              <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <NeonButton label="Tip Winner" onPress={() => tip('winner', selectedPool)} />
                </View>
                <View style={{ flex: 1 }}>
                  <NeonButton label="Tip Loser" variant="secondary" onPress={() => tip('loser', selectedPool)} rightHint="lottery" />
                </View>
              </View>

              <Text style={{ ...type.caption, marginTop: 12, color: 'rgba(255,255,255,0.45)' }}>
                Tip flows are mocked; wire to on-chain pool contracts next.
              </Text>
            </View>
          ) : null}
        </SlideUpSheet>

        <TipSuccessOverlay
          visible={successVisible}
          message={successMsg}
          onClose={() => setSuccessVisible(false)}
        />
      </SafeAreaView>
    </ScreenBackground>
  )
}

function PotRow({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'purple' | 'pink' }) {
  const c =
    tone === 'blue' ? neon.blue : tone === 'pink' ? neon.pink : neon.purple
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.70)' }}>{label}</Text>
      <Text style={{ ...type.bodyM, color: c }}>${value.toLocaleString()}</Text>
    </View>
  )
}

function WinnerLoserGauge({ winner, loser }: { winner: number; loser: number }) {
  const total = Math.max(1, winner + loser)
  const w = winner / total
  const l = loser / total
  return (
    <View style={{ flexDirection: 'row', height: 12, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' }}>
      <View style={{ flex: w, backgroundColor: 'rgba(56,189,248,0.70)' }} />
      <View style={{ flex: l, backgroundColor: 'rgba(168,85,247,0.70)' }} />
    </View>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.55)' }}>{label}</Text>
      <View
        style={{
          marginTop: 8,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          backgroundColor: 'rgba(255,255,255,0.04)',
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        {children}
      </View>
    </View>
  )
}
