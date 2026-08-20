import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonTable } from '@/components/common/Skeleton'

// Placeholder — replaced during module implementation.
export default function Dashboard() {
  return (
    <>
      <PageHeader title="Dashboard" description="Module under construction" />
      <div className="app-card"><SkeletonTable /></div>
    </>
  )
}
