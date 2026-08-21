import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, type BarDatum } from '@/components/common/BarChart'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useAppStore } from '@/store/appStore'
import { mockRatio } from '@/utils/mockDisplay'

/**
 * Legacy CMS platforms (WordPress / Shopify / Wix) aren't part of the real
 * Framework model — only React.js and Next.js are tracked live. Their bars
 * use a stable mock ratio of the real website count, per the brief's
 * "use mock values if actual values are unavailable".
 */
export function TechLandscape() {
  const websites = useAppStore((s) => s.websites)

  const data = useMemo<BarDatum[]>(() => {
    const nextjs = websites.filter((w) => w.framework === 'nextjs').length
    const react = websites.length - nextjs
    const total = Math.max(1, websites.length)
    const wordpress = Math.round(total * (0.06 + mockRatio('wordpress') * 0.05))
    const shopify = Math.round(total * (0.03 + mockRatio('shopify') * 0.04))
    const wix = Math.round(total * (0.01 + mockRatio('wix') * 0.03))

    return [
      { label: 'Next.js', value: nextjs, color: '#dc2626' },
      { label: 'React.js', value: react, color: '#475569' },
      { label: 'WordPress', value: wordpress, color: '#64748b', caption: 'mock' },
      { label: 'Shopify', value: shopify, color: '#94a3b8', caption: 'mock' },
      { label: 'Wix', value: wix, color: '#cbd5e1', caption: 'mock' },
    ].sort((a, b) => b.value - a.value)
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
