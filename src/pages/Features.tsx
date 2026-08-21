import { useMemo, useState } from 'react'
import { CalendarCheck, Heart, PartyPopper, Tag } from 'lucide-react'
import { MetricCard, type MetricTone } from '@/components/common/MetricCard'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FeatureMatrix } from '@/components/features/FeatureMatrix'
import { CAPABILITIES, useFeatureRows, type Capability } from '@/components/features/useFeatureRows'
import { pct, pctNumber } from '@/utils/format'

const CAPABILITY_META: Record<Capability, { icon: typeof Tag; tone: MetricTone; caption: string }> = {
  Offers: { icon: Tag, tone: 'amber', caption: 'Promotional offers enabled' },
  Loyalty: { icon: Heart, tone: 'emerald', caption: 'Loyalty program enabled' },
  'Event Ordering': { icon: PartyPopper, tone: 'slate', caption: 'Catering & event ordering enabled' },
  Reservation: { icon: CalendarCheck, tone: 'indigo', caption: 'Table reservations enabled' },
}

export default function Features() {
  const rows = useFeatureRows()
  const [search, setSearch] = useState('')

  const summary = useMemo(() => {
    const total = rows.length
    return CAPABILITIES.map((capability) => {
      const enabled = rows.filter((r) => r.states[capability] === 'enabled').length
      return { capability, enabled, total }
    })
  }, [rows])

  return (
    <>
      <PageHeader
        title="Features"
        description="Rollout status for Offers, Loyalty, Reservation and Event Ordering across the client portfolio"
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {summary.map(({ capability, enabled, total }, i) => {
          const meta = CAPABILITY_META[capability]
          return (
            <MetricCard
              key={capability}
              title={capability}
              value={enabled}
              icon={meta.icon}
              tone={meta.tone}
              percent={pct(enabled, total, 0)}
              progress={pctNumber(enabled, total)}
              caption={meta.caption}
              index={i}
            />
          )
        })}
      </div>

      <SectionHeader
        className="mt-6"
        title="Client Rollout Matrix"
        description="Which clients have each capability enabled, in progress, or not available"
        actions={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search client or location…"
            className="w-64"
            aria-label="Search clients"
          />
        }
      />
      <FeatureMatrix search={search} />
    </>
  )
}
