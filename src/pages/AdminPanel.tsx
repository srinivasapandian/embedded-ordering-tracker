import { useState } from 'react'
import { Earth, Users } from 'lucide-react'
import { ClientsManager } from '@/components/admin/ClientsManager'
import { WebsitesManager } from '@/components/admin/WebsitesManager'
import { Tabs } from '@/components/common/Tabs'
import { PageHeader } from '@/components/common/PageHeader'
import { useAppStore } from '@/store/appStore'

export default function AdminPanel() {
  const clients = useAppStore((s) => s.clients)
  const websites = useAppStore((s) => s.websites)
  const [activeTab, setActiveTab] = useState('clients')

  return (
    <>
      <PageHeader title="Admin Panel" description="Manage the mock client and website records used across the console" />
      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        layoutId="admin-panel-tabs"
        items={[
          { key: 'clients', label: 'Clients', icon: Users, count: clients.length },
          { key: 'websites', label: 'Websites', icon: Earth, count: websites.length },
        ]}
      />
      <div className="mt-4">
        {activeTab === 'clients' ? <ClientsManager /> : <WebsitesManager />}
      </div>
    </>
  )
}
