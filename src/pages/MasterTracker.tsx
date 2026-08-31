import { PageHeader } from '@/components/common/PageHeader'
import { MasterTrackerTable } from '@/components/master-tracker/MasterTrackerTable'

export default function MasterTracker() {
  return (
    <>
      <PageHeader
        title="Master Tracker"
        description="Track clients, websites, rollout progress, and readiness in one place."
      />
      <MasterTrackerTable />
    </>
  )
}
