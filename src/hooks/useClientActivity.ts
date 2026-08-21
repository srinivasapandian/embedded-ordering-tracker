import { useEffect, useState } from 'react'
import type { ActivityEvent } from '@/types'
import { subscribeSubCollection } from '@/firebase/collection'

/** Live, newest-first activity feed for one client (clients/{clientId}/activity). */
export function useClientActivity(clientId: string | undefined, max = 6): ActivityEvent[] {
  const [activity, setActivity] = useState<ActivityEvent[]>([])

  useEffect(() => {
    if (!clientId) {
      setActivity([])
      return
    }
    return subscribeSubCollection<ActivityEvent>('clients', clientId, 'activity', 'date', setActivity, max)
  }, [clientId, max])

  return activity
}
