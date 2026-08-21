import { useMemo } from 'react'
import type { CapabilityState, ClientCapabilities } from '@/types'
import { useAppStore } from '@/store/appStore'

export type { CapabilityState }

/** The four capabilities actually tracked per client. */
export const CAPABILITIES = ['Offers', 'Loyalty', 'Event Ordering', 'Reservation'] as const
export type Capability = (typeof CAPABILITIES)[number]

/** Maps the display label used across Features UI to its store key. */
export const CAPABILITY_KEY: Record<Capability, keyof ClientCapabilities> = {
  Offers: 'offers',
  Loyalty: 'loyalty',
  'Event Ordering': 'eventOrdering',
  Reservation: 'reservation',
}

export interface FeatureRow {
  clientId: string
  clientName: string
  location: string
  states: Record<Capability, CapabilityState>
}

/**
 * Client x capability rollout rows, shared by the summary cards, the Features
 * matrix and the Admin Panel's Features manager so their numbers always
 * agree. Backed by the real, admin-editable `client.capabilities` field.
 */
export function useFeatureRows(): FeatureRow[] {
  const clients = useAppStore((s) => s.clients)

  return useMemo(
    () =>
      [...clients]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((client) => ({
          clientId: client.id,
          clientName: client.name,
          location: client.location,
          states: {
            Offers: client.capabilities.offers,
            Loyalty: client.capabilities.loyalty,
            'Event Ordering': client.capabilities.eventOrdering,
            Reservation: client.capabilities.reservation,
          },
        })),
    [clients],
  )
}
