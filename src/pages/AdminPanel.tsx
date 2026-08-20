import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonTable } from '@/components/common/Skeleton'

// Placeholder — replaced during module implementation.
export default function AdminPanel() {
  return (
    <>
      <PageHeader title="AdminPanel" description="Module under construction" />
      <div className="app-card"><SkeletonTable /></div>
    </>
  )
}
