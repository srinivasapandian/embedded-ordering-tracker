import type { AuditLog } from '@/types'
import { pad2 } from './seedUtils'

type RawAudit = [
  minutesAgo: number,
  actor: string,
  action: string,
  module: AuditLog['module'],
  record: string,
  prev: string,
  next: string,
]

const MIN_PER_HOUR = 60
const MIN_PER_DAY = 1440

const rawAudits: RawAudit[] = [
  [35, 'Prince Thomas', 'Updated Migration Status', 'Migration', 'HBK Tampa', 'In Progress', 'Testing'],
  [MIN_PER_HOUR * 2, 'Anandhi Raman', 'Updated Ordering Status', 'Websites', 'HH Concord', 'Not Started', 'In Progress'],
  [MIN_PER_HOUR * 3 + 20, 'Karthik Subramanian', 'Assigned Team Member', 'Clients', 'Rotate Social', 'Unassigned', 'Sneha Pillai'],
  [MIN_PER_HOUR * 5, 'Prince Thomas', 'Updated Progress', 'Migration', 'Hyderabad Junction', '61%', '68%'],
  [MIN_PER_HOUR * 7, 'Lakshmi Venkat', 'Enabled Feature', 'Features', 'Loyalty Program', 'Disabled', 'Enabled'],
  [MIN_PER_DAY + 45, 'Priya Nair', 'Updated Client Status', 'Clients', 'Sacred Spice', 'Blocked', 'In Progress'],
  [MIN_PER_DAY + MIN_PER_HOUR * 3, 'Prince Thomas', 'Changed Priority', 'Priorities', 'QA regression round 2', 'Medium', 'High'],
  [MIN_PER_DAY + MIN_PER_HOUR * 6, 'Anandhi Raman', 'Created Client', 'Clients', 'Aahaa Indian Kitchen', '—', 'Created'],
  [MIN_PER_DAY + MIN_PER_HOUR * 8, 'Karthik Subramanian', 'Updated Due Date', 'Migration', 'Malgudi Garden', 'Aug 30, 2026', 'Aug 28, 2026'],
  [MIN_PER_DAY * 2 + 30, 'Divya Krishnan', 'Updated Progress', 'Migration', 'Malgudi Garden', '55%', '62%'],
  [MIN_PER_DAY * 2 + MIN_PER_HOUR * 4, 'Prince Thomas', 'Updated Migration Status', 'Migration', 'Krishna Vilas Cumming', 'In Progress', 'Testing'],
  [MIN_PER_DAY * 2 + MIN_PER_HOUR * 7, 'Lakshmi Venkat', 'Updated Deployment Status', 'Features', 'One-page Checkout', 'Planned', 'Testing'],
  [MIN_PER_DAY * 3 + MIN_PER_HOUR, 'Priya Nair', 'Updated Ordering Status', 'Websites', 'HH Woodlands', 'Not Started', 'In Progress'],
  [MIN_PER_DAY * 3 + MIN_PER_HOUR * 5, 'Rahul Menon', 'Added Migration Log', 'Migration', 'Sangam Wilmington', '—', 'Production cutover'],
  [MIN_PER_DAY * 3 + MIN_PER_HOUR * 9, 'Prince Thomas', 'Updated Migration Status', 'Migration', 'Sangam Wilmington', 'Testing', 'Completed'],
  [MIN_PER_DAY * 4 + 50, 'Anandhi Raman', 'Bulk Updated Priority', 'Clients', '4 clients', 'Low', 'Medium'],
  [MIN_PER_DAY * 4 + MIN_PER_HOUR * 6, 'Karthik Subramanian', 'Updated Client Stage', 'Clients', 'Chaat Junction', 'Requirements', 'Onboarded'],
  [MIN_PER_DAY * 5 + MIN_PER_HOUR * 2, 'Sneha Pillai', 'Updated Status', 'Priorities', 'Regression round 1 triage', 'In Progress', 'Review'],
  [MIN_PER_DAY * 5 + MIN_PER_HOUR * 5, 'Prince Thomas', 'Created Migration', 'Migration', 'Kumar’s Mess Dallas', '—', 'Planning'],
  [MIN_PER_DAY * 5 + MIN_PER_HOUR * 8, 'Lakshmi Venkat', 'Disabled Feature', 'Features', 'Heatmap Integration', 'Enabled', 'Disabled'],
  [MIN_PER_DAY * 6 + MIN_PER_HOUR, 'Priya Nair', 'Updated Client Status', 'Clients', 'TPC Hospitality', 'In Progress', 'Blocked'],
  [MIN_PER_DAY * 6 + MIN_PER_HOUR * 4, 'Prince Thomas', 'Updated Migration Status', 'Migration', 'Masala Twist', 'Testing', 'Completed'],
  [MIN_PER_DAY * 6 + MIN_PER_HOUR * 7, 'Meera Iyer', 'Updated Progress', 'Migration', 'A2B Illinois', '38%', '45%'],
  [MIN_PER_DAY * 7 + MIN_PER_HOUR * 2, 'Anandhi Raman', 'Updated Role', 'Team', 'Suresh Babu', 'Developer', 'Viewer'],
  [MIN_PER_DAY * 7 + MIN_PER_HOUR * 5, 'Karthik Subramanian', 'Created Priority', 'Priorities', 'Ordering go-live checklist', '—', 'Created'],
  [MIN_PER_DAY * 7 + MIN_PER_HOUR * 9, 'Prince Thomas', 'Updated Framework', 'Websites', 'Madurai Kitchen', 'React', 'Next.js'],
  [MIN_PER_DAY * 8 + MIN_PER_HOUR, 'Lakshmi Venkat', 'Created Feature', 'Features', 'Multi-region Failover', '—', 'Planned'],
  [MIN_PER_DAY * 8 + MIN_PER_HOUR * 4, 'Priya Nair', 'Updated Assigned Member', 'Migration', 'Brisque Grill', 'Divya Krishnan', 'Arjun Reddy'],
  [MIN_PER_DAY * 8 + MIN_PER_HOUR * 8, 'Prince Thomas', 'Deleted Priority', 'Priorities', 'Duplicate menu audit', 'Existing', '—'],
  [MIN_PER_DAY * 9 + MIN_PER_HOUR * 2, 'Anandhi Raman', 'Updated Ordering Status', 'Websites', 'Amudham Cafe', 'Not Started', 'In Progress'],
  [MIN_PER_DAY * 9 + MIN_PER_HOUR * 6, 'Karthik Subramanian', 'Updated Client Priority', 'Clients', 'Hyderabad Junction', 'Medium', 'High'],
  [MIN_PER_DAY * 10 + MIN_PER_HOUR * 3, 'Prince Thomas', 'Updated Migration Status', 'Migration', 'HBK Lawrenceville', 'Testing', 'Completed'],
]

export const seedAuditLogs: AuditLog[] = rawAudits.map(([minutesAgo, actor, action, module, recordName, prev, next], i) => ({
  id: `a${pad2(i + 1)}`,
  timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  actor,
  action,
  module,
  recordName,
  previousValue: prev,
  newValue: next,
}))
