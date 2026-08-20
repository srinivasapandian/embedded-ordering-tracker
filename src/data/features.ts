import type { DeploymentStatus, Feature, FeatureCategory } from '@/types'
import { seedClients } from './clients'
import { daysAgoIso, pad2 } from './seedUtils'

type RawFeature = [
  name: string,
  category: FeatureCategory,
  status: DeploymentStatus,
  enabled: boolean,
  description: string,
]

const rawFeatures: RawFeature[] = [
  // Ordering
  ['Embedded Ordering Widget', 'ordering', 'deployed', true, 'Drop-in ordering flow embedded directly on client websites with pickup and delivery support.'],
  ['Online Payments — Stripe', 'ordering', 'deployed', true, 'Card, wallet and saved-payment support through Stripe with automatic receipt emails.'],
  ['Guest Checkout', 'ordering', 'deployed', true, 'Order without creating an account; phone verification keeps fraud low.'],
  ['Order Scheduling', 'ordering', 'testing', true, 'Let customers place orders up to 7 days ahead with kitchen capacity limits.'],
  ['Curbside Pickup', 'ordering', 'planned', false, 'Vehicle details at checkout and an "I have arrived" flow for staff notification.'],
  ['Event Ordering', 'ordering', 'testing', false, 'Large-format event orders with deposits and per-head pricing.'],
  ['Catering Orders', 'ordering', 'planned', false, 'Catering menus with lead-time rules and delivery zone pricing.'],
  // Reservation
  ['Table Reservations', 'reservation', 'deployed', true, 'Real-time table availability with configurable seating windows and party sizes.'],
  ['Waitlist Management', 'reservation', 'testing', true, 'Walk-in waitlist with SMS notifications when the table is ready.'],
  ['Private Dining Requests', 'reservation', 'planned', false, 'Request-and-quote workflow for private rooms and buyouts.'],
  // SEO
  ['Metadata API Integration', 'seo', 'deployed', true, 'Per-page titles, descriptions and Open Graph tags generated from menu data.'],
  ['Structured Data (Schema.org)', 'seo', 'deployed', true, 'Restaurant, Menu and LocalBusiness structured data for rich search results.'],
  ['Sitemap Automation', 'seo', 'deployed', true, 'Sitemaps regenerate automatically when menus or locations change.'],
  ['Local SEO Pages', 'seo', 'testing', true, 'Location landing pages tuned for "near me" search queries.'],
  // Analytics
  ['Order Analytics Dashboard', 'analytics', 'deployed', true, 'Daily orders, average ticket and top items per location.'],
  ['Conversion Funnel Tracking', 'analytics', 'testing', true, 'Menu view → cart → checkout funnel with drop-off analysis.'],
  ['Heatmap Integration', 'analytics', 'planned', false, 'Session heatmaps on menu pages to tune layout and photography.'],
  // Marketing
  ['Offers & Coupons', 'marketing', 'deployed', true, 'Percentage, fixed and BOGO offers with schedule windows and usage caps.'],
  ['Loyalty Program', 'marketing', 'testing', true, 'Points on every order with tier-based rewards and birthday bonuses.'],
  ['Email Campaign Sync', 'marketing', 'planned', false, 'Sync customer segments to email tools for win-back campaigns.'],
  ['SMS Notifications', 'marketing', 'testing', true, 'Order status texts plus opt-in promotional blasts.'],
  // UI/UX
  ['Dark Mode Storefront', 'uiux', 'deployed', true, 'Automatic dark theme for ordering pages based on visitor preference.'],
  ['Accessible Menu Browser', 'uiux', 'deployed', true, 'WCAG AA menu browsing with keyboard navigation and screen-reader labels.'],
  ['One-page Checkout', 'uiux', 'testing', true, 'Single-step checkout that cut abandonment 14% in pilots.'],
  ['PWA Install Prompt', 'uiux', 'planned', false, 'Installable ordering app with offline menu browsing.'],
  // Infrastructure
  ['Edge Caching', 'infrastructure', 'deployed', true, 'Menu and page payloads cached at the edge for sub-100ms loads.'],
  ['Image CDN Optimization', 'infrastructure', 'deployed', true, 'Automatic AVIF/WebP conversion and responsive sizes for food photography.'],
  ['ISR Revalidation', 'infrastructure', 'testing', true, 'Incremental static regeneration keeps menu pages fresh without full deploys.'],
  ['Multi-region Failover', 'infrastructure', 'planned', false, 'Automatic failover to a secondary region during provider incidents.'],
]

const clientIds = seedClients.map((c) => c.id)

export const seedFeatures: Feature[] = rawFeatures.map(([name, category, status, enabled, description], i) => {
  // Deployed features support many clients, testing some, planned none/few.
  const supportCount = status === 'deployed' ? 18 + ((i * 5) % 16) : status === 'testing' ? 4 + (i % 6) : 0
  const supportedClientIds = Array.from(
    { length: supportCount },
    (_, k) => clientIds[(i * 7 + k * 3) % clientIds.length]!,
  ).filter((v, idx, arr) => arr.indexOf(v) === idx)
  return {
    id: `f${pad2(i + 1)}`,
    name,
    description,
    category,
    status,
    enabled,
    supportedClientIds,
    createdAt: daysAgoIso(200 - i * 5, 9, 15),
    updatedAt: daysAgoIso((i * 3) % 21, 10 + (i % 7), (i * 19) % 60),
  }
})
