import type { Migration, MigrationLog, MigrationStage, Priority } from '@/types'
import { DEVELOPER_IDS } from './users'
import { websiteIdByDomain } from './websites'
import { daysAgoIso, daysFromNowIso, minutesAgoIso, pad2 } from './seedUtils'

type RawMigration = [domain: string, stage: MigrationStage, progress: number, priority: Priority, dueInDays: number]

const rawMigrations: RawMigration[] = [
  // Planning
  ['madrasmojocolleyville.com', 'planning', 0, 'low', 42],
  ['madrasmojomckinney.com', 'planning', 0, 'low', 45],
  ['thanjaimess.com', 'planning', 5, 'medium', 30],
  ['thanjairestauranthouston.com', 'planning', 5, 'medium', 32],
  ['salemrrbiryanimckinney.com', 'planning', 8, 'medium', 28],
  ['muniyandivilas.com', 'planning', 0, 'low', 40],
  ['sriannapoornausa.com', 'planning', 0, 'low', 55],
  ['simplysouthmckinney.com', 'planning', 10, 'medium', 24],
  ['hhprosper.com', 'planning', 12, 'medium', 21],
  ['kumarmessdallas.com', 'planning', 6, 'medium', 26],
  // In Progress
  ['a2billinois.com', 'in-progress', 45, 'medium', 14],
  ['a2bnewjersey.com', 'in-progress', 38, 'medium', 16],
  ['a2bma.com', 'in-progress', 30, 'medium', 18],
  ['malgudigardenplano.com', 'in-progress', 62, 'high', 8],
  ['theelysium.us', 'in-progress', 55, 'high', 10],
  ['thehyderabadjunction.com', 'in-progress', 68, 'high', 6],
  ['monksallen.com', 'in-progress', 42, 'medium', 15],
  ['srikrishnavilas.com', 'in-progress', 35, 'medium', 17],
  ['special9.us', 'in-progress', 26, 'low', 22],
  ['brisqueemb.com', 'in-progress', 58, 'high', 9],
  // Testing
  ['hbktampa.com', 'testing', 88, 'high', 3],
  ['hhirving.com', 'testing', 82, 'medium', 5],
  ['simplysouthwarrenville.com', 'testing', 79, 'medium', 7],
  ['a2bnc.com', 'testing', 85, 'medium', 4],
  ['athidhiaalayam.com', 'testing', 80, 'medium', 6],
  ['hyderabadbiryaninj.com', 'testing', 91, 'medium', 2],
  ['manamusa.com', 'testing', 84, 'medium', -2],
  ['brisque.com', 'testing', 78, 'low', 12],
  ['krishna-vilas-cumming.brisqueemb.com', 'testing', 93, 'medium', -1],
  // Completed
  ['hbkiselinnj.com', 'completed', 100, 'high', -20],
  ['hbkfrisco.com', 'completed', 100, 'high', -18],
  ['hbkroyersford.com', 'completed', 100, 'medium', -15],
  ['hbkjohnscreek.com', 'completed', 100, 'medium', -14],
  ['hbk-lawrenceville.brisqueemb.com', 'completed', 100, 'medium', -4],
  ['farm2homeusa.com', 'completed', 100, 'low', -25],
  ['bheemacuisine.com', 'completed', 100, 'low', -30],
  ['amudhamcafe.com', 'completed', 100, 'medium', -10],
  ['sangamwilmington.com', 'completed', 100, 'medium', -8],
  ['maduraikitchenusa.com', 'completed', 100, 'medium', -12],
  ['masalatwistsachse.com', 'completed', 100, 'medium', -6],
  ['bhimaspureveg.com', 'completed', 100, 'medium', -5],
]

const LOG_POOL: Array<[string, string]> = [
  ['Migration kickoff', 'Scope agreed, repository audited and branch created'],
  ['Dependency audit completed', 'Package upgrades and incompatibilities catalogued'],
  ['Routing converted', 'React Router routes mapped to the App Router file structure'],
  ['Layout migration completed', 'Root and nested layouts moved to the app/ directory'],
  ['Header migrated', 'Global header ported to a server component with client islands'],
  ['SEO metadata updated', 'Metadata API wired for titles, descriptions and Open Graph tags'],
  ['Data fetching moved server-side', 'Menu queries now run in server components'],
  ['Image optimization pass', 'next/image adopted for menu and hero photography'],
  ['ISR configured', 'Menu pages revalidate automatically every 10 minutes'],
  ['QA regression round 1', '48-case regression checklist run against staging'],
  ['Lighthouse audit', 'Performance 96 / SEO 100 on the staging build'],
  ['Production cutover', 'DNS switched and rollback window closed'],
]

const LOGS_BY_STAGE: Record<MigrationStage, number> = {
  planning: 2,
  'in-progress': 5,
  testing: 8,
  completed: 12,
}

function buildLogs(stage: MigrationStage, updatedAt: string, mi: number): MigrationLog[] {
  const count = LOGS_BY_STAGE[stage]
  const end = new Date(updatedAt).getTime()
  const stepMs = (26 + (mi % 5) * 9) * 60_000
  return LOG_POOL.slice(0, count).map(([title, detail], i) => ({
    id: `mlog-${mi}-${i}`,
    // Oldest log first in the array; most recent log sits at the end.
    timestamp: new Date(end - (count - 1 - i) * stepMs).toISOString(),
    title,
    detail,
  }))
}

const stageOrderCounters: Record<MigrationStage, number> = {
  planning: 0,
  'in-progress': 0,
  testing: 0,
  completed: 0,
}

export const seedMigrations: Migration[] = rawMigrations.map(([domain, stage, progress, priority, dueInDays], i) => {
  const websiteId = websiteIdByDomain[domain]
  if (!websiteId) throw new Error(`Seed error: no website for domain ${domain}`)
  const updatedAt =
    stage === 'completed'
      ? daysAgoIso(4 + (i % 20), 16, (i * 7) % 60)
      : stage === 'planning'
        ? daysAgoIso(1 + (i % 6), 11, (i * 13) % 60)
        : minutesAgoIso(30 + (i % 9) * 47) // active work looks fresh
  const order = stageOrderCounters[stage]++
  return {
    id: `m${pad2(i + 1)}`,
    websiteId,
    developerId: DEVELOPER_IDS[i % DEVELOPER_IDS.length]!,
    stage,
    progress,
    priority,
    dueDate: daysFromNowIso(dueInDays),
    startedAt: daysAgoIso(70 - i, 9, 30),
    updatedAt,
    logs: buildLogs(stage, updatedAt, i),
    order,
  }
})
