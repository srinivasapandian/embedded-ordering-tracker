import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonTable } from '@/components/common/Skeleton'

// Placeholder — replaced during module implementation.
export default function Migration() {
  return (
    <>
      <PageHeader title="Migration" description="Module under construction" />
      <div className="app-card"><SkeletonTable /></div>
    </>
  )
}
