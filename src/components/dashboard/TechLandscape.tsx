import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, type BarDatum } from '@/components/common/BarChart'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useAppStore } from '@/store/appStore'

export function TechLandscape() {
  const websites = useAppStore((s) => s.websites)

  const data = useMemo<BarDatum[]>(() => {
    const count = (framework: string) => websites.filter((w) => w.framework === framework).length

    const all = [
      { label: 'Next.js', value: count('nextjs'), color: '#dc2626' },
      { label: 'React.js', value: count('react'), color: '#8b5cf6' },
      { label: 'WordPress', value: count('wordpress'), color: '#0ea5e9' },
      { label: 'Shopify', value: count('shopify'), color: '#10b981' },
      { label: 'HTML', value: count('html'), color: '#f59e0b' },
      { label: 'WIX', value: count('wix'), color: '#ec4899' },
    ]
    const present = all.filter((d) => d.value > 0).sort((a, b) => b.value - a.value)
    // No websites registered yet — show every platform at 0 as a placeholder
    // instead of an empty chart, so the categories are visible before data exists.
    return present.length > 0 ? present : all
  }, [websites])

  return (
    <section aria-labelledby="tech-landscape-heading">
      <SectionHeader title="Technology Landscape" description="Website distribution by platform" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
        className="app-card h-full p-5"
      >
        <BarChart data={data} />
      </motion.div>
    </section>
  )
}
