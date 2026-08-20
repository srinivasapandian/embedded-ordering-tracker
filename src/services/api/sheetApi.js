const sheetExportUrl = '/sheet-data'

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const next = text[index + 1]
    if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; continue }
    if (character === '"') { quoted = !quoted; continue }
    if (character === ',' && !quoted) { row.push(cell); cell = ''; continue }
    if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1
      row.push(cell)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      cell = ''
      continue
    }
    cell += character
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

const value = (row, index) => (row[index] || '').trim()

export async function getSheetRecords() {
  const response = await fetch(sheetExportUrl)
  if (!response.ok) throw new Error(`Sheet export failed with ${response.status}`)
  const rows = parseCsv(await response.text()).slice(3)
  return rows.map((row) => ({
    Brand: value(row, 0), Client: value(row, 1), Country: value(row, 2), Region: value(row, 3),
    'Emb Status': value(row, 4), 'Emb Live': value(row, 5), 'LIVE LINK': value(row, 6),
    'Emb ordering': value(row, 10), Offers: value(row, 12), Loyalty: value(row, 14), Reservation: value(row, 15), 'Event ordering': value(row, 17),
    'Current Stack': value(row, 18), 'Target Stack': value(row, 19), 'Migration Quarter': value(row, 20), 'Migration Status': value(row, 21), 'Current MG Status': value(row, 22),
    Status: value(row, 23), 'Deployed Date': value(row, 24), SEO: value(row, 25), 'QA Approval': value(row, 26), Remarks: value(row, 27),
  })).filter((record) => record.Client)
}
