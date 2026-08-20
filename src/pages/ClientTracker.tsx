import { PageHeader } from '@/components/common/PageHeader'
import { ClientsManager } from '@/components/admin/ClientsManager'

export default function ClientTracker() {
  return (
    <>
      <PageHeader title="Client Tracker" description="Track client onboarding, ordering setup, and migration progress" />
      <ClientsManager />
    </>
  )
}
