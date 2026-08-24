/**
 * Raw rows pulled from the "MaghilHub_Executive_Dashboard" spreadsheet
 * (Client Portfolio / Embedded Ordering tab), transcribed as-is — column
 * order matches the sheet: Brand, Client, Region, Status (embedded ordering
 * status), EmbLive (site/dev status label), LiveLink, CurrentStack,
 * TargetStack, MigrationDate, MigrationStatus, Remarks.
 *
 * This is the input to `mapImportRow` in `clientImportMapping.ts` — nothing
 * here is written to Firestore directly. Review/edit rows here, then use the
 * "Import" flow in the Client Tracker to preview and confirm before saving.
 */
export interface ImportSourceRow {
  brand: string
  client: string
  region: string
  status: string
  embLive: string
  liveLink: string
  currentStack: string
  targetStack: string
  migrationDate: string
  migrationStatus: string
  remarks: string
}

export const CLIENT_IMPORT_SOURCE: ImportSourceRow[] = [
  { brand: '', client: 'Kumars', region: 'Texas', status: 'NA', embLive: 'Live', liveLink: 'https://kumarmessdallas.com/', currentStack: 'HTML', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: 'Static' },
  { brand: '', client: 'Thanjai Mess New Jersey', region: 'New Jersey', status: 'Not Started', embLive: 'Planned Development', liveLink: 'https://thanjaimess.com/', currentStack: 'HTML', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: 'Static' },
  { brand: '', client: 'Thanjai Restaurant Houston', region: 'Houston', status: 'Not Started', embLive: 'Planned Development', liveLink: 'https://thanjairestauranthouston.com/', currentStack: 'HTML', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: 'Static' },
  { brand: '', client: 'Salem RR McKinney', region: 'Mckinney', status: 'Not Started', embLive: 'Planned Development', liveLink: 'https://salemrrbiryanimckinney.com/', currentStack: 'HTML', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: 'Static' },
  { brand: '', client: 'Fabio fitness', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://fabioparentefitness.com/', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: 'Static' },
  { brand: '', client: 'Athidhi Aalayam', region: 'Frisco', status: 'Not Started', embLive: 'Live', liveLink: 'https://athidhiaalayam.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Sri Krishna Vilas', region: 'Frisco', status: 'Not Started', embLive: 'Live', liveLink: 'https://srikrishnavilas.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Elysium', region: 'Dallas', status: 'Not Started', embLive: 'Live', liveLink: 'https://theelysium.us/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Maghil', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://www.maghil.com/', currentStack: 'React JS', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'HBK, Iselin', region: 'Iselin', status: 'Completed', embLive: 'Live', liveLink: 'https://hbkiselinnj.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '31-07-2026', migrationStatus: 'Completed', remarks: '' },
  { brand: '', client: 'EatStreet', region: 'Dallas', status: 'Not Started', embLive: 'Live', liveLink: 'https://eatstreetindian.com/', currentStack: 'React JS', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'RetroStreet', region: 'Frisco', status: 'Not Started', embLive: 'Live', liveLink: 'https://retrostreetbar.com/', currentStack: 'React JS', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'TakTakFoods', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://taktakfoods.com/', currentStack: 'Shopify', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Malgudi, plano', region: 'Plano', status: 'Not Started', embLive: 'Live', liveLink: 'https://malgudigardenplano.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Sri Annapoorna', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'http://sriannapoornausa.com/', currentStack: 'Shopify', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'A2B', client: 'A2B illinois', region: 'Illinois', status: 'Not Started', embLive: 'Live', liveLink: 'https://www.a2billinois.com/', currentStack: 'Wordpress', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'A2B', client: 'A2B newjersey', region: 'New Jersey', status: 'Not Started', embLive: 'Live', liveLink: 'https://www.a2bnewjersey.com/', currentStack: 'Wordpress', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'A2B', client: 'A2B ma', region: 'MA', status: 'Not Started', embLive: 'Live', liveLink: 'https://a2bma.com/', currentStack: 'Wordpress', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'A2B', client: 'A2B NC', region: 'NC', status: 'Not Started', embLive: 'Live', liveLink: 'https://a2bnc.com/', currentStack: 'Wordpress', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HBK', client: 'HBK Master', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://houseofbiryanisandkebabs.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HBK', client: 'HBK frisco', region: 'Frisco', status: 'Completed', embLive: 'Live', liveLink: 'https://hbkfrisco.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '31-07-2026', migrationStatus: 'Completed', remarks: '' },
  { brand: '', client: 'Amutham Cafe', region: 'NA', status: 'In Progress', embLive: 'Live', liveLink: 'https://www.amudhamcafe.com/', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '19.08.2026', migrationStatus: '', remarks: 'If we update the menu before the 17' },
  { brand: '', client: 'farm2 house', region: 'Northlake', status: 'Completed', embLive: 'Live', liveLink: 'https://farm2homeusa.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HBK', client: 'HBK, Tampa', region: 'Tampa', status: 'Completed', embLive: 'Live', liveLink: 'https://hbktampa.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '07.08.2026', migrationStatus: 'Completed', remarks: '' },
  { brand: '', client: 'specail nine', region: 'Texas', status: 'Not Started', embLive: 'Live', liveLink: 'https://special9.us/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Monks, Allen', region: 'Allen', status: 'Completed', embLive: 'Live', liveLink: 'https://monksallen.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '07.08.2026', migrationStatus: 'Completed', remarks: '' },
  { brand: '', client: 'Hyderbad Junction', region: 'Northlake', status: 'Completed', embLive: 'QA', liveLink: 'https://thehyderabadjunction.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '07.08.2026', migrationStatus: 'Completed', remarks: '' },
  { brand: '', client: 'Brisque', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://www.brisque.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Madurai Kitchen', region: 'NA', status: 'Not Started', embLive: 'Live', liveLink: 'https://maduraikitchenusa.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '21.08.2026', migrationStatus: '', remarks: '' },
  { brand: 'HBK', client: 'HBK, RoyersFord', region: 'RF', status: 'Completed', embLive: 'Live', liveLink: 'https://hbkroyersford.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '31-07-2026', migrationStatus: 'Completed', remarks: '' },
  { brand: 'HBK', client: 'HBK, Atlanta', region: 'Atlanta', status: 'Completed', embLive: 'Live', liveLink: 'https://hbkjohnscreek.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '31-07-2026', migrationStatus: 'Completed', remarks: '' },
  { brand: '', client: 'Hyderabad Biryani & Banquet', region: 'NJ', status: 'Completed', embLive: 'Live', liveLink: 'https://hyderabadbiryaninj.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Jatara', region: 'Texas', status: 'Completed', embLive: 'Live', liveLink: 'https://www.jataratx.com/', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Cafe Paradise', region: 'Frisco', status: 'Completed', embLive: 'Live', liveLink: 'https://paradisefrisco.com/', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Bheema - Indian Cuisine', region: 'NJ', status: 'Completed', embLive: 'Live', liveLink: 'https://bheemacuisine.com/', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HH', client: 'HH Brandon', region: 'Tampa', status: 'Completed', embLive: 'Live', liveLink: 'https://nawabihhbrandon.com/', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Sangam', region: 'Wilmington', status: 'Completed', embLive: 'Live', liveLink: 'https://sangamwilmington.com/', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '21.08.2026', migrationStatus: '', remarks: '' },
  { brand: 'HH', client: 'HH FortWorth', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://hhfortworth.com/', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HH', client: 'HH San Antonio', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://hhmonkssanantonio.com', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HH', client: 'HH Novi', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://hhnovi.com', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HH', client: 'HH Alabama', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://www.hhbhm.com', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HH', client: 'HH Charlotte/Ballantyne', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'http://www.hhballantyne.com', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HH', client: 'HHNC Express', region: 'NA', status: 'NA', embLive: 'Live', liveLink: '', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HH', client: 'HH Woodlands', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'http://www.hhwoodlands.com', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Masala Twist', region: 'Sachse', status: 'Completed', embLive: 'Live', liveLink: '', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '15.08.2026', migrationStatus: 'Completed', remarks: '' },
  { brand: 'Monks', client: 'Irving', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://monks-irving.maghil.com/restaurant/monk-irving-tx/menu/Pickup', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'RR/Austin', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'http://monksroundrock.com', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'Simply South', client: 'Simply South Warenville', region: 'NA', status: 'In Progress', embLive: 'Planned Development', liveLink: '', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'Simply South', client: 'SSFC', region: 'NA', status: 'NA', embLive: 'Live', liveLink: '', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'Simply South', client: 'SSIV', region: 'NA', status: 'NA', embLive: 'Live', liveLink: '', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Utsav Grand', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://order.utsavgrandusa.com/restaurant/utsav-grand-nj/menu/Pickup', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'HBK Lawrenceville', region: 'LV NJ', status: 'Completed', embLive: 'Ready for Go Live', liveLink: 'https://hbk-lawrenceville.maghil.com/restaurant/hbk-lawrenceville/menu/Delivery', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '10.08.2026', migrationStatus: 'Completed', remarks: 'Domain Pending' },
  { brand: '', client: 'Manam', region: 'NA', status: 'Completed', embLive: 'Ready for Go Live', liveLink: '', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Bhimas', region: 'ML NJ', status: 'Completed', embLive: 'Ready for Go Live', liveLink: '', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Rotate Social', region: 'NA', status: 'Completed', embLive: 'Ready for Go Live', liveLink: 'https://rotate-social-tx.maghil.com/restaurant/rotate-social-frisco/menu/Pickup', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Birista House', region: 'NA', status: 'Completed', embLive: 'Live', liveLink: 'https://birista-house-frisco.maghil.com/restaurant/birista-house-frisco/menu/Pickup', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '07.08.2026', migrationStatus: 'Completed', remarks: '' },
  { brand: '', client: 'THE Konkan', region: 'NA', status: 'In Progress', embLive: 'Planned Development', liveLink: '', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'muniyandi vilas', region: 'NA', status: 'In Progress', embLive: 'Planned Development', liveLink: '', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HH', client: 'HH Prosper', region: 'NA', status: 'Not Started', embLive: 'Planned Development', liveLink: 'https://hyd-house-prosper.maghil.com/restaurant/hyd-house-prosper/menu/Pickup', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'HH', client: 'HH Irving', region: 'NA', status: 'Completed', embLive: 'Live', liveLink: 'https://hh-irving.maghil.com/restaurant/hyd-house-irving/menu/Pickup', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '13.08.2026', migrationStatus: 'Completed', remarks: '' },
  { brand: 'HH', client: 'HH Concord', region: 'NA', status: 'Completed', embLive: 'QA', liveLink: '', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '21.08.2026', migrationStatus: '', remarks: '' },
  { brand: 'TPC', client: 'The pulav company frisco', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://tcp-frisco.maghil.com/restaurant/the-pulao-frisco/menu/Pickup', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'TPC', client: 'The pulav company Leander/Austin', region: 'NA', status: 'Not Started', embLive: 'On Hold', liveLink: 'https://tcp-austin.maghil.com/restaurant/the-pulao-leander/menu/Pickup', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'Madras Mojo', client: 'Madras mojo Colleyvile', region: 'NA', status: 'Not Started', embLive: 'On Hold', liveLink: 'https://madras-mojo-tx.maghil.com/restaurant/madras-mojo-tx', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'Madras Mojo', client: 'Madras mojo Mckinney', region: 'NA', status: 'Not Started', embLive: 'Live', liveLink: 'https://madras-mojo-mckinney.maghil.com/restaurant/madras-mojo-mckinney/menu/Pickup', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: 'SKV', client: 'Sri Kirshna Vilas Cumming', region: 'NA', status: 'NA', embLive: 'Live', liveLink: 'https://krishna-vilas-cumming.maghil.com/restaurant/krishna-vilas-cumming/menu/Pickup', currentStack: 'React JS', targetStack: 'Next JS', migrationDate: '', migrationStatus: '', remarks: 'Static' },
  { brand: 'Sacred Spice', client: 'Sacred Spice Indian restaurant', region: 'NA', status: 'Not Started', embLive: 'Planned Development', liveLink: 'https://sacred-spice-fl.maghil.com/restaurant/sacred-spice-largo/menu/Pickup', currentStack: 'NA', targetStack: 'NA', migrationDate: '', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Aahaa- Indian Kitchen', region: 'NA', status: 'In Progress', embLive: 'Under Developement', liveLink: '', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '19.08.2026', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Pakka Spice', region: 'NA', status: 'In Progress', embLive: 'Planned Development', liveLink: '', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '26.08.2026', migrationStatus: '', remarks: '' },
  { brand: '', client: 'Chaat Junction', region: 'NA', status: 'In Progress', embLive: 'Planned Development', liveLink: '', currentStack: 'Next JS', targetStack: 'Next JS', migrationDate: '26.08.2026', migrationStatus: '', remarks: '' },
]
