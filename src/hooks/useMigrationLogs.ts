import { useEffect, useState } from 'react'
import type { MigrationLog } from '@/types'
import { subscribeSubCollection } from '@/firebase/collection'

/** Live, newest-first log feed for one migration (migrations/{migrationId}/logs). */
export function useMigrationLogs(migrationId: string | undefined, max = 100): MigrationLog[] {
  const [logs, setLogs] = useState<MigrationLog[]>([])

  useEffect(() => {
    if (!migrationId) {
      setLogs([])
      return
    }
    return subscribeSubCollection<MigrationLog>('migrations', migrationId, 'logs', 'timestamp', setLogs, max)
  }, [migrationId, max])

  return logs
}
