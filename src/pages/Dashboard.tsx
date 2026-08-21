import { PageHeader } from '@/components/common/PageHeader'
import { EmbeddedOrderingRollout } from '@/components/dashboard/EmbeddedOrderingRollout'
import { KpiStrip } from '@/components/dashboard/KpiStrip'
import { MigrationOverview } from '@/components/dashboard/MigrationOverview'
import { TechLandscape } from '@/components/dashboard/TechLandscape'
import { WeeklyPriorityTable } from '@/components/dashboard/WeeklyPriorityTable'

export default function Dashboard() {
  return (
    <>
      <PageHeader
        title="Operations Overview"
        description="Track embedded ordering rollout, migration progress and client readiness across the website portfolio."
      />
      <div className="space-y-7">
        <KpiStrip />
        <EmbeddedOrderingRollout />
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <MigrationOverview />
          </div>
          <div className="xl:col-span-2">
            <TechLandscape />
          </div>
        </div>
        <WeeklyPriorityTable />
      </div>
    </>
  )
}
