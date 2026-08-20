import { addDays, format, parseISO } from 'date-fns'
import type { Priority, PriorityItem, PriorityItemStatus } from '@/types'
import { shiftWeekKey, weekKeyOf } from '@/utils/date'
import { websiteIdByDomain } from './websites'
import { pad2 } from './seedUtils'

type RawPriority = [
  domain: string,
  weekOffset: number, // relative to the current week
  title: string,
  priority: Priority,
  assigned: string,
  dueDow: number, // 0 = Monday … 6 = Sunday
  status: PriorityItemStatus,
]

const rawPriorities: RawPriority[] = [
  // Two weeks ago
  ['hbkiselinnj.com', -2, 'Post-migration SEO verification', 'high', 'tm05', 3, 'completed'],
  ['hbkfrisco.com', -2, 'Cutover retrospective notes', 'medium', 'tm04', 4, 'completed'],
  ['sangamwilmington.com', -2, 'Go-live checklist sign-off', 'high', 'tm10', 2, 'completed'],
  ['a2billinois.com', -2, 'Menu data model cleanup', 'medium', 'tm06', 4, 'completed'],
  ['utsavgrandusa.com', -2, 'Ordering payment reconciliation', 'low', 'tm09', 5, 'review'],
  // Last week
  ['maduraikitchenusa.com', -1, 'Production cutover', 'high', 'tm05', 2, 'completed'],
  ['masalatwistsachse.com', -1, 'DNS switch and cache warm-up', 'high', 'tm07', 3, 'completed'],
  ['hhwoodlands.com', -1, 'Ordering menu photography upload', 'medium', 'tm08', 4, 'in-progress'],
  ['tpcfrisco.com', -1, 'Payment provider decision follow-up', 'medium', 'tm03', 4, 'blocked'],
  ['bhimaspureveg.com', -1, 'Lighthouse performance pass', 'low', 'tm04', 5, 'completed'],
  ['manamusa.com', -1, 'Regression round 1 triage', 'medium', 'tm10', 5, 'review'],
  // Current week
  ['hbktampa.com', 0, 'QA regression round 2', 'high', 'tm10', 3, 'in-progress'],
  ['thehyderabadjunction.com', 0, 'Server component conversion', 'high', 'tm05', 4, 'in-progress'],
  ['malgudigardenplano.com', 0, 'Checkout flow migration', 'high', 'tm04', 4, 'in-progress'],
  ['krishna-vilas-cumming.maghil.com', 0, 'Production cutover rehearsal', 'medium', 'tm06', 2, 'review'],
  ['hhconcord.com', 0, 'Ordering go-live checklist', 'medium', 'tm08', 3, 'not-started'],
  ['madrasmojocolleyville.com', 0, 'Unblock: menu restructure call', 'medium', 'tm03', 1, 'blocked'],
  ['special9.us', 0, 'Ordering payments sandbox test', 'low', 'tm09', 5, 'not-started'],
  ['rotate-social-tx.maghil.com', 0, 'Soft-launch ordering QA', 'high', 'tm10', 2, 'in-progress'],
  ['maghil.com', 0, 'Marketing site migration sprint', 'medium', 'tm07', 5, 'in-progress'],
  // Next week
  ['hyderabadbiryaninj.com', 1, 'Production cutover', 'high', 'tm05', 2, 'not-started'],
  ['hhirving.com', 1, 'Final QA sign-off', 'high', 'tm10', 1, 'not-started'],
  ['a2bnc.com', 1, 'Staging content freeze', 'medium', 'tm06', 3, 'not-started'],
  ['simplysouthwarrenville.com', 1, 'Ordering launch dry run', 'medium', 'tm08', 4, 'not-started'],
  ['kumarmessdallas.com', 1, 'Migration kickoff meeting', 'low', 'tm04', 1, 'not-started'],
]

const currentWeek = weekKeyOf()

export const seedPriorities: PriorityItem[] = rawPriorities.map(
  ([domain, weekOffset, title, priority, assigned, dueDow, status], i) => {
    const websiteId = websiteIdByDomain[domain]
    if (!websiteId) throw new Error(`Seed error: no website for domain ${domain}`)
    const weekStart = shiftWeekKey(currentWeek, weekOffset)
    return {
      id: `p${pad2(i + 1)}`,
      websiteId,
      weekStart,
      title,
      priority,
      assignedToId: assigned,
      dueDate: format(addDays(parseISO(weekStart), dueDow), 'yyyy-MM-dd'),
      status,
    }
  },
)
