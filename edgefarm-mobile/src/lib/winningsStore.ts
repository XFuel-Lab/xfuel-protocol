export type Winning = {
  id: string
  eventTitle: string
  amount: number
  type: 'lottery_win' | 'tip_cut'
  timestamp: number
}

let winnings: Winning[] = []

export function addWinning(winning: Omit<Winning, 'id' | 'timestamp'>) {
  const newWinning: Winning = {
    ...winning,
    id: `win_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  }
  winnings.unshift(newWinning)
  return newWinning
}

export function getWinnings(): Winning[] {
  return [...winnings]
}

export function clearWinnings() {
  winnings = []
}

