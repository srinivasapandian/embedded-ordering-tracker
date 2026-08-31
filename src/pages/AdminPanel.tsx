import { useState } from 'react'
import { CalendarClock, Presentation, Users } from 'lucide-react'
import { ClientsManager } from '@/components/admin/ClientsManager'
import { PrioritiesManager } from '@/components/admin/PrioritiesManager'
import { PresentMode } from '@/components/present/PresentMode'
import { Tabs } from '@/components/common/Tabs'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/common/Button'
import { useAppStore } from '@/store/appStore'

export default function AdminPanel() {
  const clients = useAppStore((s) => s.clients)
  const priorities = useAppStore((s) => s.priorities)
  const [activeTab, setActiveTab] = useState('tracker')
  const [presenting, setPresenting] = useState(false)

  return (
    <>
      <PageHeader
        title="Admin Panel"
        description="The only place client records get created or edited — Client Tracker and Master Tracker are read-only views of this same data."
        actions={
          <Button variant="outline" size="sm" onClick={() => setPresenting(true)}>
            <Presentation className="h-3.5 w-3.5" aria-hidden />
            Present
          </Button>
        }
      />
      <PresentMode open={presenting} onClose={() => setPresenting(false)} />
      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        layoutId="admin-panel-tabs"
        items={[
          { key: 'tracker', label: 'Edit Tracker', icon: Users, count: clients.length },
          { key: 'priorities', label: 'Weekly Priority', icon: CalendarClock, count: priorities.length },
        ]}
      />
      <div className="mt-4">
        {activeTab === 'tracker' && <ClientsManager />}
        {activeTab === 'priorities' && <PrioritiesManager />}
      </div>
    </>
  )
}
