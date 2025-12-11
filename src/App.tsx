import { useState, useEffect } from 'react'
import { Wallet, ArrowRightLeft, Zap, Shield, TrendingUp, Activity, ChevronDown } from 'lucide-react'

interface Token {
  symbol: string
  name: string
  balance: string
  price: string
  icon: string
}

const TOKENS: Token[] = [
  { symbol: 'TFUEL', name: 'Theta Fuel', balance: '0.00', price: '$0.042', icon: '⚡' },
  { symbol: 'stkXPRT', name: 'Staked Persistence', balance: '0.00', price: '$0.38', icon: '🔷' },
  { symbol: 'stkATOM', name: 'Staked Atom', balance: '0.00', price: '$8.92', icon: '⚛️' },
  { symbol: 'pSTAKE BTC', name: 'pStake Bitcoin', balance: '0.00', price: '$42,180', icon: '₿' },
]

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [fromToken, setFromToken] = useState<Token>(TOKENS[0])
  const [toToken, setToToken] = useState<Token>(TOKENS[1])
  const [amount, setAmount] = useState<string>('')
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [priceImpact] = useState<string>('0.01%')
  const [finalityTime] = useState<string>('~2.5s')
  const [isSwapping, setIsSwapping] = useState(false)

  // Check if Theta Wallet is available
  useEffect(() => {
    const checkWallet = () => {
      if (typeof window !== 'undefined' && (window as any).thetaWallet) {
        // Wallet is available
      }
    }
    checkWallet()
  }, [])

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).thetaWallet) {
        const wallet = (window as any).thetaWallet
        const accounts = await wallet.request({ method: 'eth_requestAccounts' })
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0])
          setIsConnected(true)
        }
      } else {
        // Simulate connection for demo
        setWalletAddress('0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''))
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      alert('Please install Theta Wallet extension to connect')
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setWalletAddress('')
  }

  const handleQuickAction = (percentage: number) => {
    const balance = parseFloat(fromToken.balance) || 0
    const quickAmount = (balance * percentage / 100).toFixed(6)
    setAmount(quickAmount)
  }

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setIsSwapping(true)
    // Simulate swap transaction
    setTimeout(() => {
      setIsSwapping(false)
      alert(`Successfully swapped ${amount} ${fromToken.symbol} to ${toToken.symbol}!`)
      setAmount('')
    }, 2000)
  }

  const switchTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setAmount('')
  }

  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              XFUEL
            </h1>
          </div>
          
          {isConnected ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg border border-purple-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono">{formatAddress(walletAddress)}</span>
              </div>
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/50 transition-all"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/50"
            >
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </button>
          )}
        </header>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-semibold">Security Score</span>
              </div>
              <div className="text-2xl font-bold">100/100</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-semibold">Finality Time</span>
              </div>
              <div className="text-2xl font-bold">{finalityTime}</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold">Price Impact</span>
              </div>
              <div className="text-2xl font-bold">{priceImpact}</div>
            </div>
          </div>

          {/* Swap Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Swap</h2>
              <div className="text-xs text-gray-400">
                Zero Gas Fees • Instant Finality
              </div>
            </div>

            {/* From Token */}
            <div className="relative mb-4">
              <label className="block text-sm text-gray-400 mb-2">From</label>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowFromDropdown(!showFromDropdown)
                          setShowToDropdown(false)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
                      >
                        <span className="text-2xl">{fromToken.icon}</span>
                        <span className="font-semibold">{fromToken.symbol}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showFromDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 rounded-lg border border-purple-500/30 shadow-xl z-20">
                          {TOKENS.map((token) => (
                            <button
                              key={token.symbol}
                              onClick={() => {
                                setFromToken(token)
                                setShowFromDropdown(false)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-all first:rounded-t-lg last:rounded-b-lg"
                            >
                              <span className="text-xl">{token.icon}</span>
                              <div className="flex-1 text-left">
                                <div className="font-semibold">{token.symbol}</div>
                                <div className="text-xs text-gray-400">{token.name}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-transparent text-right text-2xl font-bold outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                  <span>Balance: {fromToken.balance}</span>
                  <span>{fromToken.price}</span>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-2">
              <button
                onClick={switchTokens}
                className="p-3 bg-gray-900/50 rounded-full border border-purple-500/30 hover:border-purple-500/50 transition-all hover:rotate-180"
              >
                <ArrowRightLeft className="w-5 h-5 text-purple-400" />
              </button>
            </div>

            {/* To Token */}
            <div className="relative mb-6">
              <label className="block text-sm text-gray-400 mb-2">To</label>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowToDropdown(!showToDropdown)
                          setShowFromDropdown(false)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
                      >
                        <span className="text-2xl">{toToken.icon}</span>
                        <span className="font-semibold">{toToken.symbol}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showToDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 rounded-lg border border-purple-500/30 shadow-xl z-20">
                          {TOKENS.map((token) => (
                            <button
                              key={token.symbol}
                              onClick={() => {
                                setToToken(token)
                                setShowToDropdown(false)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-all first:rounded-t-lg last:rounded-b-lg"
                            >
                              <span className="text-xl">{token.icon}</span>
                              <div className="flex-1 text-left">
                                <div className="font-semibold">{token.symbol}</div>
                                <div className="text-xs text-gray-400">{token.name}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-right text-2xl font-bold text-gray-300">
                      {amount ? (parseFloat(amount) * 1.05).toFixed(6) : '0.0'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                  <span>Balance: {toToken.balance}</span>
                  <span>{toToken.price}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => handleQuickAction(25)}
                className="flex-1 px-4 py-2 bg-gray-900/50 hover:bg-gray-800 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all text-sm font-semibold"
              >
                25%
              </button>
              <button
                onClick={() => handleQuickAction(50)}
                className="flex-1 px-4 py-2 bg-gray-900/50 hover:bg-gray-800 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all text-sm font-semibold"
              >
                50%
              </button>
              <button
                onClick={() => handleQuickAction(100)}
                className="flex-1 px-4 py-2 bg-gray-900/50 hover:bg-gray-800 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all text-sm font-semibold"
              >
                100%
              </button>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={!isConnected || !amount || isSwapping}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-500/50"
            >
              {isSwapping ? 'Swapping...' : !isConnected ? 'Connect Wallet to Swap' : 'Swap'}
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>All transaction fees are paid by the XFUEL treasury</p>
            <p className="mt-1">Maximum security • 100/100 Chainalysis safety score</p>
          </div>
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showFromDropdown || showToDropdown) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowFromDropdown(false)
            setShowToDropdown(false)
          }}
        />
      )}
    </div>
  )
}

export default App
