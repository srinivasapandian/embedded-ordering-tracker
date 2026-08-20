import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonTable } from '@/components/common/Skeleton'

// Placeholder — replaced during module implementation.
export default function ClientTracker() {
  return (
    <>
      <PageHeader title="ClientTracker" description="Module under construction" />
      <div className="app-card"><SkeletonTable /></div>
    </>
  )
}
