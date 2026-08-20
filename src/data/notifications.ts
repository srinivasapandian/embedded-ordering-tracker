import type { AppNotification } from '@/types'
import { minutesAgoIso } from './seedUtils'

export const seedNotifications: AppNotification[] = [
  {
    id: 'n01',
    title: 'HBK Tampa moved to Testing',
    description: 'Migration progressed to the QA stage — regression round 2 scheduled.',
    timestamp: minutesAgoIso(40),
    read: false,
    kind: 'info',
  },
  {
    id: 'n02',
    title: 'Krishna Vilas Cumming at 93%',
    description: 'Cutover rehearsal booked for this week.',
    timestamp: minutesAgoIso(160),
    read: false,
    kind: 'success',
  },
  {
    id: 'n03',
    title: 'Manam QA is overdue',
    description: 'Testing due date passed 2 days ago — needs a new ETA.',
    timestamp: minutesAgoIso(60 * 7),
    read: false,
    kind: 'warning',
  },
  {
    id: 'n04',
    title: 'Loyalty Program enabled',
    description: 'Feature enabled for 9 clients by Lakshmi Venkat.',
    timestamp: minutesAgoIso(60 * 9),
    read: true,
    kind: 'success',
  },
  {
    id: 'n05',
    title: 'Madras Mojo still blocked',
    description: 'Menu restructure pending on the client for 12 days.',
    timestamp: minutesAgoIso(60 * 26),
    read: true,
    kind: 'warning',
  },
  {
    id: 'n06',
    title: 'Weekly priorities published',
    description: '9 items planned for this week across 8 websites.',
    timestamp: minutesAgoIso(60 * 30),
    read: true,
    kind: 'info',
  },
]
