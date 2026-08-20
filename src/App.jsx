import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { featureFields, trackerData } from './data/trackerData'
import { getSheetRecords } from './services/api/sheetApi'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', short: '01' },
  { id: 'tracker', label: 'Client tracker', short: '02' },
  { id: 'features', label: 'Features', short: '03' },
  { id: 'migration', label: 'Migration', short: '04' },
]
const tableColumns = [
  { key: 'Brand', label: 'Brand' }, { key: 'Client', label: 'Client' }, { key: 'Emb Live', label: 'Emb live' },
  { key: 'Status', label: 'Status' }, { key: 'Migration Status', label: 'Migration' }, { key: 'QA Approval', label: 'QA approval' },
]
const filterOptions = (key, records = trackerData) => [...new Set(records.map((record) => record[key]).filter(Boolean))]

function StatusMark({ value }) {
  const tone = String(value).toLowerCase().replaceAll(' ', '-')
  return <span className={`status-mark status-${tone}`}><i />{value || '—'}</span>
}
function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ Status: '' })
  const [sort, setSort] = useState({ key: 'Client', direction: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [visibleColumns, setVisibleColumns] = useState(tableColumns.map((column) => column.key))
  const [selectedClient, setSelectedClient] = useState(null)
  const [showColumns, setShowColumns] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [records, setRecords] = useState(trackerData)
  const [dataSource, setDataSource] = useState('Local fallback')
  const [dataLoadError, setDataLoadError] = useState('')
  useEffect(() => {
    getSheetRecords().then((sheetRecords) => { if (sheetRecords.length) { setRecords(sheetRecords); setDataSource('Google Sheet'); setDataLoadError('') } }).catch((error) => { setDataLoadError(error.message) })
  }, [])
  const filteredRecords = useMemo(() => records.filter((record) => {
    const searchable = Object.values(record).join(' ').toLowerCase()
    return searchable.includes(query.toLowerCase()) && Object.entries(filters).every(([key, value]) => !value || record[key] === value)
  }), [filters, query])
  const sortedRecords = useMemo(() => [...filteredRecords].sort((a, b) => String(a[sort.key] || '').localeCompare(String(b[sort.key] || '')) * (sort.direction === 'asc' ? 1 : -1)), [filteredRecords, sort])
  const pageCount = Math.max(1, Math.ceil(sortedRecords.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const statusCounts = useMemo(() => records.reduce((counts, record) => { counts[record.Status] = (counts[record.Status] || 0) + 1; return counts }, {}), [records])
  const liveCount = records.filter((record) => record['Emb Live'] === 'Live').length
  const navigate = (view) => { setActiveView(view); setSidebarOpen(false) }
  const updateFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1) }
  const sortBy = (key) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-lockup"><span className="brand-mark">B</span><span><strong>BRISQUE</strong><small>Web Dashboard</small></span></div>
      <div className="workspace-label">WORKSPACE <span>2026</span></div>
      <nav className="main-nav" aria-label="Main navigation">{navItems.map((item) => <button key={item.id} className={activeView === item.id ? 'nav-item active' : 'nav-item'} onClick={() => navigate(item.id)}><span className="nav-number">{item.short}</span>{item.label}</button>)}</nav>
      <div className="sidebar-footer"><div className="health-line"><i /> All systems operational</div><div className="user-line"><span className="avatar">SP</span><span><strong>Srini P</strong><small>Administrator</small></span><span className="chevron">⌄</span></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="menu-button" onClick={() => setSidebarOpen((open) => !open)} aria-label="Toggle navigation">☰</button><div className="breadcrumb">Operations <span>/</span> <strong>{navItems.find((item) => item.id === activeView)?.label}</strong></div><div className="topbar-actions"><div className="global-search"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search clients and brands" /></div><button className="icon-button" aria-label="Notifications">◌<b /></button><span className="top-avatar">SP</span></div></header>
      <div className="page-wrap">
        {activeView === 'dashboard' && <Dashboard records={records} statusCounts={statusCounts} liveCount={liveCount} dataSource={dataSource} dataLoadError={dataLoadError} onViewTracker={() => navigate('tracker')} />}
        {activeView === 'tracker' && <TrackerView records={pagedRecords} filterRecords={records} total={sortedRecords.length} page={currentPage} pageCount={pageCount} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} query={query} setQuery={setQuery} filters={filters} updateFilter={updateFilter} visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} showColumns={showColumns} setShowColumns={setShowColumns} sort={sort} sortBy={sortBy} onSelect={setSelectedClient} />}
        {activeView === 'features' && <FeaturesView records={records} />}
        {activeView === 'migration' && <MigrationView records={records} />}
      </div>
    </main>
    {selectedClient && <ClientDrawer record={selectedClient} onClose={() => setSelectedClient(null)} />}
  </div>
}
function PageHeader({ eyebrow, title, description, action }) { return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div> }
function Dashboard({ records, statusCounts, liveCount, dataSource, dataLoadError, onViewTracker }) {
  const onboardingStages = [
    { label: 'To do', statuses: ['Not Started', 'Pending', 'NA'] },
    { label: 'Ongoing', statuses: ['In Progress'] },
    { label: 'Done', statuses: ['Completed', 'Live'] },
  ]
  const stageCounts = onboardingStages.map((stage) => ({ ...stage, count: stage.statuses.reduce((total, status) => total + (statusCounts[status] || 0), 0) }))
  const maxCount = Math.max(...stageCounts.map((stage) => stage.count))
  const done = stageCounts.find((stage) => stage.label === 'Done').count
  const ongoing = stageCounts.find((stage) => stage.label === 'Ongoing').count
  const toDo = stageCounts.find((stage) => stage.label === 'To do').count
  return <><PageHeader eyebrow="Leadership overview" title="Client onboarding command centre" description="See every client moving through onboarding, what is done, what is ongoing, and what needs to start." action={<button className="button button-dark" onClick={onViewTracker}>Open tracker <span>→</span></button>} />
    <div className="metric-strip"><Metric label="Total clients" value={records.length} note={`Source: ${dataSource}`} /><Metric label="Done" value={done} note={`${Math.round((done / records.length) * 100)}% completed`} tone="green" /><Metric label="Ongoing" value={ongoing} note="Active onboarding work" tone="amber" /><Metric label="To do" value={toDo} note="Waiting to begin" tone="blue" /></div>{dataLoadError && <div className="data-warning">Sheet data could not be loaded. Showing local fallback data. <span>{dataLoadError}</span></div>}
    <div className="dashboard-grid"><section className="panel status-panel"><div className="section-heading"><div><p className="eyebrow">Onboarding flow</p><h2>Where each client stands</h2></div><span className="muted">{records.length} clients</span></div><div className="bar-list">{stageCounts.map(({ label, count }) => <div className="bar-row" key={label}><div className="bar-label"><StatusMark value={label} /><strong>{count}</strong></div><div className="bar-track"><span style={{ width: `${(count / maxCount) * 100}%` }} /></div><small>{Math.round((count / records.length) * 100)}%</small></div>)}</div><div className="status-foot"><span>Last updated today at 09:42</span><button className="text-button" onClick={onViewTracker}>View all clients →</button></div></section><section className="panel attention-panel"><div className="section-heading"><div><p className="eyebrow">Leadership attention</p><h2>Needs a decision</h2></div><span className="signal">● Live</span></div><div className="attention-list"><AttentionItem label="To do onboarding items" value={toDo} tone="amber" /><AttentionItem label="Not yet embedded" value={records.filter((record) => record['Emb Live'] !== 'Live').length} tone="red" /><AttentionItem label="Pending QA approval" value={records.filter((record) => record['QA Approval'] === 'Pending').length} tone="blue" /></div><div className="panel-note">The tracker contains the operational detail behind this leadership view.</div></section></div>
    <section className="panel recent-panel"><div className="section-heading"><div><p className="eyebrow">Recent portfolio view</p><h2>Client delivery pulse</h2></div><button className="text-button" onClick={onViewTracker}>Full tracker →</button></div><div className="mini-table"><div className="mini-row mini-head"><span>Client</span><span>Status</span><span>Migration</span></div>{records.slice(0, 5).map((record) => <div className="mini-row" key={record.Client}><span><strong>{record.Client}</strong><small>{record.Brand} · {record.Country}</small></span><StatusMark value={record.Status} /><StatusMark value={record['Migration Status']} /></div>)}</div></section>
  </>
}
function Metric({ label, value, note, tone = '' }) { return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div> }
function AttentionItem({ label, value, tone }) { return <div className="attention-item"><i className={`dot dot-${tone}`} /><span>{label}</span><strong>{value}</strong></div> }
function TrackerView({ records, filterRecords, total, page, pageCount, pageSize, setPage, setPageSize, query, setQuery, filters, updateFilter, visibleColumns, setVisibleColumns, showColumns, setShowColumns, sort, sortBy, onSelect }) {
  return <><PageHeader eyebrow="Client operations" title="Client tracker" description="The working view for embedded ordering readiness and migration delivery." action={<button className="button button-dark" onClick={() => setQuery('')}>Clear search <span>×</span></button>} /><div className="tracker-toolbar"><div className="tracker-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the tracker" /></div>{['Status'].map((key) => <select key={key} value={filters[key]} onChange={(event) => updateFilter(key, event.target.value)} aria-label={`Filter by ${key}`}><option value="">{key}</option>{filterOptions(key, filterRecords).map((option) => <option key={option} value={option}>{option}</option>)}</select>)}<div className="column-control"><button className="filter-button" onClick={() => setShowColumns((show) => !show)}>Columns <span>⌄</span></button>{showColumns && <div className="column-menu">{tableColumns.map((column) => <label key={column.key}><input type="checkbox" checked={visibleColumns.includes(column.key)} onChange={() => setVisibleColumns((current) => current.includes(column.key) ? current.filter((key) => key !== column.key) : [...current, column.key])} />{column.label}</label>)}</div>}</div></div><section className="panel tracker-panel"><div className="table-meta"><span><strong>{total}</strong> clients shown</span><span className="table-meta-right">Click a row to inspect the full record</span></div><div className="table-scroll"><table><thead><tr>{tableColumns.filter((column) => visibleColumns.includes(column.key)).map((column) => <th key={column.key}><button onClick={() => sortBy(column.key)}>{column.label}<span className={sort.key === column.key ? 'sort-active' : ''}>{sort.key === column.key && sort.direction === 'desc' ? '↓' : '↑'}</span></button></th>)}</tr></thead><tbody>{records.length === 0 ? <tr><td colSpan={visibleColumns.length} className="empty-state"><strong>No tracker records found</strong><span>Try adjusting your search or filters.</span></td></tr> : records.map((record) => <tr key={record.Client} onClick={() => onSelect(record)}>{tableColumns.filter((column) => visibleColumns.includes(column.key)).map((column) => <td key={column.key}>{column.key === 'Client' ? <span className="client-cell"><strong>{record[column.key]}</strong><small>{record.Brand}</small></span> : ['Emb Live', 'Status', 'Migration Status', 'QA Approval'].includes(column.key) ? <StatusMark value={record[column.key]} /> : record[column.key] || <span className="table-empty">—</span>}</td>)}</tr>)}</tbody></table></div><div className="table-footer"><span>Showing {records.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} of {total}</span><div className="pagination"><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }} aria-label="Rows per page"><option value="8">8 rows</option><option value="12">12 rows</option></select><button disabled={page === 1} onClick={() => setPage(page - 1)}>←</button><span>{page} / {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage(page + 1)}>→</button></div></div></section></>
}
function FeaturesView({ records }) { return <><PageHeader eyebrow="Feature enablement" title="Capability coverage" description="Review feature readiness by client across embedded ordering and the next service capabilities." /><section className="panel feature-panel"><div className="section-heading"><div><p className="eyebrow">Client feature matrix</p><h2>Enablement by client</h2></div><span className="muted">{records.length} clients · {featureFields.length} capabilities</span></div><div className="feature-table-scroll"><table className="feature-table"><thead><tr><th>Client name</th>{featureFields.map((feature) => <th key={feature}>{feature}</th>)}</tr></thead><tbody>{records.map((record) => <tr key={record.Client}><td><strong>{record.Client}</strong><small>{record.Brand}</small></td>{featureFields.map((feature) => <td key={feature}><StatusMark value={record[feature]} /></td>)}</tr>)}</tbody></table></div></section></> }
function MigrationView({ records }) { const counts = records.reduce((result, record) => { result[record['Migration Status']] = (result[record['Migration Status']] || 0) + 1; return result }, {}); return <><PageHeader eyebrow="Migration programme" title="Migration readiness" description="Track stack transitions, quarters, and current migration momentum across the portfolio." /><div className="metric-strip"><Metric label="Completed" value={counts.Completed || 0} note="Migration finished" tone="green" /><Metric label="In progress" value={counts['In Progress'] || 0} note="Currently moving" tone="amber" /><Metric label="Not started" value={counts['Not Started'] || 0} note="Needs planning" /><Metric label="Target quarter" value="Q3" note="Most active quarter" tone="blue" /></div><section className="panel migration-panel"><div className="section-heading"><div><p className="eyebrow">Portfolio by quarter</p><h2>Planned movement</h2></div></div><div className="migration-list">{['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'].map((quarter) => { const quarterRecords = records.filter((record) => record['Migration Quarter'] === quarter); return <div className="migration-row" key={quarter}><strong>{quarter}</strong><div className="migration-bar"><span style={{ width: `${(quarterRecords.length / records.length) * 100}%` }} /></div><span>{quarterRecords.length} clients</span><small>{quarterRecords.filter((record) => record['Migration Status'] === 'Completed').length} complete</small></div> })}</div></section></> }
function ClientDrawer({ record, onClose }) { const sections = [['Client', ['LIVE LINK']], ['Embedded ordering', ['Emb Status', 'Emb Live']], ['Migration', ['Current Stack', 'Target Stack', 'Migration Quarter', 'Migration Status']], ['Quality', ['SEO', 'QA Approval', 'Deployed Date']]]; return <div className="drawer-backdrop" onClick={onClose}><aside className="client-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-top"><div><p className="eyebrow">Client record</p><h2>{record.Client}</h2><span>{record.Brand} · {record.Country} · {record.Region}</span></div><button className="close-button" onClick={onClose}>×</button></div><div className="drawer-status"><StatusMark value={record.Status} /><span>Updated today</span></div>{sections.map(([title, fields]) => <section className="drawer-section" key={title}><p className="eyebrow">{title}</p>{fields.map((field) => <div className="detail-line" key={field}><span>{field}</span><strong>{record[field] || 'Not set'}</strong></div>)}</section>)}<section className="drawer-section"><p className="eyebrow">Remarks</p><p className="remarks">{record.Remarks || 'No remarks recorded for this client.'}</p></section></aside></div> }
export default App
