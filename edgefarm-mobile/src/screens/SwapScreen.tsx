import React, { useEffect, useMemo, useState } from 'react'
import { Linking, Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { ScreenBackground } from '../components/ScreenBackground'
import { NeonCard } from '../components/NeonCard'
import { NeonButton } from '../components/NeonButton'
import { neon } from '../theme/neon'
import { connectThetaWalletMock, createDisconnectedWallet } from '../lib/mockWallet'
import { type } from '../theme/typography'
import * as Haptics from 'expo-haptics'
import { SlideUpSheet } from '../components/SlideUpSheet'

const LSTS = ['stkXPRT', 'stkTIA', 'pSTAKE BTC', 'stkATOM'] as const
type LST = (typeof LSTS)[number]
type PctOption = 25 | 50 | 75 | 100 | 'custom'
type Phase = 'idle' | 'approving' | 'swapping'

const APY_BY_LST: Record<LST, number> = {
  stkXPRT: 38.7,
  stkTIA: 48.2,
  'pSTAKE BTC': 32.1,
  stkATOM: 25.4,
}

export function SwapScreen() {
  const [wallet, setWallet] = useState(createDisconnectedWallet())
  const [selectedLST, setSelectedLST] = useState<LST>('stkTIA')
  const [pctOption, setPctOption] = useState<PctOption>(50)
  const [customPct, setCustomPct] = useState('60')

  const [finalityMs, setFinalityMs] = useState(3200)
  const [status, setStatus] = useState<string>('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [approved, setApproved] = useState(false)
  const [percentOpen, setPercentOpen] = useState(false)
  const [lstOpen, setLstOpen] = useState(false)
  const [moreLstsOpen, setMoreLstsOpen] = useState(false)

  const [successOpen, setSuccessOpen] = useState(false)
  const [successDetails, setSuccessDetails] = useState<{ finality: string; explorerUrl: string } | null>(null)

  useEffect(() => {
    const t = setInterval(() => {
      setFinalityMs((v) => {
        const next = v - 100
        if (next <= 0) return 2800 + Math.floor(Math.random() * 900)
        return next
      })
    }, 100)
    return () => clearInterval(t)
  }, [])

  const finalityText = useMemo(() => `${(finalityMs / 1000).toFixed(1)} s`, [finalityMs])

  const connect = async () => {
    const w = await connectThetaWalletMock()
    setWallet(w)
    setStatus('Connected (mock)')
    setTimeout(() => setStatus(''), 1200)
  }

  const pctValue = useMemo(() => {
    if (pctOption !== 'custom') return pctOption
    const n = Math.round(parseFloat(customPct || '0') || 0)
    return Math.max(0, Math.min(100, n))
  }, [pctOption, customPct])

  const tfuelAmount = useMemo(() => {
    if (!wallet.isConnected) return 0
    return (wallet.balanceTfuel * pctValue) / 100
  }, [wallet.balanceTfuel, wallet.isConnected, pctValue])

  const receiveEstimate = useMemo(() => {
    // Mock: 1 TFUEL -> 1 LST unit; round to 2 decimals
    return tfuelAmount
  }, [tfuelAmount])

  const receivePreview = useMemo(() => {
    const apy = APY_BY_LST[selectedLST]
    return `You’ll receive ~${receiveEstimate.toFixed(2)} ${selectedLST} (${apy.toFixed(1)}%)`
  }, [receiveEstimate, selectedLST])

  const doSwap = () => {
    if (!wallet.isConnected) {
      setStatus('Connect wallet first')
      return
    }
    if (pctValue <= 0 || tfuelAmount <= 0) {
      setStatus('Choose an amount to swap')
      return
    }
    setPhase('swapping')
    setStatus(`Swapping ${tfuelAmount.toFixed(2)} TFUEL → ${selectedLST}… (demo)`)

    const finalitySnapshot = finalityText
    const explorerUrl = 'https://explorer.thetatoken.org/' // placeholder

    setTimeout(() => {
      setPhase('idle')
      setStatus('')
      setSuccessDetails({ finality: finalitySnapshot, explorerUrl })
      setSuccessOpen(true)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    }, 1100)
  }

  const swapAndStake = () => {
    if (!wallet.isConnected) {
      setStatus('Connect wallet first')
      return
    }
    if (pctValue <= 0 || tfuelAmount <= 0) {
      setStatus('Choose an amount to swap')
      return
    }

    if (!approved) {
      setPhase('approving')
      setStatus('Approving…')
      setTimeout(() => {
        setApproved(true)
        setPhase('idle')
        setStatus('')
        doSwap()
      }, 800)
      return
    }

    doSwap()
  }

  return (
    <ScreenBackground>
      <SafeAreaView className="flex-1">
        <View className="px-5 pt-3">
          <View className="flex-row items-center justify-between">
            <Text style={{ ...type.h2, color: 'rgba(255,255,255,0.95)' }}>Swap & Stake</Text>
          </View>
          <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.55)' }}>
            Modern swap experience · clean selectors
          </Text>
        </View>

        <View className="px-5 pt-5">
          <NeonCard className="mb-5">
            {!wallet.isConnected ? (
              <NeonButton label="Connect Theta Wallet" onPress={connect} rightHint="secure" />
            ) : (
              <View>
                <View className="flex-row items-center justify-between">
                  <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.55)' }}>
                    Connected
                  </Text>
                  <Text style={{ ...type.caption, color: neon.green }}>
                    {wallet.addressShort}
                  </Text>
                </View>
                <View className="mt-2 flex-row items-baseline gap-2">
                  <Text style={{ ...type.h1, color: 'rgba(255,255,255,0.95)' }}>{wallet.balanceTfuel.toLocaleString()}</Text>
                  <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.55)' }}>
                    TFUEL
                  </Text>
                </View>
              </View>
            )}
          </NeonCard>

          <NeonCard className="mb-5">
            <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>Swap settings</Text>
            <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.55)' }}>
              Choose your balance share and target LST.
            </Text>

            <View style={{ marginTop: 14, flexDirection: 'row', gap: 12 }}>
              {/* % dropdown */}
              <Pressable
                onPress={() => setPercentOpen(true)}
                disabled={!wallet.isConnected || phase !== 'idle'}
                style={{
                  flex: 1,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.55)' }}>% of balance</Text>
                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}>
                    {pctOption === 'custom' ? `Custom (${pctValue}%)` : `${pctOption}%`}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.65)" />
                </View>
                <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.45)' }}>
                  {wallet.isConnected ? `${tfuelAmount.toFixed(2)} TFUEL` : '—'}
                </Text>
              </Pressable>

              {/* LST dropdown */}
              <Pressable
                onPress={() => setLstOpen(true)}
                disabled={phase !== 'idle'}
                style={{
                  flex: 1,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.55)' }}>Target LST</Text>
                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}>{selectedLST}</Text>
                  <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.65)" />
                </View>
                <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.45)' }}>
                  {APY_BY_LST[selectedLST].toFixed(1)}% APY
                </Text>
              </Pressable>
            </View>

            {pctOption === 'custom' ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.55)' }}>Custom percent (0–100)</Text>
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
                  <TextInput
                    value={customPct}
                    onChangeText={setCustomPct}
                    editable={wallet.isConnected && phase === 'idle'}
                    keyboardType="number-pad"
                    placeholder="60"
                    placeholderTextColor={'rgba(255,255,255,0.35)'}
                    style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}
                  />
                </View>
              </View>
            ) : null}
          </NeonCard>

          {status ? (
            <View className="mb-5 rounded-2xl border px-4 py-3" style={{ borderColor: 'rgba(56,189,248,0.25)', backgroundColor: 'rgba(56,189,248,0.08)' }}>
              <Text style={{ ...type.bodyM, color: neon.text }}>
                {status}
              </Text>
            </View>
          ) : null}

          <View style={{ paddingBottom: 92 }}>
            <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.75)' }}>{receivePreview}</Text>
            <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.50)' }}>
              Estimates are mock values in this demo.
            </Text>

            <View style={{ marginTop: 12 }}>
              <NeonButton
                label={phase === 'approving' ? 'Approving…' : phase === 'swapping' ? 'Swapping…' : 'Swap & Stake'}
                onPress={swapAndStake}
                disabled={!wallet.isConnected || phase !== 'idle' || pctValue <= 0}
                rightHint={wallet.isConnected ? `${tfuelAmount.toFixed(2)} TFUEL` : undefined}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* % dropdown sheet */}
      <SlideUpSheet visible={percentOpen} onClose={() => setPercentOpen(false)}>
        <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>Choose % of balance</Text>
        <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.55)' }}>Quick select or custom.</Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          {[25, 50, 75, 100].map((p) => (
            <Pressable
              key={p}
              onPress={() => {
                setPctOption(p as 25 | 50 | 75 | 100)
                setPercentOpen(false)
              }}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: pctOption === p ? 'rgba(56,189,248,0.30)' : 'rgba(255,255,255,0.12)',
                backgroundColor: pctOption === p ? 'rgba(56,189,248,0.10)' : 'rgba(255,255,255,0.04)',
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
            >
              <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}>{p}%</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              setPctOption('custom')
              setPercentOpen(false)
            }}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: pctOption === 'custom' ? 'rgba(56,189,248,0.30)' : 'rgba(255,255,255,0.12)',
              backgroundColor: pctOption === 'custom' ? 'rgba(56,189,248,0.10)' : 'rgba(255,255,255,0.04)',
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
          >
            <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}>Custom</Text>
          </Pressable>
        </View>
      </SlideUpSheet>

      {/* LST dropdown sheet */}
      <SlideUpSheet visible={lstOpen} onClose={() => setLstOpen(false)}>
        <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>Choose target LST</Text>
        <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.55)' }}>Pick the yield you want.</Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          {LSTS.map((lst) => (
            <Pressable
              key={lst}
              onPress={() => {
                setSelectedLST(lst)
                setLstOpen(false)
              }}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: selectedLST === lst ? 'rgba(56,189,248,0.30)' : 'rgba(255,255,255,0.12)',
                backgroundColor: selectedLST === lst ? 'rgba(56,189,248,0.10)' : 'rgba(255,255,255,0.04)',
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}>{lst}</Text>
                <Text style={{ ...type.caption, color: 'rgba(255,255,255,0.65)' }}>{APY_BY_LST[lst].toFixed(1)}%</Text>
              </View>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              setLstOpen(false)
              setMoreLstsOpen(true)
            }}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
          >
            <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}>More…</Text>
          </Pressable>
        </View>
      </SlideUpSheet>

      {/* More LSTs sheet (placeholder full list) */}
      <SlideUpSheet visible={moreLstsOpen} onClose={() => setMoreLstsOpen(false)}>
        <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>All LSTs</Text>
        <Text style={{ ...type.caption, marginTop: 6, color: 'rgba(255,255,255,0.55)' }}>Mock list for now.</Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          {[...LSTS].map((lst) => (
            <Pressable
              key={`all-${lst}`}
              onPress={() => {
                setSelectedLST(lst)
                setMoreLstsOpen(false)
              }}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: selectedLST === lst ? 'rgba(56,189,248,0.30)' : 'rgba(255,255,255,0.12)',
                backgroundColor: selectedLST === lst ? 'rgba(56,189,248,0.10)' : 'rgba(255,255,255,0.04)',
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
            >
              <Text style={{ ...type.bodyM, color: 'rgba(255,255,255,0.92)' }}>{lst}</Text>
            </Pressable>
          ))}
        </View>
      </SlideUpSheet>

      {/* Success slide-up popup */}
      <SlideUpSheet visible={successOpen} onClose={() => setSuccessOpen(false)}>
        <Text style={{ ...type.h3, color: 'rgba(255,255,255,0.95)' }}>Swap complete!</Text>
        <Text style={{ ...type.bodyM, marginTop: 8, color: 'rgba(255,255,255,0.75)' }}>
          Gas sponsored by XFUEL treasury · Finality in {successDetails?.finality ?? finalityText}
        </Text>
        <Pressable
          onPress={() => {
            const url = successDetails?.explorerUrl
            if (url) Linking.openURL(url).catch(() => {})
          }}
          style={{ marginTop: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(56,189,248,0.22)', paddingHorizontal: 12, paddingVertical: 12 }}
        >
          <Text style={{ ...type.bodyM, color: neon.blue }}>View on explorer</Text>
        </Pressable>
        <Text style={{ ...type.caption, marginTop: 10, color: 'rgba(255,255,255,0.45)' }}>
          Explorer link is a placeholder in this demo.
        </Text>
      </SlideUpSheet>
    </ScreenBackground>
  )
}
