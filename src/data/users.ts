import type { TeamMember } from '@/types'
import { daysAgoIso } from './seedUtils'

/** Seed team members. tm01 is the signed-in demo user. */
export const seedTeamMembers: TeamMember[] = [
  member('tm01', 'Prince Thomas', 'prince@brisqueemb.com', 'super-admin', 'Engineering Lead', 'bg-indigo-500', 400),
  member('tm02', 'Anandhi Raman', 'anandhi@brisqueemb.com', 'admin', 'Delivery Manager', 'bg-rose-500', 380),
  member('tm03', 'Karthik Subramanian', 'karthik@brisqueemb.com', 'manager', 'Onboarding Manager', 'bg-emerald-500', 360),
  member('tm04', 'Divya Krishnan', 'divya@brisqueemb.com', 'developer', 'Frontend Engineer', 'bg-sky-500', 340),
  member('tm05', 'Rahul Menon', 'rahul@brisqueemb.com', 'developer', 'Migration Engineer', 'bg-amber-500', 320),
  member('tm06', 'Meera Iyer', 'meera@brisqueemb.com', 'developer', 'Full-stack Engineer', 'bg-violet-500', 300),
  member('tm07', 'Vignesh Kumar', 'vignesh@brisqueemb.com', 'developer', 'Frontend Engineer', 'bg-cyan-500', 280),
  member('tm08', 'Priya Nair', 'priya@brisqueemb.com', 'manager', 'Client Success Manager', 'bg-fuchsia-500', 260),
  member('tm09', 'Arjun Reddy', 'arjun@brisqueemb.com', 'developer', 'Platform Engineer', 'bg-teal-500', 240),
  member('tm10', 'Sneha Pillai', 'sneha@brisqueemb.com', 'manager', 'QA Lead', 'bg-orange-500', 220),
  member('tm11', 'Suresh Babu', 'suresh@brisqueemb.com', 'viewer', 'Operations Analyst', 'bg-lime-600', 200),
  member('tm12', 'Lakshmi Venkat', 'lakshmi@brisqueemb.com', 'admin', 'Program Manager', 'bg-pink-500', 180),
]

function member(
  id: string,
  name: string,
  email: string,
  role: TeamMember['role'],
  title: string,
  color: string,
  createdDaysAgo: number,
): TeamMember {
  return { id, name, email, role, title, color, active: true, createdAt: daysAgoIso(createdDaysAgo) }
}

/** Developers eligible for migration assignment. */
export const DEVELOPER_IDS = ['tm04', 'tm05', 'tm06', 'tm07', 'tm09']
