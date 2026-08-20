import type { Website } from '@/types'
import { rawClients } from './clients'
import { daysAgoIso, pad2 } from './seedUtils'

const IN_PROGRESS_STAGES = [
  'Menu setup',
  'Payments configuration',
  'Content review',
  'Go-live checklist',
  'Ordering QA',
]

let seqCounter = 1

export const seedWebsites: Website[] = rawClients.flatMap((raw, ci) => {
  const clientId = `c${pad2(ci + 1)}`
  return raw.sites.map(([name, domain, framework, orderingStatus], si) => {
    const n = ci * 3 + si
    const addedAt = daysAgoIso(148 - ci * 3 - si, 10, (n * 11) % 60)
    const updatedAt = daysAgoIso(n % 9, 12 + (n % 5), (n * 17) % 60)
    const id = `w${pad2(seqCounter++)}`
    return {
      id,
      name,
      domain,
      clientId,
      framework,
      orderingStatus,
      orderingStage:
        orderingStatus === 'active'
          ? 'Live'
          : orderingStatus === 'in-progress'
            ? IN_PROGRESS_STAGES[n % IN_PROGRESS_STAGES.length]!
            : orderingStatus === 'no-need'
              ? 'Not required'
              : 'Not scheduled',
      orderingStartDate:
        orderingStatus === 'active' || orderingStatus === 'in-progress'
          ? daysAgoIso(90 - ((n * 3) % 40), 9, 0)
          : null,
      orderingCompletedDate: orderingStatus === 'active' ? daysAgoIso(20 - (n % 18), 15, 30) : null,
      addedAt,
      updatedAt,
    }
  })
})

/** domain -> website id, used by migrations/priorities seed files. */
export const websiteIdByDomain: Record<string, string> = Object.fromEntries(
  seedWebsites.map((w) => [w.domain, w.id]),
)
