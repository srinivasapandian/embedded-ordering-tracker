import { PageHeader } from '@/components/common/PageHeader'
import { MigrationOverview } from '@/components/dashboard/MigrationOverview'
import { OnboardingOverview } from '@/components/dashboard/OnboardingOverview'
import { WeeklyPriorityTable } from '@/components/dashboard/WeeklyPriorityTable'

export default function Dashboard() {
  return (
    <>
      <PageHeader title="Dashboard" description="A live view of onboarding, migration, and this week's priorities" />
      <div className="space-y-6">
        <OnboardingOverview />
        <MigrationOverview />
        <WeeklyPriorityTable />
      </div>
    </>
  )
}
