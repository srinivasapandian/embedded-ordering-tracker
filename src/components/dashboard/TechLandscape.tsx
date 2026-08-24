import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, type BarDatum } from '@/components/common/BarChart'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useAppStore } from '@/store/appStore'

export function TechLandscape() {
  const websites = useAppStore((s) => s.websites)

  const data = useMemo<BarDatum[]>(() => {
    const count = (framework: string) => websites.filter((w) => w.framework === framework).length

    return [
      { label: 'Next.js', value: count('nextjs'), color: '#dc2626' },
      { label: 'React.js', value: count('react'), color: '#475569' },
      { label: 'WordPress', value: count('wordpress'), color: '#64748b' },
      { label: 'Shopify', value: count('shopify'), color: '#94a3b8' },
      { label: 'HTML', value: count('html'), color: '#cbd5e1' },
    ].filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
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
