import { PageHeader } from '@/components/common/PageHeader'
import { ClientsManager } from '@/components/admin/ClientsManager'

export default function ClientTracker() {
  return (
    <>
      <PageHeader
        title="Client Tracker"
        description="Read-only view of client onboarding, ordering setup, and migration progress — manage clients from the Admin Panel."
      />
      <ClientsManager readOnly />
    </>
  )
}
