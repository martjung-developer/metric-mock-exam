'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

interface TopbarRefreshButtonProps {
  className: string
  spinningClassName: string
  title?: string
  onRefresh?: () => void | Promise<void>
}

export default function TopbarRefreshButton({
  className,
  spinningClassName,
  title = 'Refresh page data',
  onRefresh,
}: TopbarRefreshButtonProps) {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  async function handleClick() {
    if (refreshing) {
      return
    }
    setRefreshing(true)
    try {
      if (onRefresh) {
        await onRefresh()
      } else {
        router.refresh()
      }
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => { void handleClick() }}
      title={title}
      aria-label={title}
      disabled={refreshing}
    >
      <RefreshCw size={15} className={refreshing ? spinningClassName : ''} />
    </button>
  )
}
